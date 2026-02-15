import type { CVData } from "./cv-builder-types";

/**
 * This utility helps parse structured LinkedIn data that users can export
 * Note: Direct API access requires OAuth, so we support JSON import instead
 */

interface LinkedInExport {
  profile?: {
    name?: string;
    headline?: string;
    summary?: string;
    location?: string;
    email?: string;
    phoneNumber?: string;
    website?: string;
  };
  experience?: Array<{
    title?: string;
    companyName?: string;
    startDate?: { year: number; month: number };
    endDate?: { year: number; month: number } | null;
    description?: string;
  }>;
  education?: Array<{
    schoolName?: string;
    fieldOfStudy?: string;
    degreeType?: string;
    startDate?: { year: number };
    endDate?: { year: number };
  }>;
  skills?: Array<{
    name?: string;
  }>;
}

function formatDate(year?: number, month?: number): string {
  if (!year) return "";
  const m = String(month || 1).padStart(2, "0");
  return `${year}-${m}`;
}

export function parseLinkedInData(data: LinkedInExport): Partial<CVData> {
  const parsed: Partial<CVData> = {
    personalInfo: {
      fullName: data.profile?.name || "Your Name",
      jobTitle: data.profile?.headline || "",
      email: data.profile?.email || "",
      phone: data.profile?.phoneNumber || "",
      location: data.profile?.location || "",
      website: data.profile?.website || "",
      summary: data.profile?.summary || "",
    },
    experience: [],
    education: [],
    skills: [],
  };

  // Parse experience
  if (data.experience && Array.isArray(data.experience)) {
    parsed.experience = data.experience
      .filter((exp) => exp.title && exp.companyName)
      .map((exp) => ({
        id: Date.now().toString() + Math.random(),
        jobTitle: exp.title || "",
        company: exp.companyName || "",
        startDate: formatDate(exp.startDate?.year, exp.startDate?.month),
        endDate: formatDate(exp.endDate?.year, exp.endDate?.month),
        currentlyWorking: !exp.endDate,
        location: "",
        description: exp.description || "",
        highlights: [],
      }));
  }

  // Parse education
  if (data.education && Array.isArray(data.education)) {
    parsed.education = data.education
      .filter((edu) => edu.schoolName)
      .map((edu) => ({
        id: Date.now().toString() + Math.random(),
        degree: edu.degreeType || "",
        institution: edu.schoolName || "",
        field: edu.fieldOfStudy || "",
        startDate: formatDate(edu.startDate?.year),
        endDate: formatDate(edu.endDate?.year),
        description: "",
      }));
  }

  // Parse skills
  if (data.skills && Array.isArray(data.skills)) {
    parsed.skills = data.skills
      .filter((skill) => skill.name)
      .slice(0, 15) // Limit to 15 skills
      .map((skill, idx) => ({
        id: Date.now().toString() + idx,
        name: skill.name || "",
        category: "General",
        proficiency: 3 as const,
      }));
  }

  return parsed;
}

export function generateLinkedInExportInstructions(): string {
  return `
To import your LinkedIn profile:

1. Visit https://www.linkedin.com/me
2. Go to Settings & Privacy > Data privacy > Get a copy of your data
3. Select "Get a copy of your data" and download the CSV or JSON
4. You can also copy your profile headline and summary text
5. Paste the data in the import dialog

The tool will extract:
- Name, headline, and summary
- Work experience
- Education
- Skills

This helps you quickly populate your CV without manual typing.
  `;
}

export function validateLinkedInJSON(data: unknown): data is LinkedInExport {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  // Check if it looks like LinkedIn export format
  return (
    (obj.profile !== undefined || obj.experience !== undefined || obj.education !== undefined || obj.skills !== undefined)
  );
}
