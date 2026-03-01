import { readFileSync } from "fs";
import type { ParsedDocument } from "../../src/types/rag";

interface Project {
  name: string;
  description: string;
  techStack: string[];
  url: string | null;
  github: string | null;
  status: string;
  year: number;
}

/**
 * Parses the projects JSON into one document per project.
 *
 * Strategy: projects are already self-contained units, so each becomes a
 * single document. We compose the text to include the name, description,
 * tech stack, and status — everything a user might ask about. The tech
 * stack is spelled out in prose (not just a list) so the embedding model
 * captures the relationship between the project and its technologies.
 */
export function parseProjects(filePath: string): ParsedDocument[] {
  const raw = readFileSync(filePath, "utf-8");
  const projects: Project[] = JSON.parse(raw);

  return projects.map((project) => {
    const parts = [
      `Project: ${project.name} (${project.year}, ${project.status}).`,
      project.description,
      `Built with: ${project.techStack.join(", ")}.`,
    ];

    if (project.url) parts.push(`Live at: ${project.url}`);
    if (project.github) parts.push(`Source code: ${project.github}`);

    return {
      text: parts.join("\n"),
      metadata: {
        source: "project" as const,
        section: "project",
        title: project.name,
        url: project.url ?? project.github ?? undefined,
        date: String(project.year),
      },
    };
  });
}
