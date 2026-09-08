import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, UserSession, MatchPayload, ChatMode } from '@samvada/shared';
import { QueueService } from '../redis/queueService.js';
import { Matcher } from '../matchmaking/matcher.js';
import { normalizeInterest } from '../matchmaking/interestEngine.js';
import { db } from '../db/pool.js';
import { config } from '../config.js';

export class MatchHandler {
  static register(io: Server, socket: Socket, sessionMap: Map<string, UserSession>) {
    /**
     * User joins matchmaking queue with selected interests
     */
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, async (data: { sessionId: string; interests: string[]; chatMode?: ChatMode; displayName?: string; avatarEmoji?: string }) => {
      try {
        if (!data || !data.sessionId) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_SESSION', message: 'Session ID is required.' });
          return;
        }

        // Validate and clean interests (max 5)
        const rawInterests = Array.isArray(data.interests) ? data.interests : [];
        const cleanInterests = rawInterests
          .slice(0, config.MAX_INTERESTS)
          .map(i => String(i).trim().slice(0, 30))
          .filter(Boolean);

        const normalized = cleanInterests.map(normalizeInterest);

        const user: UserSession = {
          sessionId: data.sessionId,
          socketId: socket.id,
          interests: cleanInterests,
          normalizedInterests: normalized,
          joinedQueueAt: Date.now(),
          chatMode: data.chatMode || 'video',
          displayName: data.displayName?.trim().slice(0, 20) || 'Stranger',
          avatarEmoji: data.avatarEmoji?.trim().slice(0, 4) || '👤',
        };

        sessionMap.set(socket.id, user);

        // Check helper to see if socket is connected
        const isSocketConnected = (sockId: string) => {
          const s = io.sockets.sockets.get(sockId);
          return !!(s && s.connected);
        };

        // Attempt real-time match against existing real candidates
        const match = await Matcher.findMatchForUser(user, isSocketConnected);

        if (match) {
          // Real match found!
          // User A payload (initiator creates WebRTC offer)
          const payloadA: MatchPayload = {
            matchId: match.matchId,
            partnerId: 'Stranger',
            partnerName: match.userB.displayName || 'Stranger',
            partnerEmoji: match.userB.avatarEmoji || '👤',
            sharedInterests: match.sharedInterests,
            isInitiator: true,
            chatMode: user.chatMode,
          };

          // User B payload (receiver answers WebRTC offer)
          const payloadB: MatchPayload = {
            matchId: match.matchId,
            partnerId: 'Stranger',
            partnerName: user.displayName || 'Stranger',
            partnerEmoji: user.avatarEmoji || '👤',
            sharedInterests: match.sharedInterests,
            isInitiator: false,
            chatMode: match.userB.chatMode,
          };

          // Emit to both real users
          socket.emit(SOCKET_EVENTS.MATCH_FOUND, payloadA);
          io.to(match.userB.socketId).emit(SOCKET_EVENTS.MATCH_FOUND, payloadB);

          // Update memory map with match info
          user.currentMatchId = match.matchId;
          user.matchedWith = match.userB.sessionId;
          const userB = sessionMap.get(match.userB.socketId);
          if (userB) {
            userB.currentMatchId = match.matchId;
            userB.matchedWith = user.sessionId;
          }
        } else {
          // No other real users available right now -> enqueue and wait
          await QueueService.enqueueUser(user);
          const stats = await QueueService.getStats();
          socket.emit(SOCKET_EVENTS.QUEUE_WAITING, { waitingCount: stats.waitingCount });
        }
      } catch (err: any) {
        console.error('[MatchHandler] Error joining queue:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
      }
    });

    /**
     * User skips current conversation
     */
    socket.on(SOCKET_EVENTS.SKIP, async (data: { matchId: string }) => {
      try {
        const user = sessionMap.get(socket.id);
        if (!user || !data?.matchId) return;

        const match = await QueueService.getActiveMatch(data.matchId);
        if (!match) return;

        // End the active match
        await QueueService.endActiveMatch(data.matchId);
        await db.recordMatchEnd(data.matchId, 'skip');

        // Identify partner
        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        // Clean match pointers
        user.currentMatchId = undefined;
        user.matchedWith = undefined;

        const partnerSession = sessionMap.get(partner.socketId);
        if (partnerSession) {
          partnerSession.currentMatchId = undefined;
          partnerSession.matchedWith = undefined;
        }

        // Notify partner that peer skipped (clean single notification)
        io.to(partner.socketId).emit(SOCKET_EVENTS.PARTNER_SKIPPED, {
          message: 'The other person skipped.',
        });
      } catch (err: any) {
        console.error('[MatchHandler] Error handling skip:', err);
      }
    });

    /**
     * User leaves matchmaking queue voluntarily
     */
    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, async (data: { sessionId: string }) => {
      try {
        if (data?.sessionId) {
          await QueueService.dequeueUser(data.sessionId);
        }
      } catch (err) {
        console.error('[MatchHandler] Error leaving queue:', err);
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  static async handleDisconnect(io: Server, socket: Socket, sessionMap: Map<string, UserSession>) {
    const user = sessionMap.get(socket.id);
    if (!user) return;

    // 1. Remove from waiting queue if waiting
    await QueueService.dequeueUser(user.sessionId);

    // 2. If in an active match, notify partner and end match
    if (user.currentMatchId) {
      const match = await QueueService.getActiveMatch(user.currentMatchId);
      if (match) {
        await QueueService.endActiveMatch(user.currentMatchId);
        await db.recordMatchEnd(user.currentMatchId, 'disconnect');

        const isUserA = match.userA.sessionId === user.sessionId;
        const partner = isUserA ? match.userB : match.userA;

        io.to(partner.socketId).emit(SOCKET_EVENTS.PARTNER_DISCONNECTED, {
          message: 'The other person disconnected.',
        });

        const partnerSession = sessionMap.get(partner.socketId);
        if (partnerSession) {
          partnerSession.currentMatchId = undefined;
          partnerSession.matchedWith = undefined;
        }
      }
    }

    sessionMap.delete(socket.id);
  }
}
