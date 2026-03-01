import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { getModel } from "@/lib/llm";
import { retrieveContext } from "@/lib/rag/retriever";
import { buildContext } from "@/lib/rag/context-builder";
import { buildSystemPrompt } from "@/lib/rag/prompt-templates";
import { sanitizeContext } from "@/lib/safety";

/**
 * POST /api/chat
 *
 * This is the main chat endpoint. Here's what happens on every message:
 *
 * 1. Extract the latest user message from the conversation history.
 * 2. Use it as a search query to retrieve the top-5 relevant chunks
 *    from the vector store (semantic search).
 * 3. Run the input guard: scrub any PII from retrieved chunks BEFORE
 *    the LLM sees them.
 * 4. Format chunks as context blocks and build the system prompt.
 * 5. Call the LLM with streaming enabled. The Vercel AI SDK handles
 *    the SSE connection back to the browser.
 *
 * The full conversation history (messages) is passed to the LLM so it
 * can maintain context across turns. But retrieval only uses the LATEST
 * message — otherwise a long conversation would muddy the search query.
 */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const queryText = lastUserMessage.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");

  const results = await retrieveContext(queryText);

  const sanitizedResults = results.map((r) => ({
    ...r,
    text: sanitizeContext(r.text),
  }));

  const { contextText } = buildContext(sanitizedResults);

  const systemPrompt = buildSystemPrompt(contextText);

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
