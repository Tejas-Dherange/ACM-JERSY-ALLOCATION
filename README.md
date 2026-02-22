# 👕 Real-Time Jersey Number Booking System

A production-ready, real-time jersey number booking application — like a movie-ticket system for team jerseys. First-come, first-served. Fully atomic. No race conditions.

## 🚀 Quick Start

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/get-started)
- A [Neon](https://console.neon.tech) account (for PostgreSQL + Neon Auth)

### 1. Setup Environment Variables

**Backend** (`backend/.env`):
```env
PORT=4000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/jerseydb?sslmode=require
REDIS_URL=redis://redis:6379
STACK_PROJECT_ID=your-project-id
STACK_SECRET_SERVER_KEY=your-secret-key
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_STACK_PROJECT_ID=your-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-publishable-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

> 📋 Copy from `.env.example` in each folder and fill in your values.

### 2. Get Neon Auth Keys

1. Go to [Neon Console](https://console.neon.tech) → your project → **Auth**
2. Enable Neon Auth (powered by Stack Auth)
3. Copy `Project ID`, `Publishable Client Key`, `Secret Server Key`
4. Enable **Google OAuth** under Auth → Social Providers (optional but supported)

### 3. Start the App

```bash
docker-compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:4000        |
| Health   | http://localhost:4000/api/health |
| Redis    | localhost:6379               |

---

## 🏗️ Architecture

```
frontend/          Next.js 14 (App Router + Tailwind)
backend/           Node.js + Express + Socket.IO
  ├── Redis        Atomic locks via Lua scripts (30s TTL)
  ├── BullMQ       Async DB persistence queue (3 retries)
  └── Prisma       PostgreSQL ORM (Neon DB)
```

### Jersey Booking Flow

```
Client → jersey:reserve → Redis Lua Script (atomic)
  ├── FAIL: jersey taken/locked/user has one → jersey:failed
  └── OK: lock set (30s TTL) → BullMQ job queued
         └── Worker → DB upsert → Redis: locked→taken → jersey:success + state:update
```

---

## 📁 Structure

```
Jersy-Allocation/
├── docker-compose.yml
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Neon Auth provider)
│   │   ├── page.tsx            # Redirect to dashboard or sign-in
│   │   ├── auth/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   └── dashboard/page.tsx  # Protected jersey booking page
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── JerseyGrid.tsx
│   │   └── JerseyCard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useSocket.ts
│   └── lib/
│       ├── auth/client.ts
│       └── socket.ts
└── backend/
    └── src/
        ├── index.ts
        ├── server.ts
        ├── redis/
        │   ├── client.ts
        │   └── jersey.lua      # Atomic reservation script
        ├── queue/jersey.queue.ts
        ├── workers/jersey.worker.ts
        ├── sockets/
        │   ├── index.ts        # Auth middleware
        │   └── jersey.socket.ts
        ├── routes/health.route.ts
        ├── utils/auth.ts
        └── prisma/schema.prisma
```

---

## 🔌 WebSocket Events

| Event            | Direction        | Description                  |
|------------------|------------------|------------------------------|
| `state:init`     | Server → Client  | Full jersey state on connect |
| `jersey:reserve` | Client → Server  | Attempt to claim a jersey    |
| `jersey:success` | Server → Client  | Booking confirmed            |
| `jersey:failed`  | Server → Client  | Booking rejected + reason    |
| `state:update`   | Server → All     | Broadcast a state change     |

---

## 🛡️ Error Scenarios Handled

| Scenario             | Handling                              |
|----------------------|---------------------------------------|
| Duplicate booking    | Lua script rejects atomically         |
| Concurrent requests  | Only one Lua script wins the lock     |
| Worker DB failure    | Redis lock released, client notified  |
| BullMQ retries       | 3 attempts with exponential backoff   |
| Socket disconnect    | Re-sync on reconnect via `state:init` |
| Unauthenticated WS   | Rejected at handshake middleware      |

---

## 🧪 Local Development (without Docker)

```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: Backend
cd backend
npm install
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --schema=src/prisma/schema.prisma
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```
