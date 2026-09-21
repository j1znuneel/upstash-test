# Upstash All-in-One Showcase: Redis, Vector & QStash in Next.js

A production-ready, interactive **Next.js 15 (App Router)** application built for deployment on **Vercel**, showcasing how **Upstash Redis**, **Upstash Vector**, and **Upstash QStash** integrate to build intelligent, high-speed, serverless web applications.

---

## 🚀 Architectural Highlights

- **⚡ Upstash Redis**:
  - **Cache-Aside Pattern**: Sub-5ms caching for repeated semantic search queries with automatic TTL.
  - **Distributed Rate Limiting (`@upstash/ratelimit`)**: Sliding window rate limiting protecting endpoints globally without shared memory.
  - **Real-Time Leaderboard (`Sorted Sets / ZSET`)**: Tracks trending queries with atomic `ZINCRBY`.
- **🔍 Upstash Vector**:
  - **Semantic Search & RAG**: Conceptual similarity retrieval using built-in embedding models (`BGE_SMALL_EN_V1_5`), enabling direct text upserts without external embedding APIs.
- **📬 Upstash QStash**:
  - **Asynchronous Task Queue**: Offloads heavy tasks (like document indexing) so serverless HTTP responses return in `< 20ms`.
  - **Cryptographically Verified Webhooks**: Secures worker routes using HMAC signature verification (`verifySignatureAppRouter`).

---

## 🛠️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/j1znuneel/upstash-test.git
cd upstash-test
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials from the [Upstash Console](https://console.upstash.com/):
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
UPSTASH_VECTOR_REST_URL=https://...upstash.io
UPSTASH_VECTOR_REST_TOKEN=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive dashboard.

---

## 📖 Deep-Dive Architecture Guide
Read [TUTORIAL.md](./TUTORIAL.md) for step-by-step explanations of the serverless architecture, caching strategies, and Vercel deployment options.

