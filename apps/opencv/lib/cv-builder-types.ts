import React from "react"
export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
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
  description: string;
  highlights: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillEntry {
  id: string;
  name: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
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
  description?: string;
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
  description: string;
  location?: string;
}

export interface StrengthEntry {
  id: string;
  title: string;
  description: string;
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
  description?: string;
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
