import { Router } from 'express';
import { db } from '../db/pool.js';
import { redisService } from '../redis/client.js';
import { config } from '../config.js';
import { z } from 'zod';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    storage: {
      redisUsingFallback: redisService.isUsingFallback,
      dbUsingFallback: db.isUsingFallback,
    }
  });
});

// RTC Configuration (IceServers STUN & TURN)
apiRouter.get('/config/rtc', (req, res) => {
  const iceServers: RTCIceServer[] = [];

  // Add STUN servers
  for (const stun of config.STUN_SERVERS) {
    iceServers.push({ urls: stun.startsWith('stun:') ? stun : `stun:${stun}` });
  }

  // Add optional TURN server
  if (config.TURN_SERVER) {
    const turnEntry: RTCIceServer = {
      urls: config.TURN_SERVER.startsWith('turn:') ? config.TURN_SERVER : `turn:${config.TURN_SERVER}`,
    };
    if (config.TURN_USERNAME) turnEntry.username = config.TURN_USERNAME;
    if (config.TURN_PASSWORD) turnEntry.credential = config.TURN_PASSWORD;
    iceServers.push(turnEntry);
  }

  res.json({ iceServers });
});

// Report User
const reportSchema = z.object({
  reporterSessionId: z.string().min(1),
  reportedSessionId: z.string().min(1),
  reason: z.enum(['harassment', 'spam', 'inappropriate', 'offensive', 'other']),
  details: z.string().max(500).optional(),
  matchId: z.string().optional(),
});

apiRouter.post('/report', async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid report data', details: parsed.error.issues });
    }

    const { reporterSessionId, reportedSessionId, reason, details, matchId } = parsed.data;

    const report = await db.createReport({
      reporterSessionId,
      reportedSessionId,
      reason,
      details,
      matchId,
    });

    await db.logSafety(reportedSessionId, 'USER_REPORTED', {
      reporterSessionId,
      reason,
      matchId,
    });

    return res.status(201).json({ success: true, reportId: report.id });
  } catch (err: any) {
    console.error('[API Report Error]', err);
    return res.status(500).json({ error: 'Failed to record report' });
  }
});

// Block User
const blockSchema = z.object({
  blockerSessionId: z.string().min(1),
  blockedSessionId: z.string().min(1),
  matchId: z.string().optional(),
});

apiRouter.post('/block', async (req, res) => {
  try {
    const parsed = blockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid block data', details: parsed.error.issues });
    }

    const { blockerSessionId, blockedSessionId, matchId } = parsed.data;

    await db.createBlock({
      blockerSessionId,
      blockedSessionId,
      matchId,
    });

    return res.status(201).json({ success: true, message: 'User blocked' });
  } catch (err: any) {
    console.error('[API Block Error]', err);
    return res.status(500).json({ error: 'Failed to record block' });
  }
});
