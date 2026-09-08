import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS, WebRTCOfferPayload, WebRTCAnswerPayload, WebRTCIceCandidatePayload, MediaStatePayload } from '@samvada/shared';

// Module-level cached ICE servers (avoids HTTP round-trip on every call setup)
let cachedIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

if (typeof window !== 'undefined') {
  fetch('/api/config/rtc')
    .then(res => res.json())
    .then(data => {
      if (data?.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        cachedIceServers = data.iceServers;
      }
    })
    .catch(() => {});
}

interface UseWebRTCProps {
  matchId: string | null;
  isInitiator: boolean;
  isActive: boolean;
  onError?: (msg: string) => void;
}

export function useWebRTC({ matchId, isInitiator, isActive, onError }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const [partnerMicEnabled, setPartnerMicEnabled] = useState<boolean>(true);
  const [partnerCameraEnabled, setPartnerCameraEnabled] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RTCPeerConnectionState>('new');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Cleanup helper for the peer connection (preserves camera for seamless instant rematch)
  const cleanupPeer = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    setConnectionStatus('closed');
  }, []);

  // Full teardown of camera and connection (e.g. when cutting call or returning home)
  const stopAllMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    cleanupPeer();
  }, [cleanupPeer]);

  // Teardown camera on hook unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      cleanupPeer();
    };
  }, [cleanupPeer]);

  // Request or reuse user media
  const initMedia = useCallback(async (): Promise<MediaStream | null> => {
    // If local tracks are already active, reuse them instantly without re-prompting or blinking
    if (localStreamRef.current && localStreamRef.current.getTracks().some(t => t.readyState === 'live')) {
      setLocalStream(localStreamRef.current);
      return localStreamRef.current;
    }

    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicEnabled(true);
      setCameraEnabled(true);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Media access error:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera or microphone access denied. Please grant permissions to continue video chat.'
        : 'Could not access camera/microphone. Please ensure they are not used by another app.';
      setPermissionError(msg);
      onError?.(msg);
      return null;
    }
  }, [onError]);

  // Establish WebRTC connection
  useEffect(() => {
    if (!isActive || !matchId) {
      cleanupPeer();
      return;
    }

    const activeMatchId = matchId;
    let isMounted = true;
    const socket = socketService.getSocket();

    // Queues for signals arriving before PeerConnection or RemoteDescription is ready
    let pendingOffer: RTCSessionDescriptionInit | null = null;
    let pendingAnswer: RTCSessionDescriptionInit | null = null;
    const candidateQueue: RTCIceCandidateInit[] = [];
    let isRemoteDescSet = false;

    const flushCandidates = async (pc: RTCPeerConnection) => {
      while (candidateQueue.length > 0) {
        const cand = candidateQueue.shift();
        if (cand) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('[WebRTC] Flush candidate error:', e);
          }
        }
      }
    };

    async function setupPeer() {
      // 1. Get user media (instantly returns if already active)
      const stream = await initMedia();
      if (!stream || !isMounted) return;

      // 2. Create RTCPeerConnection synchronously using cached ICE servers
      const pc = new RTCPeerConnection({
        iceServers: cachedIceServers,
        iceCandidatePoolSize: 10,
      });
      peerConnectionRef.current = pc;

      // Track connection state
      pc.onconnectionstatechange = () => {
        if (isMounted) {
          setConnectionStatus(pc.connectionState);
        }
      };

      // Safety check: When ICE connected, ensure receivers are mapped to remoteStream
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          const receivers = pc.getReceivers().map(r => r.track).filter(Boolean);
          if (receivers.length > 0 && isMounted) {
            const newStream = new MediaStream(receivers as MediaStreamTrack[]);
            remoteStreamRef.current = newStream;
            setRemoteStream(newStream);
          }
        }
      };

      // Add local media tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks with multi-browser compatibility
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const incoming = event.streams[0];
          remoteStreamRef.current = incoming;
          if (isMounted) {
            setRemoteStream(new MediaStream(incoming.getTracks()));
          }
        } else {
          if (isMounted) {
            setRemoteStream(prev => {
              const existing = prev ? prev.getTracks().filter(t => t.id !== event.track.id) : [];
              const combined = new MediaStream([...existing, event.track]);
              remoteStreamRef.current = combined;
              return combined;
            });
          }
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(activeMatchId, event.candidate.toJSON());
        }
      };

      // If an offer arrived while PC was preparing, process it immediately!
      if (pendingOffer) {
        const offerSdp = pendingOffer;
        pendingOffer = null;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
          isRemoteDescSet = true;
          await flushCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketService.sendWebRTCAnswer(activeMatchId, answer);
        } catch (err) {
          console.error('[WebRTC] Error processing early offer:', err);
        }
      } else if (isInitiator) {
        // Only if initiator and no offer was queued
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          socketService.sendWebRTCOffer(activeMatchId, offer);
        } catch (err) {
          console.error('[WebRTC] Failed to create offer:', err);
        }
      }

      // If an answer arrived while PC was preparing, process it immediately!
      if (pendingAnswer) {
        const answerSdp = pendingAnswer;
        pendingAnswer = null;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
          isRemoteDescSet = true;
          await flushCandidates(pc);
        } catch (err) {
          console.error('[WebRTC] Error processing early answer:', err);
        }
      }
    }

    setupPeer();

    // Socket Event Listeners for WebRTC signaling
    const handleOffer = async (data: WebRTCOfferPayload) => {
      if (data.matchId !== activeMatchId) return;
      const pc = peerConnectionRef.current;
      if (!pc) {
        // PC still initializing, stash offer for immediate execution
        pendingOffer = data.sdp;
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        isRemoteDescSet = true;
        await flushCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.sendWebRTCAnswer(activeMatchId, answer);
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    const handleAnswer = async (data: WebRTCAnswerPayload) => {
      if (data.matchId !== activeMatchId) return;
      const pc = peerConnectionRef.current;
      if (!pc) {
        pendingAnswer = data.sdp;
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        isRemoteDescSet = true;
        await flushCandidates(pc);
      } catch (err) {
        console.error('[WebRTC] Error handling answer:', err);
      }
    };

    const handleCandidate = async (data: WebRTCIceCandidatePayload) => {
      if (data.matchId !== activeMatchId) return;
      const pc = peerConnectionRef.current;
      if (!pc || !isRemoteDescSet) {
        candidateQueue.push(data.candidate);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    };

    const handlePartnerMediaState = (data: MediaStatePayload) => {
      if (data.matchId === activeMatchId && isMounted) {
        setPartnerMicEnabled(data.micEnabled);
        setPartnerCameraEnabled(data.cameraEnabled);
      }
    };

    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleCandidate);
    socket.on(SOCKET_EVENTS.PARTNER_MEDIA_STATE, handlePartnerMediaState);

    return () => {
      isMounted = false;
      socket.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socket.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socket.off(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleCandidate);
      socket.off(SOCKET_EVENTS.PARTNER_MEDIA_STATE, handlePartnerMediaState);
      cleanupPeer();
    };
  }, [isActive, matchId, isInitiator, cleanupPeer, initMedia]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setMicEnabled(nextState);
      if (matchId) {
        socketService.sendMediaState(matchId, nextState, cameraEnabled);
      }
    }
  }, [matchId, cameraEnabled]);

  // Toggle Camera (keeps audio going!)
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setCameraEnabled(nextState);
      if (matchId) {
        socketService.sendMediaState(matchId, micEnabled, nextState);
      }
    }
  }, [matchId, micEnabled]);

  return {
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    partnerMicEnabled,
    partnerCameraEnabled,
    permissionError,
    connectionStatus,
    toggleMic,
    toggleCamera,
    retryMedia: initMedia,
    stopAllMedia,
  };
}
