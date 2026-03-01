import { PII_PATTERNS } from "./pii-patterns";

/**
 * Scans LLM output text for PII patterns and redacts any matches.
 *
 * Used as a post-processing step on the complete LLM response (or on
 * buffered chunks in the streaming path). This is the safety net — even
 * if the input guard missed something, or the LLM hallucinated a
 * phone-number-shaped string, this catches it before the user sees it.
 *
 * For streaming, the chat route accumulates tokens into sentence-sized
 * buffers before scanning, so partial patterns (e.g., "555" then "-123"
 * then "-4567" across three tokens) are caught when the buffer is
 * flushed as a complete sentence.
 */
export function scanForPII(text: string): string {
  let safe = text;

  for (const { name, regex } of PII_PATTERNS) {
    safe = safe.replace(
      new RegExp(regex.source, regex.flags),
      `[REDACTED ${name.toUpperCase()}]`,
    );
  }

  return safe;
}

/**
 * Creates a TransformStream that buffers LLM tokens and scans for PII
 * before forwarding to the client.
 *
 * Strategy: accumulate tokens in a buffer. When a sentence boundary is
 * detected (". ", ".\n", "!", "?"), flush everything up to and including
 * that boundary through the PII scanner. This ensures multi-token PII
 * (like a phone number split across tokens) is caught as a complete unit.
 *
 * The 200-char safety valve handles edge cases (long URLs, code blocks)
 * where sentence boundaries are absent.
 */
export function createOutputGuardStream(): TransformStream<string, string> {
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      const sentenceEnd = findLastSentenceBoundary(buffer);

      if (sentenceEnd === -1 && buffer.length < 200) return;

      const flushUpTo = sentenceEnd !== -1 ? sentenceEnd + 1 : buffer.length;
      const toFlush = buffer.slice(0, flushUpTo);
      buffer = buffer.slice(flushUpTo);

      controller.enqueue(scanForPII(toFlush));
    },

    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(scanForPII(buffer));
      }
    },
  });
}

function findLastSentenceBoundary(text: string): number {
  const boundaries = [". ", ".\n", "! ", "!\n", "? ", "?\n"];
  let lastIndex = -1;

  for (const boundary of boundaries) {
    const idx = text.lastIndexOf(boundary);
    if (idx > lastIndex) {
      lastIndex = idx + boundary.length - 1;
    }
  }

  return lastIndex;
}
