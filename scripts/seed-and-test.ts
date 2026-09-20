import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { Client } from "@upstash/qstash";
// Using native Node --env-file=.env.local

async function main() {
  console.log("=== Upstash Live Verification & Seeding ===");

  // 1. Test Redis
  console.log("\n[1/3] Testing Upstash Redis...");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const pong = await redis.ping();
  console.log("✓ Redis PING response:", pong);
  await redis.set("test:hello", "world from antigravity");
  const val = await redis.get("test:hello");
  console.log("✓ Redis SET/GET verified:", val);

  // 2. Test & Seed Vector
  console.log("\n[2/3] Testing & Seeding Upstash Vector...");
  const vector = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
  });
  const info = await vector.info();
  console.log("✓ Vector Index info:", info);

  const sampleDocs = [
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
  ];

  console.log("Seeding documents into Upstash Vector...");
  for (const doc of sampleDocs) {
    await vector.upsert({
      id: doc.id,
      data: `${doc.title}\n\n${doc.content}`,
      metadata: {
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
      },
    });
    console.log(`  ✓ Upserted: ${doc.title}`);
  }

  console.log("Testing semantic query on Vector...");
  const searchResults = await vector.query({
    data: "fast memory caching",
    topK: 2,
    includeMetadata: true,
  });
  console.log("✓ Semantic Search returned matches:", searchResults.map(r => ({ id: r.id, score: r.score, title: (r.metadata as any)?.title })));

  // 3. Test QStash
  console.log("\n[3/3] Testing Upstash QStash...");
  const qstash = new Client({
    token: process.env.QSTASH_TOKEN!,
  });
  const schedules = await qstash.schedules.list();
  console.log("✓ QStash schedules verified:", schedules);

  console.log("\n✨ ALL THREE UPSTASH SERVICES LIVE & VERIFIED!");
}

main().catch(console.error);
