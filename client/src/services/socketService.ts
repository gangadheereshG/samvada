import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@samvada/shared';

class SocketService {
  private socket: Socket | null = null;

  getSocket(): Socket {
    if (!this.socket) {
      // Connect to window.location origin by default or custom configured VITE_SERVER_URL
      const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || undefined;
      this.socket = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected with id:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });
    }
    return this.socket;
  }

  joinQueue(
    sessionId: string,
    interests: string[],
    chatMode: 'text' | 'video' = 'video',
    displayName?: string,
    avatarEmoji?: string
  ) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.JOIN_QUEUE, { sessionId, interests, chatMode, displayName, avatarEmoji });
  }

  leaveQueue(sessionId: string) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.LEAVE_QUEUE, { sessionId });
  }

  sendMessage(matchId: string, text: string) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.CHAT_MESSAGE, { matchId, text });
  }

  sendTyping(matchId: string, isTyping: boolean) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.CHAT_TYPING, { matchId, isTyping });
  }

  skip(matchId: string) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.SKIP, { matchId });
  }

  sendWebRTCOffer(matchId: string, sdp: RTCSessionDescriptionInit) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.WEBRTC_OFFER, { matchId, sdp });
  }

  sendWebRTCAnswer(matchId: string, sdp: RTCSessionDescriptionInit) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.WEBRTC_ANSWER, { matchId, sdp });
  }

  sendIceCandidate(matchId: string, candidate: RTCIceCandidateInit) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, { matchId, candidate });
  }

  sendMediaState(matchId: string, micEnabled: boolean, cameraEnabled: boolean) {
    const s = this.getSocket();
    s.emit(SOCKET_EVENTS.MEDIA_STATE_CHANGE, { matchId, micEnabled, cameraEnabled });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
