import React from "react"

/**
 * CV Builder Type Definitions
 * 
 * Rich Text Formatting Support:
 * All text fields that contain descriptions, summaries, or highlights support HTML formatting.
 * Markdown syntax is also supported for backward compatibility.
 * This is compatible with WYSIWYG editors like Lexical.
 * 
 * HTML tags: <strong>, <em>, <b>, <i>, <u>, <br>, <sup>, <sub>, <a>
 * Links: <a href="url" target="_blank">text</a> (only http://, https://, mailto: allowed)
 * Markdown: **bold** or __bold__, *italic* or _italic_
 * 
 * Examples:
 * - HTML: "Led migration to <strong>microservices architecture</strong>, improving performance by <em>60%</em>"
 * - Markdown: "Led migration to **microservices architecture**, improving performance by *60%*"
 * - Links: "Working on <a href='https://example.com' target='_blank'>Project X</a>"
 * - Special: "Reduced CO<sub>2</sub> emissions by 50%" or "10<sup>6</sup> users"
 */

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string; // Supports HTML & Markdown: <strong>/<b> or **text** for bold, <em>/<i> or *text* for italic
  photo?: string;
  avatar?: string;
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  location: string;
  description: string; // Supports HTML & Markdown: <strong>/<b> or **text** for bold, <em>/<i> or *text* for italic
  highlights: string[]; // Each item supports HTML & Markdown formatting
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
}

export interface SkillEntry {
  id: string;
  name: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
  link: string;
  technologies: string[];
  startDate: string;
  endDate: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
}

export interface VolunteeringEntry {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
  location?: string;
}

export interface StrengthEntry {
  id: string;
  title: string;
  description: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
}

export interface InterestEntry {
  id: string;
  name: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  publisher: string;
  date: string;
  link?: string;
  description?: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
}

export interface LanguageEntry {
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
}

export interface SocialLinkEntry {
  id: string;
  platform: string;
  url: string;
  icon?: string; // predefined IconName key OR a custom image URL starting with "http"
}

/**
 * A user-defined section not covered by the built-in types above (e.g.
 * "Volunteering", "Hobbies"). Each item is a generic title/subtitle/meta/
 * description entry — the same shape every built-in list section already
 * uses — so one shared renderer covers arbitrary sections across templates.
 */
export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string; // Supports HTML formatting: <strong>, <em>, <b>, <i>, <u>
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

/**
 * Built-in section identifiers — stable strings, used as sectionOrder ids.
 * Deliberately limited to the sections every template already renders.
 * projects/certifications/volunteering/strengths/interests exist in CVData
 * (legacy fields with no template UI anywhere, predating the section
 * system) but are intentionally excluded here — surfacing them as
 * toggleable would produce a "visible" section that renders nothing.
 */
export type BuiltInSectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "awards"
  | "publications"
  | "references"
  | "socialLinks"
  | "languages";

export const BUILT_IN_SECTION_IDS: BuiltInSectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "awards",
  "publications",
  "references",
  "socialLinks",
  "languages",
];

export const SECTION_LABELS: Record<BuiltInSectionId, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  awards: "Key Achievements",
  publications: "Publications",
  references: "References",
  socialLinks: "Find Me Online",
  languages: "Languages",
};

/**
 * Section id: a BuiltInSectionId, or a CustomSection's own id.
 * Column is only meaningful for two-column templates (professional, modern);
 * single-column templates (classic, minimal) ignore it and flatten the order.
 */
export interface SectionMeta {
  id: string;
  column: "left" | "right";
  hidden?: boolean;
}

/** Default arrangement, matching the professional template's original hardcoded layout. */
export const DEFAULT_SECTION_ORDER: SectionMeta[] = [
  { id: "summary", column: "left" },
  { id: "education", column: "left" },
  { id: "experience", column: "left" },
  { id: "skills", column: "right" },
  { id: "awards", column: "right" },
  { id: "publications", column: "right" },
  { id: "references", column: "right" },
  { id: "socialLinks", column: "right" },
  { id: "languages", column: "right" },
];

export interface CVData {
  personalInfo: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  awards: AwardEntry[];
  references: ReferenceEntry[];
  volunteering: VolunteeringEntry[];
  strengths: StrengthEntry[];
  interests: InterestEntry[];
  publications: PublicationEntry[];
  languages: LanguageEntry[];
  socialLinks: SocialLinkEntry[];
  customSections: CustomSection[];
  sectionOrder: SectionMeta[];
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  component: React.ComponentType<{ data: CVData }>;
}

export interface CVTheme {
  primaryColor: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  backgroundColor: string;
  fontFace: string;
  nameFontSize: number;
  sectionFontSize: number;
  bodyFontSize: number;
  nameWeight: number;
  headingWeight: number;
  bodyWeight: number;
}

export const DEFAULT_THEME: CVTheme = {
  primaryColor: "#db2777",
  headingColor: "#111827",
  bodyColor: "#374151",
  mutedColor: "#9ca3af",
  backgroundColor: "#ffffff",
  fontFace: "Inter, ui-sans-serif, system-ui, sans-serif",
  nameFontSize: 30,
  sectionFontSize: 13,
  bodyFontSize: 11,
  nameWeight: 700,
  headingWeight: 700,
  bodyWeight: 400,
};
