import { createHash } from "crypto";
import type { ParsedDocument, Chunk } from "../src/types/rag";

const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 64;

/**
 * Splits parsed documents into chunks that fit within the embedding model's
 * token budget.
 *
 * Uses a recursive strategy: try splitting on paragraph breaks first (\n\n),
 * then single newlines (\n), then sentences (". "), then spaces. This
 * preserves natural text structure as much as possible.
 *
 * Documents shorter than chunkSize pass through unchanged — no point
 * splitting a 200-token project description into smaller pieces.
 */
export function chunkDocuments(
  documents: ParsedDocument[],
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const doc of documents) {
    const textChunks = recursiveSplit(doc.text, chunkSize, chunkOverlap);

    for (let i = 0; i < textChunks.length; i++) {
      const text = textChunks[i].trim();
      if (text.length === 0) continue;

      chunks.push({
        id: deterministicId(text, doc.metadata.source, doc.metadata.title),
        text,
        metadata: {
          ...doc.metadata,
          ...(textChunks.length > 1 && {
            section: `${doc.metadata.section} (part ${i + 1}/${textChunks.length})`,
          }),
        },
      });
    }
  }

  return chunks;
}

const SEPARATORS = ["\n\n", "\n", ". ", " "];

/**
 * Recursively splits text using a hierarchy of separators.
 *
 * The algorithm:
 * 1. If text fits within chunkSize, return it as-is.
 * 2. Try the highest-priority separator (paragraph break).
 * 3. Split text on that separator, then greedily merge adjacent pieces
 *    until adding the next piece would exceed chunkSize.
 * 4. If any merged piece still exceeds chunkSize, recurse with the next
 *    separator (falling back from paragraphs → lines → sentences → words).
 * 5. Adjacent chunks share `chunkOverlap` characters to preserve context
 *    at boundaries.
 */
function recursiveSplit(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separatorIndex = 0,
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  if (separatorIndex >= SEPARATORS.length) {
    return [text.slice(0, chunkSize)];
  }

  const separator = SEPARATORS[separatorIndex];
  const pieces = text.split(separator);

  if (pieces.length === 1) {
    return recursiveSplit(text, chunkSize, chunkOverlap, separatorIndex + 1);
  }

  const merged = mergeWithOverlap(pieces, separator, chunkSize, chunkOverlap);

  const result: string[] = [];
  for (const segment of merged) {
    if (segment.length > chunkSize) {
      result.push(
        ...recursiveSplit(segment, chunkSize, chunkOverlap, separatorIndex + 1),
      );
    } else {
      result.push(segment);
    }
  }

  return result;
}

/**
 * Greedily merges split pieces back together up to chunkSize, with overlap
 * between consecutive merged chunks.
 */
function mergeWithOverlap(
  pieces: string[],
  separator: string,
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const piece of pieces) {
    const candidate =
      current.length === 0 ? piece : current + separator + piece;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current.length > 0) {
        chunks.push(current);
      }

      // Start next chunk with overlap from the end of the previous chunk
      if (chunkOverlap > 0 && current.length > 0) {
        const overlapText = current.slice(-chunkOverlap);
        current = overlapText + separator + piece;
      } else {
        current = piece;
      }
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Creates a deterministic ID from chunk content and metadata.
 * This ensures that re-running ingestion produces the same IDs,
 * so upserts to the vector store are idempotent (no duplicates).
 */
function deterministicId(text: string, source: string, title: string): string {
  const hash = createHash("sha256")
    .update(`${source}:${title}:${text}`)
    .digest("hex")
    .slice(0, 16);

  return `${source}-${hash}`;
}
