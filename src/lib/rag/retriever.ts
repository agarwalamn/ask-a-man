import { embedText } from "@/lib/embeddings";
import { getVectorStore, type VectorSearchResult } from "@/lib/vector-store";

const DEFAULT_TOP_K = 5;

/**
 * Retrieves the most relevant chunks for a given query.
 *
 * The flow:
 * 1. Convert the user's question text into a vector (same embedding model
 *    used during ingestion — critical for the math to work).
 * 2. Ask the vector store for the top-k most similar vectors.
 * 3. Return the results with their text, metadata, and similarity scores.
 *
 * Why top-5 instead of top-10 or top-3?
 * - Top-3 risks missing relevant context for broad questions.
 * - Top-10 injects too much noise — irrelevant chunks confuse the LLM
 *   and waste context window tokens.
 * - Top-5 is the empirical sweet spot for most RAG systems. We can tune
 *   this later based on answer quality.
 */
export async function retrieveContext(
  query: string,
  topK = DEFAULT_TOP_K,
): Promise<VectorSearchResult[]> {
  const queryVector = await embedText(query);
  const store = getVectorStore();
  const results = await store.query(queryVector, topK);
  return results;
}
