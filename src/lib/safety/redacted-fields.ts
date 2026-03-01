/**
 * Explicit blocklist of private values that should never appear in output.
 *
 * Unlike the regex patterns (which catch patterns like "any phone number"),
 * this is a hardcoded list of YOUR specific private data. This is the
 * strongest guarantee — if a value is in this list, it's replaced before
 * the LLM ever sees it, regardless of format.
 *
 * Update this with your actual private data before deploying.
 * This file should NOT be committed to a public repository.
 */
export const REDACTED_FIELDS: Record<string, string> = {
  // Replace these with your actual private values:
  // personal_phone: "555-123-4567",
  // personal_email: "aman.private@gmail.com",
  // home_address: "123 Main St, San Francisco, CA 94102",
};
