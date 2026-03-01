import { readFileSync, readdirSync } from "fs";
import path from "path";
import matter from "gray-matter";
import type { ParsedDocument } from "../../src/types/rag";

interface BlogFrontmatter {
  title: string;
  date: string;
  slug: string;
  tags?: string[];
  excerpt?: string;
}

/**
 * Parses all Markdown blog posts from a directory.
 *
 * Strategy: split each post by ## headings. Each heading-delimited section
 * becomes its own document. This is better than arbitrary character splitting
 * because a section under "## The Chunking Problem" is a coherent topic that
 * embeds cleanly. We prepend the post title to each section so the embedding
 * captures the broader context (which post this section belongs to).
 */
export function parseBlogPosts(dirPath: string): ParsedDocument[] {
  const files = readdirSync(dirPath).filter((f) => f.endsWith(".md"));
  const docs: ParsedDocument[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(dirPath, file), "utf-8");
    const parsed = matter(raw);
    const frontmatter = parsed.data as BlogFrontmatter;
    const content = parsed.content;

    const sections = splitByHeadings(content);

    for (const section of sections) {
      if (section.body.trim().length === 0) continue;

      const text = [
        `From blog post: "${frontmatter.title}"`,
        section.heading ? `Section: ${section.heading}` : "",
        section.body.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      docs.push({
        text,
        metadata: {
          source: "blog",
          section: section.heading || "introduction",
          title: frontmatter.title,
          url: `/blog/${frontmatter.slug}`,
          tags: frontmatter.tags,
          date: frontmatter.date,
        },
      });
    }
  }

  return docs;
}

interface Section {
  heading: string | null;
  body: string;
}

/**
 * Splits Markdown content by ## headings into sections.
 * Content before the first ## heading becomes the "introduction" section.
 * The # (h1) title is excluded since it duplicates the frontmatter title.
 */
function splitByHeadings(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      continue;
    }

    if (line.startsWith("## ")) {
      if (currentBody.length > 0) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join("\n"),
        });
      }
      currentHeading = line.replace(/^##\s+/, "");
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentBody.length > 0) {
    sections.push({ heading: currentHeading, body: currentBody.join("\n") });
  }

  return sections;
}
