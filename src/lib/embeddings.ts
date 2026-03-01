import { embed, embedMany, type EmbeddingModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Returns the embedding model based on the EMBEDDING_PROVIDER env var.
 *
 * Why a separate abstraction from the chat LLM?
 * - Embedding models are purpose-built for converting text → vectors.
 *   They're smaller (~137M params vs 7B+ for chat) and much faster.
 * - You MUST use the same model for ingestion and querying, otherwise
 *   the vectors live in different geometric spaces and similarity
 *   search produces garbage results.
 * - Swapping embedding models requires re-running the entire ingestion
 *   pipeline (re-embed all chunks). So this choice is stickier than
 *   the chat model choice.
 *
 * Note: We use @ai-sdk/openai-compatible for Ollama because Ollama
 * exposes an OpenAI-compatible API at /v1, and this provider supports
 * the AI SDK v2 specification. The dedicated ollama-ai-provider package
 * is still on v1 spec at time of writing.
 */
function getEmbeddingModel(): EmbeddingModel {
  const provider = process.env.EMBEDDING_PROVIDER ?? "ollama";

  switch (provider) {
    case "ollama": {
      const baseURL =
        process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL,
      });
      return ollama.embeddingModel(
        process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text",
      );
    }

    case "google":
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY!,
      }).embeddingModel("gemini-embedding-001");

    default:
      throw new Error(
        `Unknown EMBEDDING_PROVIDER: "${provider}". Use "ollama" or "google".`,
      );
  }
}

/**
 * Embed a single text string. Used at query time to embed the user's question.
 * Returns a vector (number[]) of the model's dimensionality.
 *
 * Ollama nomic-embed-text: 768 dimensions
 * Google text-embedding-004: 768 dimensions
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
  });
  return embedding;
}

/**
 * Embed multiple texts in a single batch. Used at ingestion time.
 * Batching is important: 31 individual API calls would be slow;
 * one batch call with 31 texts is much faster.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values: texts,
  });
  return embeddings;
}
