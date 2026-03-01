import { Pinecone } from "@pinecone-database/pinecone";
import type { ChunkMetadata } from "@/types/rag";
import type { VectorStore, VectorSearchResult } from "./types";

/**
 * Pinecone-backed vector store for production.
 *
 * Pinecone is a managed vector database — you don't run any infrastructure.
 * The free tier gives you 100k vectors across 1 index, more than enough
 * for a portfolio site. Vectors are stored in the cloud and queried via
 * HTTPS, so it works on Vercel's serverless functions.
 *
 * Key Pinecone concepts:
 * - Index: a collection of vectors (like a database table)
 * - Namespace: a partition within an index (we use "portfolio")
 * - Upsert: insert-or-update by ID (idempotent)
 * - Metadata: arbitrary JSON stored alongside each vector, returned with results
 */
export class PineconeVectorStore implements VectorStore {
  private client: Pinecone;
  private indexName: string;
  private namespace: string;

  constructor() {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME ?? "ai-portfolio";
    this.namespace = process.env.PINECONE_NAMESPACE ?? "portfolio";
  }

  async upsert(
    items: {
      id: string;
      vector: number[];
      metadata: ChunkMetadata & { text: string };
    }[],
  ): Promise<void> {
    const index = this.client.index(this.indexName);

    const records = items.map((item) => {
      const { tags, ...meta } = item.metadata;
      const flat: Record<string, string | number | boolean> = { ...meta };
      if (tags) flat.tags = JSON.stringify(tags);
      return { id: item.id, values: item.vector, metadata: flat };
    });

    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await index.namespace(this.namespace).upsert({ records: batch });
    }
  }

  async query(vector: number[], topK: number): Promise<VectorSearchResult[]> {
    const index = this.client.index(this.indexName);

    const response = await index.namespace(this.namespace).query({
      vector,
      topK,
      includeMetadata: true,
    });

    return (response.matches ?? []).map((match) => {
      const meta = (match.metadata ?? {}) as Record<string, unknown>;
      return {
        id: match.id,
        score: match.score ?? 0,
        text: (meta.text as string) ?? "",
        metadata: {
          source: meta.source as ChunkMetadata["source"],
          section: meta.section as string,
          title: meta.title as string,
          url: meta.url as string | undefined,
          tags: meta.tags as string[] | undefined,
          date: meta.date as string | undefined,
        },
      };
    });
  }
}
