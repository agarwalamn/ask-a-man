import type { VectorStore } from "./types";
import { LocalVectorStore } from "./local-store";
import { PineconeVectorStore } from "./pinecone-client";

export type { VectorStore, VectorSearchResult } from "./types";

/**
 * Factory function that returns the active vector store.
 *
 * Controlled by VECTOR_STORE env var:
 *   "local"    → file-based vectra (default, for development)
 *   "pinecone" → managed Pinecone (for production)
 *
 * Every consumer imports from this file — never from the implementations
 * directly. This is what makes the swap invisible to the rest of the code.
 */
export function getVectorStore(): VectorStore {
  const store = process.env.VECTOR_STORE ?? "local";

  switch (store) {
    case "local":
      return new LocalVectorStore();
    case "pinecone":
      return new PineconeVectorStore();
    default:
      throw new Error(
        `Unknown VECTOR_STORE: "${store}". Use "local" or "pinecone".`,
      );
  }
}
