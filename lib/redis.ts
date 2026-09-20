import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Upstash Redis client
// Next.js on Vercel automatically populates UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// when you link an Upstash Redis database from Vercel's Marketplace or provide them in .env.local
export const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate Limiter: 5 requests every 10 seconds per identifier (sliding window)
// Perfect for protecting search or AI endpoints from abuse
export const ratelimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit:demo",
    })
  : null;

/**
 * Cache-Aside Pattern for Search Queries
 * Checks if search results are already cached in Redis.
 */
export async function getCachedSearch<T>(query: string): Promise<T | null> {
  if (!redis) return null;
  const key = `cache:search:${query.trim().toLowerCase()}`;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.error("[getCachedSearch] error:", err);
    return null;
  }
}

/**
 * Cache-Aside Pattern: Writes search results to Redis with a TTL (e.g. 5 minutes)
 */
export async function setCachedSearch<T>(
  query: string,
  data: T,
  ttlSeconds = 300
): Promise<void> {
  if (!redis) return;
  const key = `cache:search:${query.trim().toLowerCase()}`;
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (err) {
    console.error("[setCachedSearch] error:", err);
  }
}

/**
 * Real-time Trending Queries using Redis Sorted Sets (ZSET)
 * Atomically increments the search count for a given term.
 */
export async function recordSearchQuery(query: string): Promise<void> {
  if (!redis) return;
  const clean = query.trim().toLowerCase();
  if (!clean) return;
  // ZINCRBY key increment member
  await redis.zincrby("leaderboard:searches", 1, clean);
}

/**
 * Retrieves the top trending queries with their hit counts from Redis Sorted Set.
 */
export async function getTrendingQueries(
  limit = 5
): Promise<{ query: string; count: number }[]> {
  if (!redis) return [];
  // ZREVRANGE leaderboard:searches 0 limit-1 WITHSCORES
  const results = await redis.zrange<string[]>(
    "leaderboard:searches",
    0,
    limit - 1,
    {
      rev: true,
      withScores: true,
    }
  );

  const parsed: { query: string; count: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({
      query: results[i],
      count: Number(results[i + 1]),
    });
  }
  return parsed;
}

