# Comprehensive Upstash Guide: Redis, Vector & QStash in Next.js (Vercel-Ready)

This application demonstrates the complete serverless architecture combining **Upstash Redis**, **Upstash Vector**, and **Upstash QStash** inside a modern Next.js App Router project ready for Vercel deployment.

---

## 1. Upstash Redis: In-Memory Speed & Traffic Control

### Why Serverless Redis for Next.js?
Traditional Redis requires a persistent TCP connection pool. In serverless environments (like Vercel Serverless & Edge Functions), functions spin up and down rapidly. Traditional connection pools can exhaust connection limits within seconds.

**Upstash Redis** connects via **stateless HTTP / REST API**, making it ideal for serverless and edge runtimes:
- No connection pooling issues.
- Global low latency with read replicas.
- Auto-serialization: JavaScript objects, strings, and numbers are stored directly without manual `JSON.stringify` or `JSON.parse`.

### Key Architectural Patterns Used in this App:

#### 1. Cache-Aside Pattern (`lib/redis.ts`, `app/api/search/route.ts`)
```typescript
// 1. Check Redis first
const cached = await redis.get(`cache:search:${query}`);
if (cached) {
  return cached; // < 5ms response!
}

// 2. Compute or fetch from primary source (Vector DB)
const results = await vectorIndex.query({ data: query, topK: 5 });

// 3. Save to Redis with a TTL (e.g. 60 seconds)
await redis.set(`cache:search:${query}`, results, { ex: 60 });
```

#### 2. Distributed Rate Limiting (`@upstash/ratelimit`)
Protects sensitive search, AI, or ingestion routes against DDoS or abusive traffic:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

export const ratelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"), // 5 requests per 10 seconds
  analytics: true,
});

// Inside Route Handler or Middleware:
const { success, limit, remaining, reset } = await ratelimiter.limit(`user:${ip}`);
if (!success) {
  return new Response("Too Many Requests", { status: 429 });
}
```

#### 3. Real-time Leaderboards with Sorted Sets (`ZSET`)
```typescript
// Atomically increment search count for a term
await redis.zincrby("leaderboard:searches", 1, query);

// Fetch top 5 trending queries ordered by score
const topQueries = await redis.zrange("leaderboard:searches", 0, 4, {
  rev: true,
  withScores: true,
});
```

---

## 2. Upstash Vector: Semantic Search & RAG

### What is Vector Search?
Instead of traditional keyword matching (like SQL `LIKE '%keyword%'`), **Vector Search** converts human language into high-dimensional numerical vectors (embeddings) where conceptual similarity equals geometric distance.

### Key Advantages of Upstash Vector:
- **Built-in Embedding Models**: Upstash can automatically vectorize text on the fly (e.g., using `BAAI/bge-small-en` or `text-embedding-3-small`). You can upsert plain text strings directly (`data: string`) without needing a separate OpenAI or HuggingFace API key!
- **Metadata Filtering**: Store title, categories, tags, or permissions directly in the vector metadata.

```typescript
import { Index } from "@upstash/vector";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Upsert raw text
await index.upsert({
  id: "doc-1",
  data: "The Cache-Aside pattern loads data on demand in Redis...",
  metadata: { category: "redis", title: "Caching Patterns" },
});

// Semantic query
const results = await index.query({
  data: "how to speed up database queries",
  topK: 3,
  includeMetadata: true,
});
```

---

## 3. Upstash QStash: Asynchronous Background Processing

### Why QStash in Serverless?
Serverless functions on Vercel have hard execution time limits (e.g., 10s on Hobby, 60s on Pro). If you perform heavy operations (like downloading files, running LLM summarization, or batch-indexing thousands of vector embeddings), user HTTP requests will timeout.

**Upstash QStash** acts as an external HTTP message broker:
1. Your API receives the request and immediately pushes the payload to QStash via `client.publishJSON()`.
2. The user receives a `202 Accepted` response in **< 20ms**.
3. QStash delivers the message to your destination webhook (`/api/webhooks/qstash`) with automatic retries, failure handling, and FIFO order.

### Cryptographic Webhook Verification
To prevent malicious actors from spoofing requests to your webhook endpoint, QStash signs every request with HMAC-SHA256:
```typescript
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

async function handler(req: Request) {
  const body = await req.json();
  // Guaranteed to be genuinely sent from Upstash QStash!
  return Response.json({ success: true });
}

export const POST = verifySignatureAppRouter(handler);
```

---

## 4. How to Connect Your Upstash Account

You already have the Upstash console open! Here is where to grab your keys:

### 1. Upstash Redis
1. Go to **Upstash Console → Redis**.
2. Create a database (or click your existing one).
3. Scroll down to **REST API** section and copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Paste them into `.env.local`.

### 2. Upstash Vector
1. Go to **Upstash Console → Vector**.
2. Click **Create Index**.
   - Model: Select **BAAI/bge-small-en** or **text-embedding-3-small** (1536 dim).
   - Distance metric: **Cosine**.
3. In the index details, copy:
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`
4. Paste them into `.env.local`.

### 3. Upstash QStash
1. Go to **Upstash Console → QStash**.
2. Copy:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`
3. Paste them into `.env.local`.

---

## 5. Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. In the **Vercel Dashboard**, click **Add New → Project** and import the repository.
3. In **Settings → Environment Variables**, add your keys:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application!

