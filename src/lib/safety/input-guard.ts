import { PII_PATTERNS } from "./pii-patterns";
import { REDACTED_FIELDS } from "./redacted-fields";

/**
 * Sanitizes context text BEFORE it's sent to the LLM.
 *
 * This is the strongest line of defense: if the LLM never sees the
 * phone number, it physically cannot output it — no prompt injection,
 * no jailbreak, no hallucination can produce data that was never in
 * the prompt.
 *
 * Two-pass approach:
 * 1. Blocklist pass: exact-match replacement of known private values.
 *    This catches your specific data even if the regex would miss it
 *    (e.g., a phone in an unusual format).
 * 2. Regex pass: pattern-based catch for any PII that slipped through.
 */
export function sanitizeContext(text: string): string {
  let sanitized = text;

  for (const [field, value] of Object.entries(REDACTED_FIELDS)) {
    if (value && sanitized.includes(value)) {
      sanitized = sanitized.replaceAll(
        value,
        `[REDACTED ${field.toUpperCase()}]`,
      );
    }
  }

  for (const { name, regex } of PII_PATTERNS) {
    sanitized = sanitized.replace(
      new RegExp(regex.source, regex.flags),
      `[REDACTED ${name.toUpperCase()}]`,
    );
  }

  return sanitized;
}
