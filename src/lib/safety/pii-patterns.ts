/**
 * Regex patterns for common PII types.
 *
 * These are intentionally aggressive — it's better to over-redact
 * (replacing a non-PII string that looks like a phone number) than
 * to under-redact (leaking an actual phone number).
 *
 * Each pattern has a name used in the redaction placeholder:
 *   "555-123-4567" → "[REDACTED PHONE]"
 */
export const PII_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: "phone",
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  },
  {
    name: "private_email",
    regex: /[a-zA-Z0-9._%+-]+@(?!example\.com\b)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    name: "ssn",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    name: "street_address",
    regex:
      /\b\d{1,5}\s[\w\s]{1,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Way|Place|Pl)\b\.?/gi,
  },
  {
    name: "credit_card",
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
  },
];
