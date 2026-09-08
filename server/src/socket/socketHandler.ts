import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, UserSession } from '@samvada/shared';
import { MatchHandler } from './matchHandler.js';
import { ChatHandler } from './chatHandler.js';
import { WebRTCHandler } from './webrtcHandler.js';
import { QueueService } from '../redis/queueService.js';

export function initializeSocket(io: Server) {
  // Ephemeral socketId -> UserSession mapping for active connections
  const sessionMap = new Map<string, UserSession>();

  io.on('connection', (socket: Socket) => {
    // Broadcast updated stats periodically or upon connection
    const broadcastStats = async () => {
      const stats = await QueueService.getStats();
      io.emit(SOCKET_EVENTS.STATS_UPDATE, {
        onlineCount: io.engine.clientsCount,
        waitingCount: stats.waitingCount,
      });
    };

    broadcastStats();

    // Register modular event handlers
    MatchHandler.register(io, socket, sessionMap);
    ChatHandler.register(io, socket, sessionMap);
    WebRTCHandler.register(io, socket, sessionMap);

    socket.on('disconnect', async () => {
      await MatchHandler.handleDisconnect(io, socket, sessionMap);
      broadcastStats();
    });

    socket.on('error', (err) => {
      console.error(`[Socket Error] ${socket.id}:`, err);
    });
  });
}
