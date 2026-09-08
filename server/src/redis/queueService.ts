import { redisService } from './client.js';
import { config } from '../config.js';
import { UserSession } from '@samvada/shared';
import { db } from '../db/pool.js';

export class QueueService {
  private static pairKey(a: string, b: string): string {
    return [a, b].sort().join(':');
  }

  /**
   * Add a real user to the matchmaking queue
   */
  static async enqueueUser(user: UserSession): Promise<void> {
    const store = redisService.getStore();
    const data = JSON.stringify(user);
    await store.hset('waiting_users_hash', user.sessionId, data);
    await store.sadd('waiting_users_set', user.sessionId);
    await store.set(`presence:${user.sessionId}`, user.socketId, 'EX', 3600);
  }

  /**
   * Remove a user from the matchmaking queue
   */
  static async dequeueUser(sessionId: string): Promise<void> {
    const store = redisService.getStore();
    await store.srem('waiting_users_set', sessionId);
    await store.hdel('waiting_users_hash', sessionId);
  }

  /**
   * Retrieve all currently waiting real users
   */
  static async getWaitingUsers(): Promise<UserSession[]> {
    const store = redisService.getStore();
    const all = await store.hgetall('waiting_users_hash');
    const users: UserSession[] = [];
    for (const json of Object.values(all)) {
      try {
        users.push(JSON.parse(json));
      } catch (err) {
        // ignore malformed
      }
    }
    return users;
  }

  /**
   * Checks if these two users were recently matched (prevent immediate rematch)
   */
  static async wereRecentlyMatched(sessionA: string, sessionB: string): Promise<boolean> {
    const store = redisService.getStore();
    const pair = this.pairKey(sessionA, sessionB);
    const exists = await store.get(`recent_match:${pair}`);
    return exists !== null;
  }

  /**
   * Record that two users were matched, preventing immediate rematch for TTL seconds
   */
  static async recordRecentMatch(sessionA: string, sessionB: string): Promise<void> {
    const store = redisService.getStore();
    const pair = this.pairKey(sessionA, sessionB);
    await store.set(`recent_match:${pair}`, '1', 'EX', config.RECENT_MATCH_TTL_SECONDS);
  }

  /**
   * Check if either user has blocked the other
   */
  static async areBlocked(sessionA: string, sessionB: string): Promise<boolean> {
    return db.isBlocked(sessionA, sessionB);
  }

  /**
   * Record an active match
   */
  static async setActiveMatch(matchId: string, userA: UserSession, userB: UserSession): Promise<void> {
    const store = redisService.getStore();
    const data = JSON.stringify({ matchId, userA, userB, startedAt: Date.now() });
    await store.set(`active_match:${matchId}`, data, 'EX', 14400); // 4 hours max
    await store.set(`user_match:${userA.sessionId}`, matchId, 'EX', 14400);
    await store.set(`user_match:${userB.sessionId}`, matchId, 'EX', 14400);
  }

  /**
   * Get an active match by ID
   */
  static async getActiveMatch(matchId: string): Promise<{ matchId: string; userA: UserSession; userB: UserSession } | null> {
    const store = redisService.getStore();
    const data = await store.get(`active_match:${matchId}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Get match ID for a specific session
   */
  static async getMatchForSession(sessionId: string): Promise<string | null> {
    const store = redisService.getStore();
    return store.get(`user_match:${sessionId}`);
  }

  /**
   * End an active match and clean up state
   */
  static async endActiveMatch(matchId: string): Promise<{ userA?: UserSession; userB?: UserSession } | null> {
    const store = redisService.getStore();
    const match = await this.getActiveMatch(matchId);
    if (match) {
      await store.del(`active_match:${matchId}`);
      await store.del(`user_match:${match.userA.sessionId}`);
      await store.del(`user_match:${match.userB.sessionId}`);
    }
    return match;
  }

  /**
   * Get counts of online & waiting users
   */
  static async getStats(): Promise<{ waitingCount: number }> {
    const store = redisService.getStore();
    const waiting = await store.smembers('waiting_users_set');
    return {
      waitingCount: waiting.length,
    };
  }
}
