import { NextRequest, NextResponse } from "next/server";
import { publishIngestionTask, isQStashConfigured } from "@/lib/qstash";
import { upsertDocToVector } from "@/lib/vector";
import { KnowledgeDoc } from "@/lib/sample-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, category, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const doc: KnowledgeDoc = {
      id: `doc-${Date.now()}`,
      title,
      content,
      category: category || "general",
      tags: tags || [],
    };

    // Determine the webhook endpoint destination URL.
    // On Vercel, process.env.VERCEL_URL is automatically set.
    const host = req.headers.get("host") || "localhost:3000";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

    let destinationWebhookUrl: string;
    if (process.env.VERCEL_URL) {
      destinationWebhookUrl = `https://${process.env.VERCEL_URL}/api/webhooks/qstash`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      destinationWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash`;
    } else if (isLocal) {
      // QStash is a cloud service and cannot deliver HTTP requests to localhost/loopback addresses.
      // For local testing, we publish to an external echo destination to verify real QStash delivery,
      // and index the vector document directly.
      destinationWebhookUrl = "https://httpbin.org/post";
    } else {
      destinationWebhookUrl = `https://${host}/api/webhooks/qstash`;
    }

    if (isQStashConfigured) {
      // Publish background task to Upstash QStash
      const result = await publishIngestionTask(destinationWebhookUrl, doc);

      // If testing locally, index directly since QStash cannot reach localhost
      if (isLocal) {
        await upsertDocToVector(doc);
      }

      return NextResponse.json({
        success: true,
        method: "qstash_queue",
        message: isLocal
          ? "Message delivered to QStash cloud queue! (Locally indexed since QStash cloud cannot reach localhost without a tunnel)."
          : "Task dispatched to QStash queue for asynchronous worker processing.",
        messageId: result.messageId,
        destinationUrl: destinationWebhookUrl,
        doc,
      });
    } else {
      // Direct upsert fallback
      await upsertDocToVector(doc);

      return NextResponse.json({
        success: true,
        method: "direct_fallback",
        message: "Document indexed directly.",
        doc,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
