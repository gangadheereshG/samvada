import path from 'path';
import fs from 'fs';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { db } from './db/pool.js';
import { redisService } from './redis/client.js';
import { initializeSocket } from './socket/socketHandler.js';
import { apiRouter } from './routes/api.js';

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [config.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || config.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP in dev or let reverse proxy handle it
    crossOriginEmbedderPolicy: false,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '50kb' }));

// REST Routes
app.use('/api', apiRouter);

// Serve built frontend in production if dist directory exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6, // 1MB
});

async function startServer() {
  try {
    console.log('--- Initializing SAMVADA Server ---');
    await db.initialize();
    await redisService.initialize();

    initializeSocket(io);

    server.listen(config.PORT, '0.0.0.0', () => {
      console.log(`[SAMVADA] Server is live on http://localhost:${config.PORT}`);
      console.log(`[SAMVADA] Client URL: ${config.CLIENT_URL}`);
      console.log(`[SAMVADA] Strict human-to-human matching active.`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down SAMVADA server...');
  server.close(() => {
    console.log('HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
