import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  UserSession,
  WebRTCOfferPayload,
  WebRTCAnswerPayload,
  WebRTCIceCandidatePayload,
  MediaStatePayload,
} from '@samvada/shared';
import { QueueService } from '../redis/queueService.js';

export class WebRTCHandler {
  static register(io: Server, socket: Socket, sessionMap: Map<string, UserSession>) {
    /**
     * WebRTC SDP Offer Signaling
     */
    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, async (data: WebRTCOfferPayload) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId || !data?.sdp) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        // Relay SDP Offer to the matched partner
        io.to(partner.socketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, data);
      } catch (err) {
        console.error('[WebRTCHandler] Error relaying offer:', err);
      }
    });

    /**
     * WebRTC SDP Answer Signaling
     */
    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, async (data: WebRTCAnswerPayload) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId || !data?.sdp) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        // Relay SDP Answer to the matched partner
        io.to(partner.socketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, data);
      } catch (err) {
        console.error('[WebRTCHandler] Error relaying answer:', err);
      }
    });

    /**
     * WebRTC ICE Candidate Signaling
     */
    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, async (data: WebRTCIceCandidatePayload) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId || !data?.candidate) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        // Relay ICE Candidate to the matched partner
        io.to(partner.socketId).emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, data);
      } catch (err) {
        console.error('[WebRTCHandler] Error relaying ICE candidate:', err);
      }
    });

    /**
     * Media state change notification (Mic muted / Camera toggled)
     */
    socket.on(SOCKET_EVENTS.MEDIA_STATE_CHANGE, async (data: MediaStatePayload) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        // Relay peer media state
        io.to(partner.socketId).emit(SOCKET_EVENTS.PARTNER_MEDIA_STATE, data);
      } catch (err) {
        console.error('[WebRTCHandler] Error relaying media state:', err);
      }
    });
  }
}
