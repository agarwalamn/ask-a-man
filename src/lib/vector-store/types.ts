import type { ChunkMetadata } from "@/types/rag";

/**
 * The contract every vector store implementation must satisfy.
 *
 * This is the "repository pattern" applied to vector databases.
 * The rest of the codebase imports VectorStore, never Pinecone or vectra
 * directly. Swapping stores is a one-line env var change.
 */
export interface VectorStore {
  /**
   * Insert or update vectors with their metadata.
   * Upsert semantics: if an item with the same ID exists, it's overwritten.
   */
  upsert(
    items: {
      id: string;
      vector: number[];
      metadata: ChunkMetadata & { text: string };
    }[],
  ): Promise<void>;

  /**
   * Find the top-k most similar vectors to the query vector.
   * Returns results sorted by descending similarity.
   */
  query(vector: number[], topK: number): Promise<VectorSearchResult[]>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  text: string;
  metadata: ChunkMetadata;
}
