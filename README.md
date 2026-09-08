# SAMVADA — Genuine Real-Time Human Chat Platform

> **SAMVADA** is a genuine real-human random video and text chat platform built with modern WebRTC, Socket.IO, Redis, and PostgreSQL.
>
> 🚨 **Core Principle**: ZERO AI users, ZERO chatbots, ZERO simulated matches, ZERO fake video. Only real people currently connected to the website can be matched. If only one person is online, that person waits.

---

## Features

- **100% Real Human-to-Human Connection**: Strict server-side verification ensures every match is between two live, connected browser sockets.
- **Smart Interest Matching & Normalization**: Semantic normalization recognizes related concepts (`programming` ↔ `coding`, `gaming` ↔ `games`, `movies` ↔ `films`, `fitness` ↔ `workout`, etc.) and scores affinity.
- **Random Discovery**: When multiple compatible real users exist, the system randomly selects among suitable candidates.
- **High-Definition WebRTC Video & Audio**: Direct peer-to-peer streaming with floating local preview and automatic placeholder avatars when cameras are turned off (audio persists).
- **Web Audio API Voice Indicator**: Analyzes genuine incoming audio frequencies from the remote participant in real-time to animate responsive voice wave bars.
- **Simultaneous Text Chat During Video**: Text side panel on desktop and bottom drawer on mobile while video and audio are active.
- **Instant Skip & Rematch Protection**: Clean teardown of media connections; the skipping user re-enters the matchmaking queue with preserved interests, and Redis prevents immediate rematches with the same person.
- **No Login / 100% Anonymous**: Ephemeral sessions; no email, passwords, Google OAuth, or profiles required.
- **Atmospheric Animated Sky**: Subtly moving clouds, ambient light, stars, and particles supporting Light and Dark modes.
- **Safety & Moderation**: Integrated user reporting, blocking, and rate limiting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Web Audio API |
| **Backend** | Node.js, Express.js, TypeScript |
| **Real-Time Communication** | Socket.IO |
| **P2P Audio / Video** | WebRTC (STUN / TURN supported) |
| **Temporary State** | Redis (Matchmaking queue, presence, recent match cache) |
| **Persistence** | PostgreSQL (Reports, blocks, safety audit logs) |

*Note: For rapid local development without Docker, both Redis and PostgreSQL feature transparent in-memory fallback stores that activate automatically if services are not reachable locally.*

---

## Project Structure

```text
Samvada/
├── shared/                 # Shared TypeScript types, data models & socket events
│   └── src/
│       ├── types.ts        # MatchState, UserSession, ChatMessage, Payloads
│       └── events.ts       # SOCKET_EVENTS constants
├── server/                 # Node.js + Express + Socket.IO Backend
│   └── src/
│       ├── index.ts        # Server entrypoint & HTTP/Socket setup
│       ├── config.ts       # Config & environment variables
│       ├── db/             # PostgreSQL pool & schema.sql
│       ├── redis/          # Redis client & queueService
│       ├── matchmaking/    # interestEngine & candidate matcher
│       ├── socket/         # matchHandler, chatHandler, webrtcHandler
│       └── routes/         # /api/health, /api/report, /api/block
├── client/                 # React + TypeScript + Vite Frontend
│   └── src/
│       ├── App.tsx         # Main state machine & screen transitions
│       ├── components/     # AnimatedSky, Navbar, Hero, InterestSelector, TextChat, VideoChat
│       ├── hooks/          # useWebRTC, useAudioActivity, useTheme
│       └── services/       # socketService, sessionService
├── docker-compose.yml      # Optional Postgres & Redis containers
└── .env.example            # Environment configuration template
```

---

## Quick Start

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
```

### 2. (Optional) Run Postgres & Redis via Docker
```bash
docker-compose up -d
```
*(If Docker is not running, the application will automatically operate using its embedded high-speed in-memory queue and store for zero-config testing).*

### 3. Run Development Server
```bash
npm run dev
```
- Backend starts at: `http://localhost:4000`
- Frontend starts at: `http://localhost:5173`

---

## Testing Two-User Matching Locally

1. Open **Browser Window 1** at `http://localhost:5173`.
2. Click **Start Connecting**, select **Programming** and **Gaming**, and click **Find Someone**.
   - Notice it displays: *"Waiting for someone to connect..."* (Zero bots guaranteed).
3. Open **Browser Window 2** (Incognito or another browser) at `http://localhost:5173`.
4. Click **Start Connecting**, select **Coding** and **Gaming**, and click **Find Someone**.
5. Both windows immediately display: **"Someone is here!"** showing shared interests: `Programming / Coding`, `Gaming`.
6. Test real-time text chat, in-call video, mute/camera toggle, skip, and block.
