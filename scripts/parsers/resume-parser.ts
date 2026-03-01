import { readFileSync } from "fs";
import type { ParsedDocument } from "../../src/types/rag";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

/**
 * Parses a PDF resume into semantically meaningful documents.
 *
 * Strategy: extract raw text from the PDF, then split into sections
 * using common resume heading patterns (e.g. "EXPERIENCE", "Education",
 * "Skills"). Each section becomes its own ParsedDocument so the chunker
 * and embeddings can treat them as coherent units.
 *
 * If no clear headings are found, the full text is split on double
 * newlines to create paragraph-level documents.
 */
export async function parseResume(filePath: string): Promise<ParsedDocument[]> {
  const buffer = readFileSync(filePath);
  const pdf = await pdfParse(buffer);
  const text: string = pdf.text;

  if (!text.trim()) {
    console.warn(`  Warning: No text extracted from ${filePath}`);
    return [];
  }

  const sections = splitIntoSections(text);
  const docs: ParsedDocument[] = [];

  for (const section of sections) {
    if (section.content.trim().length < 20) continue;

    docs.push({
      text: section.heading
        ? `${section.heading}:\n${section.content.trim()}`
        : section.content.trim(),
      metadata: {
        source: "resume",
        section: section.heading?.toLowerCase() ?? "general",
        title: section.heading
          ? `Resume — ${section.heading}`
          : "Resume — General",
      },
    });
  }

  return docs;
}

interface Section {
  heading: string | null;
  content: string;
}

const HEADING_PATTERN =
  /^(?:EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS?|SUMMARY|OBJECTIVE|ABOUT|PROJECTS|TECHNICAL SKILLS|WORK HISTORY|PROFESSIONAL EXPERIENCE|AWARDS|PUBLICATIONS|LANGUAGES|INTERESTS|VOLUNTEER|REFERENCES)$/im;

function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (HEADING_PATTERN.test(trimmed)) {
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n"),
        });
      }
      currentHeading = trimmed;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n"),
    });
  }

  if (sections.length <= 1 && text.length > 200) {
    return splitByParagraphs(text);
  }

  return sections;
}

function splitByParagraphs(text: string): Section[] {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim().length >= 20)
    .map((p) => ({ heading: null, content: p }));
}
