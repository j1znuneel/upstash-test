import { NextResponse } from "next/server";
import { redis, isRedisConfigured } from "@/lib/redis";
import { vectorIndex, isVectorConfigured } from "@/lib/vector";
import { isQStashConfigured } from "@/lib/qstash";

export async function GET() {
  const status = {
    redis: {
      configured: isRedisConfigured,
      connected: false,
      latencyMs: 0,
      details: "",
    },
    vector: {
      configured: isVectorConfigured,
      connected: false,
      details: "",
    },
    qstash: {
      configured: isQStashConfigured,
      details: "",
    },
  };

  // Test Redis
  if (redis) {
    const t0 = Date.now();
    try {
      const pong = await redis.ping();
      status.redis.connected = pong === "PONG";
      status.redis.latencyMs = Date.now() - t0;
      status.redis.details = "Connected to Upstash Redis successfully!";
    } catch (e: any) {
      status.redis.details = `Connection failed: ${e.message}`;
    }
  } else {
    status.redis.details = "Missing UPSTASH_REDIS_REST_URL / TOKEN";
  }

  // Test Vector
  if (vectorIndex) {
    try {
      const info = await vectorIndex.info();
      status.vector.connected = true;
      status.vector.details = `Index ready (dimension: ${info.dimension}, vectors: ${info.vectorCount})`;
    } catch (e: any) {
      status.vector.details = `Vector test failed: ${e.message}`;
    }
  } else {
    status.vector.details = "Missing UPSTASH_VECTOR_REST_URL / TOKEN (running in local simulation mode)";
  }

  // Test QStash
  if (isQStashConfigured) {
    status.qstash.details = "QStash token configured and ready to publish!";
  } else {
    status.qstash.details = "Missing QSTASH_TOKEN (running in direct fallback mode)";
  }

  return NextResponse.json(status);
}

