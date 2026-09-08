import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, UserSession, ChatMessage } from '@samvada/shared';
import { QueueService } from '../redis/queueService.js';
import { config } from '../config.js';
import crypto from 'crypto';

export class ChatHandler {
  static register(io: Server, socket: Socket, sessionMap: Map<string, UserSession>) {
    /**
     * Real-time text message forwarded directly to matched partner
     */
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (data: { matchId: string; text: string }) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId || !data?.text) return;

        const text = String(data.text).trim().slice(0, config.MAX_MESSAGE_LENGTH);
        if (!text) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        // Verify this user is part of the match
        const isUserA = match.userA.sessionId === user.sessionId;
        const isUserB = match.userB.sessionId === user.sessionId;
        if (!isUserA && !isUserB) return;

        const partner = isUserA ? match.userB : match.userA;

        const messagePayload: ChatMessage = {
          id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          senderSessionId: user.sessionId,
          text,
          timestamp: Date.now(),
          senderName: user.displayName || 'Stranger',
          senderEmoji: user.avatarEmoji || '👤',
        };

        // Deliver directly to partner socket
        io.to(partner.socketId).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, messagePayload);
      } catch (err) {
        console.error('[ChatHandler] Error processing message:', err);
      }
    });

    /**
     * Typing indicators
     */
    socket.on(SOCKET_EVENTS.CHAT_TYPING, async (data: { matchId: string; isTyping: boolean }) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        io.to(partner.socketId).emit(SOCKET_EVENTS.CHAT_TYPING_UPDATE, {
          isTyping: !!data.isTyping,
        });
      } catch (err) {
        // quiet error
      }
    });
  }
}
