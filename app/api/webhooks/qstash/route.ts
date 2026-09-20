import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { upsertDocToVector } from "@/lib/vector";
import { IngestJobPayload } from "@/lib/qstash";

async function webhookHandler(req: Request) {
  try {
    const body = (await req.json()) as IngestJobPayload;

    console.log("[QStash Webhook Worker] Processing verified job:", body);

    if (body.action === "upsert_doc" && body.doc) {
      // Index document into Upstash Vector
      await upsertDocToVector(body.doc);
      console.log(`[QStash Webhook Worker] Successfully indexed: ${body.doc.title}`);
    }

    return Response.json({
      success: true,
      processed: true,
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[QStash Webhook Worker] Error processing payload:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// When QSTASH_CURRENT_SIGNING_KEY is provided, wrap handler with cryptographic signature verification.
// If keys are omitted in development, allow plain testing.
export const POST = process.env.QSTASH_CURRENT_SIGNING_KEY
  ? verifySignatureAppRouter(webhookHandler)
  : webhookHandler;

