import { Client, Receiver } from "@upstash/qstash";
import { KnowledgeDoc } from "./sample-data";

export const isQStashConfigured = Boolean(process.env.QSTASH_TOKEN);

export const qstashClient = isQStashConfigured
  ? new Client({
      token: process.env.QSTASH_TOKEN!,
    })
  : null;

export const qstashReceiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
      })
    : null;

export interface IngestJobPayload {
  action: "upsert_doc";
  doc: KnowledgeDoc;
  timestamp: number;
}

/**
 * Publishes a background ingestion task to QStash.
 * In production on Vercel, destinationUrl will be https://your-domain.vercel.app/api/webhooks/qstash
 */
export async function publishIngestionTask(
  destinationUrl: string,
  doc: KnowledgeDoc
): Promise<{ messageId: string; simulated?: boolean }> {
  if (!qstashClient) {
    // Graceful fallback for local development before QStash token is added
    return {
      messageId: `msg_mock_${Math.random().toString(36).substring(2, 9)}`,
      simulated: true,
    };
  }

  const payload: IngestJobPayload = {
    action: "upsert_doc",
    doc,
    timestamp: Date.now(),
  };

  const response = await qstashClient.publishJSON({
    url: destinationUrl,
    body: payload,
    retries: 3, // Auto-retry up to 3 times on destination failure
  });

  return {
    messageId: response.messageId,
  };
}

