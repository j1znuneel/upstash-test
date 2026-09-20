import { NextResponse } from "next/server";
import { getTrendingQueries, isRedisConfigured } from "@/lib/redis";

export async function GET() {
  if (!isRedisConfigured) {
    return NextResponse.json({
      configured: false,
      trending: [
        { query: "serverless caching", count: 42 },
        { query: "vector embeddings", count: 28 },
        { query: "qstash webhooks", count: 19 },
        { query: "rate limiting", count: 15 },
        { query: "nextjs app router", count: 11 },
      ],
    });
  }

  const trending = await getTrendingQueries(5);
  return NextResponse.json({
    configured: true,
    trending,
  });
}

