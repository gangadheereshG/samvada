import pg from 'pg';
import { config } from '../config.js';

export interface ReportRecord {
  reporterSessionId: string;
  reportedSessionId: string;
  reason: string;
  details?: string;
  matchId?: string;
}

export interface BlockRecord {
  blockerSessionId: string;
  blockedSessionId: string;
  matchId?: string;
}

export interface MatchStartRecord {
  matchId: string;
  userASessionId: string;
  userBSessionId: string;
  sharedInterests: string[];
}

// In-Memory Database Fallback for Development
class InMemoryDb {
  private reports: Array<ReportRecord & { id: string; createdAt: Date }> = [];
  private blocks: Array<BlockRecord & { id: string; createdAt: Date }> = [];
  private matches: Map<string, { id: string; userA: string; userB: string; shared: string[]; startedAt: Date; endedAt?: Date; endReason?: string }> = new Map();
  private safetyLogs: Array<{ id: string; sessionId: string; eventType: string; metadata: any; createdAt: Date }> = [];

  async createReport(record: ReportRecord) {
    const entry = { ...record, id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, createdAt: new Date() };
    this.reports.push(entry);
    return entry;
  }

  async createBlock(record: BlockRecord) {
    const existing = this.blocks.find(b => b.blockerSessionId === record.blockerSessionId && b.blockedSessionId === record.blockedSessionId);
    if (existing) return existing;
    const entry = { ...record, id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, createdAt: new Date() };
    this.blocks.push(entry);
    return entry;
  }

  async isBlocked(sessionA: string, sessionB: string): Promise<boolean> {
    return this.blocks.some(
      b => (b.blockerSessionId === sessionA && b.blockedSessionId === sessionB) ||
           (b.blockerSessionId === sessionB && b.blockedSessionId === sessionA)
    );
  }

  async recordMatchStart(record: MatchStartRecord) {
    this.matches.set(record.matchId, {
      id: record.matchId,
      userA: record.userASessionId,
      userB: record.userBSessionId,
      shared: record.sharedInterests,
      startedAt: new Date()
    });
  }

  async recordMatchEnd(matchId: string, endReason: string) {
    const match = this.matches.get(matchId);
    if (match) {
      match.endedAt = new Date();
      match.endReason = endReason;
    }
  }

  async logSafety(sessionId: string, eventType: string, metadata: any) {
    this.safetyLogs.push({
      id: `safe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sessionId,
      eventType,
      metadata,
      createdAt: new Date()
    });
  }
}

class DatabaseService {
  private pool: pg.Pool | null = null;
  private inMemoryFallback = new InMemoryDb();
  public isUsingFallback = false;

  async initialize() {
    if (!config.DATABASE_URL) {
      console.log('[Database] No DATABASE_URL configured. Using in-memory fallback store.');
      this.isUsingFallback = true;
      return;
    }

    try {
      this.pool = new pg.Pool({
        connectionString: config.DATABASE_URL,
        connectionTimeoutMillis: 3000,
      });

      // Quick test query
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[Database] Connected successfully to PostgreSQL.');
    } catch (err: any) {
      console.warn(`[Database] PostgreSQL connection failed (${err.message}). Activating in-memory store for local development.`);
      this.isUsingFallback = true;
      this.pool = null;
    }
  }

  async createReport(record: ReportRecord) {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.createReport(record);
    }
    try {
      const query = `
        INSERT INTO reports (reporter_session_id, reported_session_id, reason, details, match_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at;
      `;
      const res = await this.pool.query(query, [
        record.reporterSessionId,
        record.reportedSessionId,
        record.reason,
        record.details || null,
        record.matchId || null,
      ]);
      return res.rows[0];
    } catch (err) {
      console.error('[Database] Error saving report, falling back to memory store:', err);
      return this.inMemoryFallback.createReport(record);
    }
  }

  async createBlock(record: BlockRecord) {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.createBlock(record);
    }
    try {
      const query = `
        INSERT INTO blocks (blocker_session_id, blocked_session_id, match_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (blocker_session_id, blocked_session_id) DO NOTHING
        RETURNING id;
      `;
      const res = await this.pool.query(query, [
        record.blockerSessionId,
        record.blockedSessionId,
        record.matchId || null,
      ]);
      return res.rows[0];
    } catch (err) {
      console.error('[Database] Error saving block, falling back to memory store:', err);
      return this.inMemoryFallback.createBlock(record);
    }
  }

  async isBlocked(sessionA: string, sessionB: string): Promise<boolean> {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.isBlocked(sessionA, sessionB);
    }
    try {
      const query = `
        SELECT 1 FROM blocks
        WHERE (blocker_session_id = $1 AND blocked_session_id = $2)
           OR (blocker_session_id = $2 AND blocked_session_id = $1)
        LIMIT 1;
      `;
      const res = await this.pool.query(query, [sessionA, sessionB]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[Database] Error checking block, using memory store:', err);
      return this.inMemoryFallback.isBlocked(sessionA, sessionB);
    }
  }

  async recordMatchStart(record: MatchStartRecord) {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.recordMatchStart(record);
    }
    try {
      const query = `
        INSERT INTO match_history (id, user_a_session_id, user_b_session_id, shared_interests, started_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      await this.pool.query(query, [
        record.matchId,
        record.userASessionId,
        record.userBSessionId,
        record.sharedInterests,
      ]);
    } catch (err) {
      console.error('[Database] Error recording match start:', err);
      this.inMemoryFallback.recordMatchStart(record);
    }
  }

  async recordMatchEnd(matchId: string, endReason: string) {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.recordMatchEnd(matchId, endReason);
    }
    try {
      const query = `
        UPDATE match_history
        SET ended_at = NOW(), end_reason = $1
        WHERE id = $2;
      `;
      await this.pool.query(query, [endReason, matchId]);
    } catch (err) {
      console.error('[Database] Error recording match end:', err);
      this.inMemoryFallback.recordMatchEnd(matchId, endReason);
    }
  }

  async logSafety(sessionId: string, eventType: string, metadata: any = {}) {
    if (this.isUsingFallback || !this.pool) {
      return this.inMemoryFallback.logSafety(sessionId, eventType, metadata);
    }
    try {
      const query = `
        INSERT INTO safety_logs (session_id, event_type, metadata)
        VALUES ($1, $2, $3);
      `;
      await this.pool.query(query, [sessionId, eventType, JSON.stringify(metadata)]);
    } catch (err) {
      this.inMemoryFallback.logSafety(sessionId, eventType, metadata);
    }
  }
}

export const db = new DatabaseService();
