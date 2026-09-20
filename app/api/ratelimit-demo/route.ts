import { NextRequest, NextResponse } from "next/server";
import { ratelimiter, isRedisConfigured } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "demo-client-ip";
  const identifier = `demo:${ip}`;

  if (!ratelimiter) {
    return NextResponse.json({
      configured: false,
      message:
        "Upstash Redis is not yet configured. Provide UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable real distributed rate limiting.",
      simulated: {
        limit: 5,
        remaining: 4,
        reset: Date.now() + 10000,
        success: true,
      },
    });
  }

  const result = await ratelimiter.limit(identifier);

  if (!result.success) {
    return NextResponse.json(
      {
        configured: true,
        success: false,
        error: "429 Too Many Requests: Rate limit exceeded! Wait before sending more requests.",
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return NextResponse.json({
    configured: true,
    success: true,
    message: "Request permitted by @upstash/ratelimit!",
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  });
}

