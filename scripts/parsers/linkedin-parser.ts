import { readFileSync } from "fs";
import type { ParsedDocument } from "../../src/types/rag";

interface LinkedInProfile {
  basics: {
    name: string;
    title: string;
    summary: string;
    location: string;
    website?: string;
    publicEmail?: string;
  };
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    location: string;
    description: string;
    skills: string[];
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
}

/**
 * Parses a LinkedIn JSON export into semantically self-contained documents.
 *
 * Strategy: one document per logical unit (summary, each role, each degree,
 * skills list, certifications). This respects natural boundaries rather than
 * blindly splitting the whole JSON — a role description with its company name
 * and dates is a coherent "thought" that embeds well.
 */
export function parseLinkedIn(filePath: string): ParsedDocument[] {
  const raw = readFileSync(filePath, "utf-8");
  const profile: LinkedInProfile = JSON.parse(raw);
  const docs: ParsedDocument[] = [];

  docs.push({
    text: `${profile.basics.name} — ${profile.basics.title}. ${profile.basics.summary}`,
    metadata: {
      source: "linkedin",
      section: "summary",
      title: `${profile.basics.name} — Professional Summary`,
    },
  });

  for (const role of profile.experience) {
    const period = role.endDate
      ? `${role.startDate} to ${role.endDate}`
      : `${role.startDate} to present`;

    docs.push({
      text: [
        `${role.title} at ${role.company} (${period}), ${role.location}.`,
        role.description,
        `Key skills: ${role.skills.join(", ")}.`,
      ].join("\n"),
      metadata: {
        source: "linkedin",
        section: "experience",
        title: `${role.title} at ${role.company}`,
        date: role.startDate,
      },
    });
  }

  for (const edu of profile.education) {
    docs.push({
      text: [
        `${edu.degree} from ${edu.institution} (${edu.startDate} to ${edu.endDate}).`,
        edu.description,
      ].join("\n"),
      metadata: {
        source: "linkedin",
        section: "education",
        title: `${edu.degree} — ${edu.institution}`,
        date: edu.startDate,
      },
    });
  }

  if (profile.skills.length > 0) {
    docs.push({
      text: `Technical skills: ${profile.skills.join(", ")}.`,
      metadata: {
        source: "linkedin",
        section: "skills",
        title: "Technical Skills",
      },
    });
  }

  if (profile.certifications.length > 0) {
    const certText = profile.certifications
      .map((c) => `${c.name} (${c.issuer}, ${c.date})`)
      .join(". ");

    docs.push({
      text: `Certifications: ${certText}.`,
      metadata: {
        source: "linkedin",
        section: "certifications",
        title: "Certifications",
      },
    });
  }

  return docs;
}
