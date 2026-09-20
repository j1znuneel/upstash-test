import { NextRequest, NextResponse } from "next/server";
import {
  getCachedSearch,
  setCachedSearch,
  recordSearchQuery,
  ratelimiter,
} from "@/lib/redis";
import { queryVectorDocs, SearchResult } from "@/lib/vector";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // 1. Rate Limiting Check (protecting search endpoint)
  let rateLimitInfo = { limit: 5, remaining: 5, reset: 0, success: true };
  if (ratelimiter) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const res = await ratelimiter.limit(`search:${ip}`);
    rateLimitInfo = {
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
      success: res.success,
    };

    if (!res.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again in a few seconds.",
          rateLimit: rateLimitInfo,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(res.limit),
            "X-RateLimit-Remaining": String(res.remaining),
            "X-RateLimit-Reset": String(res.reset),
          },
        }
      );
    }
  }

  // 2. Cache-Aside: Check Redis first
  const cached = await getCachedSearch<SearchResult[]>(query);
  if (cached) {
    const latency = Date.now() - startTime;
    // Asynchronously record search term to trending leaderboard
    recordSearchQuery(query).catch(console.error);

    return NextResponse.json({
      query,
      source: "redis_cache",
      latencyMs: latency,
      rateLimit: rateLimitInfo,
      results: cached,
    });
  }

  // 3. Cache Miss: Query Vector Database
  const vectorResults = await queryVectorDocs(query, 5);
  const latency = Date.now() - startTime;

  // 4. Save to Redis Cache with 300-second TTL (5 minutes)
  await setCachedSearch(query, vectorResults, 300);

  // 5. Increment Trending Search Leaderboard in Redis Sorted Set
  await recordSearchQuery(query);

  return NextResponse.json({
    query,
    source: "vector_index",
    latencyMs: latency,
    rateLimit: rateLimitInfo,
    results: vectorResults,
  });
}

