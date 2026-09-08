import { UserSession } from '@samvada/shared';
import { QueueService } from '../redis/queueService.js';
import { calculateCompatibility } from './interestEngine.js';
import { db } from '../db/pool.js';
import crypto from 'crypto';

export interface MatchResult {
  matchId: string;
  userA: UserSession;
  userB: UserSession;
  sharedInterests: string[];
}

// Tracks seen candidates per session to ensure:
// 1. If 1 person online -> connect again and again.
// 2. If multiple people online -> connect all one by one without repeating until all are seen, then repeat cycle randomly!
const sessionSeenInCycle = new Map<string, Set<string>>();

export class Matcher {
  /**
   * Attempts to find a genuine real-human partner for the given user.
   * STRICT GUARANTEE: Returns null if no other real, eligible user is available.
   * Never creates fake or AI bots.
   */
  static async findMatchForUser(
    user: UserSession,
    isSocketConnected: (socketId: string) => boolean
  ): Promise<MatchResult | null> {
    const waitingUsers = await QueueService.getWaitingUsers();

    // 1. Filter eligible real candidates
    const eligibleCandidates: UserSession[] = [];
    for (const cand of waitingUsers) {
      // Must not be self
      if (cand.sessionId === user.sessionId || cand.socketId === user.socketId) {
        continue;
      }

      // Verify the candidate is genuinely currently connected
      if (!isSocketConnected(cand.socketId)) {
        await QueueService.dequeueUser(cand.sessionId);
        continue;
      }

      // Verify not blocked
      const blocked = await QueueService.areBlocked(user.sessionId, cand.sessionId);
      if (blocked) {
        continue;
      }

      eligibleCandidates.push(cand);
    }

    if (eligibleCandidates.length === 0) {
      // No real eligible candidates right now. User stays in queue.
      return null;
    }

    // 2. Cycle Selection Logic:
    // If only 1 other person is online, match them directly again and again!
    let candidatesPool = eligibleCandidates;

    if (eligibleCandidates.length > 1) {
      let seen = sessionSeenInCycle.get(user.sessionId);
      if (!seen) {
        seen = new Set<string>();
        sessionSeenInCycle.set(user.sessionId, seen);
      }

      const unseenCandidates = eligibleCandidates.filter(c => !seen!.has(c.sessionId));

      if (unseenCandidates.length > 0) {
        // Connect one by one to unseen candidates first
        candidatesPool = unseenCandidates;
      } else {
        // All candidates have been seen once! Reset cycle to connect with any of them again randomly
        seen.clear();
        candidatesPool = eligibleCandidates;
      }
    }

    // 3. Score candidates using smart interest matching
    const scoredCandidates = candidatesPool.map(cand => {
      const compat = calculateCompatibility(user.interests, cand.interests);
      return {
        candidate: cand,
        score: compat.score,
        sharedInterests: compat.sharedInterests,
      };
    });

    // 4. Selection Strategy:
    const matchingInterests = scoredCandidates.filter(c => c.score > 0);
    let selected: { candidate: UserSession; score: number; sharedInterests: string[] };

    if (matchingInterests.length > 0) {
      const maxScore = Math.max(...matchingInterests.map(c => c.score));
      const topPool = matchingInterests.filter(c => c.score >= maxScore - 1);
      const randomIndex = Math.floor(Math.random() * topPool.length);
      selected = topPool[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * scoredCandidates.length);
      selected = scoredCandidates[randomIndex];
    }

    // 5. Update seen cycle tracker
    if (!sessionSeenInCycle.has(user.sessionId)) {
      sessionSeenInCycle.set(user.sessionId, new Set());
    }
    sessionSeenInCycle.get(user.sessionId)!.add(selected.candidate.sessionId);

    // 6. Atomically remove both users from queue
    await QueueService.dequeueUser(user.sessionId);
    await QueueService.dequeueUser(selected.candidate.sessionId);

    // 7. Create match session
    const matchId = `match_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await QueueService.setActiveMatch(matchId, user, selected.candidate);

    // 8. Persist minimal match audit in database
    await db.recordMatchStart({
      matchId,
      userASessionId: user.sessionId,
      userBSessionId: selected.candidate.sessionId,
      sharedInterests: selected.sharedInterests,
    });

    console.log(`[Matcher] Real match created: ${matchId} between ${user.sessionId} and ${selected.candidate.sessionId} (Shared: ${selected.sharedInterests.join(', ') || 'None (Random Discovery)'})`);

    return {
      matchId,
      userA: user,
      userB: selected.candidate,
      sharedInterests: selected.sharedInterests,
    };
  }
}
