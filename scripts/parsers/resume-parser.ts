import { readFileSync } from "fs";
import type { ParsedDocument } from "../../src/types/rag";

interface TeamDetail {
  name: string;
  highlights: string[];
}

interface SpeakingEngagement {
  topic: string;
  description: string;
}

export interface ResumeData {
  basics: {
    name: string;
    title: string;
    summary: string;
    location: string;
    website?: string;
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
    resumeUrl?: string;
  };
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    location: string;
    description: string;
    skills: string[];
    teams?: TeamDetail[];
  }[];
  education: {
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
  projects: {
    name: string;
    description: string;
    techStack: string[];
    url: string | null;
    github: string | null;
    status: string;
    year: number;
  }[];
  speaking?: SpeakingEngagement[];
}

/**
 * Parses a structured resume JSON into semantically self-contained documents.
 *
 * Each logical unit (summary, role, team, degree, project, etc.) becomes its own
 * ParsedDocument so the chunker and embeddings can treat them as coherent units.
 */
export async function parseResume(filePath: string): Promise<ParsedDocument[]> {
  const raw = readFileSync(filePath, "utf-8");
  const resume: ResumeData = JSON.parse(raw);
  const docs: ParsedDocument[] = [];

  // --- Summary ---
  docs.push({
    text: `${resume.basics.name} — ${resume.basics.title}. ${resume.basics.summary}`,
    metadata: {
      source: "resume",
      section: "summary",
      title: `${resume.basics.name} — Professional Summary`,
    },
  });

  // --- Experience ---
  for (const role of resume.experience) {
    const period = role.endDate
      ? `${role.startDate} to ${role.endDate}`
      : `${role.startDate} to present`;

    const locationSuffix = role.location ? `, ${role.location}` : "";
    const skillLine =
      role.skills.length > 0 ? `\nKey skills: ${role.skills.join(", ")}.` : "";

    docs.push({
      text: [
        `${role.title} at ${role.company} (${period})${locationSuffix}.`,
        role.description,
        skillLine,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: {
        source: "resume",
        section: "experience",
        title: `${role.title} at ${role.company}`,
        date: role.startDate,
      },
    });

    if (role.teams) {
      for (const team of role.teams) {
        docs.push({
          text: [
            `${role.title} at ${role.company} — ${team.name} team (${period}).`,
            ...team.highlights,
          ].join("\n"),
          metadata: {
            source: "resume",
            section: "experience",
            title: `${role.company} — ${team.name}`,
            date: role.startDate,
          },
        });
      }
    }
  }

  // --- Education ---
  for (const edu of resume.education) {
    const parts = [
      `${edu.degree} from ${edu.institution} (${edu.startDate} to ${edu.endDate}).`,
    ];
    if (edu.description) parts.push(edu.description);

    docs.push({
      text: parts.join("\n"),
      metadata: {
        source: "resume",
        section: "education",
        title: `${edu.degree} — ${edu.institution}`,
        date: edu.startDate,
      },
    });
  }

  // --- Skills ---
  if (resume.skills.length > 0) {
    docs.push({
      text: `Technical skills: ${resume.skills.join(", ")}.`,
      metadata: {
        source: "resume",
        section: "skills",
        title: "Technical Skills",
      },
    });
  }

  // --- Certifications ---
  if (resume.certifications.length > 0) {
    const certText = resume.certifications
      .map((c) => `${c.name} (${c.issuer}, ${c.date})`)
      .join(". ");

    docs.push({
      text: `Certifications: ${certText}.`,
      metadata: {
        source: "resume",
        section: "certifications",
        title: "Certifications",
      },
    });
  }

  // --- Projects ---
  for (const project of resume.projects) {
    const parts = [
      `Project: ${project.name} (${project.year}, ${project.status}).`,
      project.description,
      `Built with: ${project.techStack.join(", ")}.`,
    ];

    if (project.url) parts.push(`Live at: ${project.url}`);
    if (project.github) parts.push(`Source code: ${project.github}`);

    docs.push({
      text: parts.join("\n"),
      metadata: {
        source: "resume",
        section: "project",
        title: project.name,
        url: project.url ?? project.github ?? undefined,
        date: String(project.year),
      },
    });
  }

  // --- Speaking ---
  if (resume.speaking && resume.speaking.length > 0) {
    const speakingText = resume.speaking
      .map((s) => `${s.topic}: ${s.description}`)
      .join("\n");

    docs.push({
      text: `Technical speaking engagements:\n${speakingText}`,
      metadata: {
        source: "resume",
        section: "speaking",
        title: "Technical Speaking",
      },
    });
  }

  return docs;
}
