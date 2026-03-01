import { type LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Returns the chat LLM based on the LLM_PROVIDER env var.
 *
 * Unlike the embedding model (which must stay the same forever once you've
 * ingested data), the chat model can be swapped freely. The retriever
 * doesn't care which LLM reads the context — only that the context is
 * relevant. So you can experiment: try Mistral locally, deploy with
 * Gemini, switch to Claude next week. Zero code changes.
 *
 * The Vercel AI SDK's LanguageModel interface is the key enabler.
 * Every provider returns an object that satisfies this interface, so
 * streamText() works identically regardless of which model is behind it.
 */
export function getModel(): LanguageModel {
  const provider = process.env.LLM_PROVIDER ?? "ollama";

  switch (provider) {
    case "ollama": {
      const baseURL =
        process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL,
      });
      return ollama.chatModel(process.env.OLLAMA_MODEL ?? "mistral");
    }

    case "gemini":
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY!,
      })("gemini-2.5-flash");

    case "claude":
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      })("claude-sonnet-4-20250514");

    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${provider}". Use "ollama", "gemini", or "claude".`,
      );
  }
}
