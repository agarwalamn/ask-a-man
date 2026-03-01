import type { VectorSearchResult } from "@/lib/vector-store";

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  blog: "Blog Post",
  project: "Project",
};

/**
 * Formats retrieved chunks into plain context blocks for the LLM prompt.
 * No numbered references -- the LLM is instructed not to cite sources.
 */
export function buildContext(results: VectorSearchResult[]): {
  contextText: string;
} {
  const contextBlocks = results.map((r) => {
    const label = SOURCE_LABELS[r.metadata.source] ?? r.metadata.source;
    return [
      `Source: "${r.metadata.title}" (${label})`,
      `Content: ${r.text}`,
    ].join("\n");
  });

  return {
    contextText: contextBlocks.join("\n\n"),
  };
}
