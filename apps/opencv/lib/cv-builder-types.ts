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
}

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
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  component: React.ComponentType<{ data: CVData }>;
}
