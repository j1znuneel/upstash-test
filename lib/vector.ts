import { Index } from "@upstash/vector";
import { SAMPLE_DOCS, KnowledgeDoc } from "./sample-data";

export const isVectorConfigured = Boolean(
  process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
);

export const vectorIndex = isVectorConfigured
  ? new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    })
  : null;

export interface SearchResult {
  id: string;
  score: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

/**
 * Upsert a knowledge document into Upstash Vector.
 * When your Upstash Vector index is created with an embedding model (e.g. BAAI/bge-small-en),
 * you pass `data: string` and Upstash automatically generates embeddings server-side!
 */
export async function upsertDocToVector(doc: KnowledgeDoc): Promise<void> {
  if (!vectorIndex) return;

  // We embed the title + content together for optimal semantic recall
  const searchableText = `${doc.title}\n\n${doc.content}`;

  await vectorIndex.upsert({
    id: doc.id,
    data: searchableText,
    metadata: {
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
    },
  });
}

/**
 * Query the Upstash Vector database with natural language text.
 */
export async function queryVectorDocs(
  query: string,
  topK = 3
): Promise<SearchResult[]> {
  if (!vectorIndex) {
    // Graceful fallback for local development before Vector credentials are set
    // Performs client-side keyword matching so the UI is 100% testable immediately!
    const queryLower = query.toLowerCase();
    const matches = SAMPLE_DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(queryLower) ||
        d.content.toLowerCase().includes(queryLower) ||
        d.tags.some((t) => t.toLowerCase().includes(queryLower))
    );

    return matches.slice(0, topK).map((m, idx) => ({
      id: m.id,
      score: 0.95 - idx * 0.05, // Simulated semantic similarity score
      title: m.title,
      content: m.content,
      category: m.category,
      tags: m.tags,
    }));
  }

  // Real semantic query on Upstash Vector
  const results = await vectorIndex.query({
    data: query,
    topK,
    includeMetadata: true,
    includeData: false,
  });

  return results.map((item) => {
    const meta = (item.metadata || {}) as Record<string, any>;
    return {
      id: String(item.id),
      score: item.score,
      title: meta.title || "Untitled Document",
      content: meta.content || "",
      category: meta.category || "general",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
    };
  });
}

/**
 * Seeds initial sample documents into the Vector index
 */
export async function seedVectorIndex(): Promise<number> {
  if (!vectorIndex) return 0;
  for (const doc of SAMPLE_DOCS) {
    await upsertDocToVector(doc);
  }
  return SAMPLE_DOCS.length;
}

