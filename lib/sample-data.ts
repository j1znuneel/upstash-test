export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: "redis" | "vector" | "qstash" | "architecture";
  tags: string[];
}

export const SAMPLE_DOCS: KnowledgeDoc[] = [
  {
    id: "doc-1",
    title: "Serverless Caching Patterns with Upstash Redis",
    content:
      "The Cache-Aside pattern loads data on demand. When a query arrives, the app checks Redis first. On a cache hit, data returns in sub-5ms. On a miss, data is fetched from the primary store, written to Redis with a TTL, and returned to the client.",
    category: "redis",
    tags: ["caching", "performance", "redis", "ttl"],
  },
  {
    id: "doc-2",
    title: "Protecting Serverless Routes with @upstash/ratelimit",
    content:
      "Rate limiting prevents abuse and manages API costs. Using Upstash Redis and sliding window algorithms, serverless functions can enforce request quotas (e.g. 5 requests per 10 seconds per IP) with atomic Redis operations.",
    category: "redis",
    tags: ["ratelimit", "security", "middleware"],
  },
  {
    id: "doc-3",
    title: "Semantic Search and RAG with Upstash Vector",
    content:
      "Upstash Vector enables nearest-neighbor similarity search without running self-hosted vector infrastructure. It supports built-in embedding models like BAAI/bge-small-en and text-embedding-3-small, allowing raw text upsertion and metadata filtering.",
    category: "vector",
    tags: ["embeddings", "vector-search", "rag", "similarity"],
  },
  {
    id: "doc-4",
    title: "Event-Driven Background Processing with Upstash QStash",
    content:
      "QStash is a serverless HTTP message queue and scheduler. Instead of blocking user requests for heavy jobs like document embedding or notifications, publish a message to QStash. QStash delivers the HTTP POST to your webhook with automatic retries, deduplication, and FIFO order.",
    category: "qstash",
    tags: ["queue", "background-jobs", "scheduling", "webhooks"],
  },
  {
    id: "doc-5",
    title: "Securing Next.js App Router Webhooks from QStash",
    content:
      "Incoming QStash messages carry cryptographic HMAC signatures in the upstash-signature header. Using verifySignatureAppRouter or the Receiver class ensures that only authentic QStash requests trigger your worker functions.",
    category: "qstash",
    tags: ["security", "signatures", "webhooks", "nextjs"],
  },
  {
    id: "doc-6",
    title: "Real-time Leaderboards with Redis Sorted Sets",
    content:
      "Sorted Sets (ZSETs) associate each member with a floating-point score. Commands like ZINCRBY increment a member's count atomically, while ZREVRANGE fetches top-ranked items in O(log(N) + M) time, ideal for trending searches or player scoreboards.",
    category: "redis",
    tags: ["sorted-sets", "leaderboard", "analytics"],
  },
];

