/**
 * JSON Resume (https://jsonresume.org/schema) in and out.
 *
 * This is the interchange format. opencv's own CVData is shaped around what
 * the editor needs — ids on every entry so the canvas can address them,
 * section order, per-section columns — none of which another tool wants or
 * understands. JSON Resume is what the rest of the world reads, so it is the
 * format to hand an agent, a parser or another résumé builder.
 *
 * The mapping is deliberately lossy in one direction and forgiving in the
 * other. Going out, editor bookkeeping is dropped. Coming in, anything the
 * schema does not carry (section order, columns, theme) is defaulted, and
 * every entry is given a fresh id, because an imported résumé has none.
 *
 * Rich text: CVData descriptions may hold inline HTML, which JSON Resume
 * expects as plain text, so it is stripped on the way out. The reverse is not
 * true — imported text is taken literally and never parsed as HTML, since it
 * comes from outside and must not be able to inject markup into the canvas.
 */

import type {
  CVData,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  AwardEntry,
  PublicationEntry,
  ReferenceEntry,
  LanguageEntry,
  SocialLinkEntry,
  InterestEntry,
  VolunteeringEntry,
} from "./types.js";
import { DEFAULT_SECTION_ORDER } from "./types.js";

/* ── The schema, as much of it as opencv has anything to say about ───────── */

export interface JsonResume {
  $schema?: string;
  basics?: JsonResumeBasics;
  work?: JsonResumeWork[];
  volunteer?: JsonResumeVolunteer[];
  education?: JsonResumeEducation[];
  awards?: JsonResumeAward[];
  publications?: JsonResumePublication[];
  skills?: JsonResumeSkill[];
  languages?: JsonResumeLanguage[];
  interests?: JsonResumeInterest[];
  references?: JsonResumeReference[];
}

export interface JsonResumeBasics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: { address?: string };
  profiles?: { network?: string; username?: string; url?: string }[];
}

export interface JsonResumeWork {
  name?: string;
  position?: string;
  location?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface JsonResumeVolunteer {
  organization?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
}

export interface JsonResumeEducation {
  institution?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
}

export interface JsonResumeAward {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface JsonResumePublication {
  name?: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

export interface JsonResumeSkill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface JsonResumeLanguage {
  language?: string;
  fluency?: string;
}

export interface JsonResumeInterest {
  name?: string;
  keywords?: string[];
}

export interface JsonResumeReference {
  name?: string;
  reference?: string;
}

export const JSON_RESUME_SCHEMA =
  "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Inline markup the editor stores but the schema has no room for. */
function plain(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

/** Drops keys whose value is empty, so the output has no `"url": ""` noise. */
function compact<T extends object>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

let idCounter = 0;
function freshId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

/**
 * The schema's proficiency words, in the order opencv's 1–5 scale uses them.
 * Index 0 is unused so a rating maps to its own position.
 */
const FLUENCY = ["", "Beginner", "Elementary", "Intermediate", "Advanced", "Native speaker"];

function fluencyFor(rating: number | undefined): string | undefined {
  if (!rating) return undefined;
  return FLUENCY[Math.min(Math.max(Math.round(rating), 1), 5)];
}

function ratingFor(fluency: string | undefined): 1 | 2 | 3 | 4 | 5 {
  if (!fluency) return 3;
  const i = FLUENCY.findIndex((f) => f.toLowerCase() === fluency.trim().toLowerCase());
  // Unrecognised wording (the schema does not constrain it) lands mid-scale
  // rather than at an extreme it cannot justify.
  return i > 0 ? (i as 1 | 2 | 3 | 4 | 5) : 3;
}

/* ── Out ──────────────────────────────────────────────────────────────────── */

export function toJsonResume(data: CVData): JsonResume {
  const p = data.personalInfo;

  const basics = compact<JsonResumeBasics>({
    name: p.fullName,
    label: p.jobTitle,
    image: p.avatar,
    email: p.email,
    phone: p.phone,
    url: p.website,
    summary: plain(p.summary),
    location: p.location ? { address: p.location } : undefined,
    profiles: (data.socialLinks ?? [])
      .filter((l) => l.platform || l.url)
      .map((l: SocialLinkEntry) => compact({ network: l.platform, url: l.url })),
  });

  const resume: JsonResume = {
    $schema: JSON_RESUME_SCHEMA,
    basics,
    work: (data.experience ?? [])
      .filter((e: ExperienceEntry) => e.jobTitle || e.company)
      .map((e) =>
        compact<JsonResumeWork>({
          name: e.company,
          position: e.jobTitle,
          location: e.location,
          startDate: e.startDate,
          // The schema has no "current" flag: an open-ended role is one with
          // no endDate, which is how every consumer reads it.
          endDate: e.currentlyWorking ? undefined : e.endDate,
          summary: plain(e.description),
          highlights: (e.highlights ?? []).map((h) => plain(h) ?? "").filter(Boolean),
        })
      ),
    volunteer: (data.volunteering ?? [])
      .filter((v: VolunteeringEntry) => v.organization || v.role)
      .map((v) =>
        compact<JsonResumeVolunteer>({
          organization: v.organization,
          position: v.role,
          startDate: v.startDate,
          endDate: v.endDate,
          summary: plain(v.description),
        })
      ),
    education: (data.education ?? [])
      .filter((e: EducationEntry) => e.degree || e.institution)
      .map((e) =>
        compact<JsonResumeEducation>({
          institution: e.institution,
          area: e.field,
          studyType: e.degree,
          startDate: e.startDate,
          endDate: e.endDate,
          score: plain(e.description),
        })
      ),
    awards: (data.awards ?? [])
      .filter((a: AwardEntry) => a.title || a.issuer)
      .map((a) =>
        compact<JsonResumeAward>({
          title: a.title,
          date: a.date,
          awarder: a.issuer,
          summary: plain(a.description),
        })
      ),
    publications: (data.publications ?? [])
      .filter((x: PublicationEntry) => x.title || x.publisher)
      .map((x) =>
        compact<JsonResumePublication>({
          name: x.title,
          publisher: x.publisher,
          releaseDate: x.date,
          url: x.link,
          summary: plain(x.description),
        })
      ),
    skills: (data.skills ?? [])
      .filter((s: SkillEntry) => s.name)
      .map((s) => compact<JsonResumeSkill>({ name: s.name })),
    languages: (data.languages ?? [])
      .filter((l: LanguageEntry) => l.name)
      .map((l) =>
        compact<JsonResumeLanguage>({ language: l.name, fluency: fluencyFor(l.proficiency) })
      ),
    interests: (data.interests ?? [])
      .filter((i: InterestEntry) => i.name)
      .map((i) => compact<JsonResumeInterest>({ name: i.name })),
    references: (data.references ?? [])
      .filter((r: ReferenceEntry) => r.name)
      .map((r) =>
        compact<JsonResumeReference>({
          name: r.name,
          // The schema keeps one free-text field, so the role, employer and
          // contact details are folded into it rather than dropped.
          reference: [r.title, r.company, r.email, r.phone].filter(Boolean).join(" · ") || undefined,
        })
      ),
  };

  return compact(resume);
}

/* ── In ───────────────────────────────────────────────────────────────────── */

/**
 * Builds a CVData from a JSON Resume.
 *
 * Nothing here trusts its input: every field is coerced to the type the
 * editor expects, and anything missing becomes an empty value rather than
 * undefined, because the templates index into these arrays directly.
 */
export function fromJsonResume(resume: JsonResume): CVData {
  const b = resume.basics ?? {};

  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const arr = <T>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);

  return {
    personalInfo: {
      fullName: str(b.name),
      jobTitle: str(b.label),
      email: str(b.email),
      phone: str(b.phone),
      location: str(b.location?.address),
      website: str(b.url),
      summary: str(b.summary),
      avatar: typeof b.image === "string" ? b.image : undefined,
    },
    experience: arr(resume.work).map((w) => ({
      id: freshId("exp"),
      jobTitle: str(w.position),
      company: str(w.name),
      location: str(w.location),
      startDate: str(w.startDate),
      endDate: str(w.endDate),
      // No endDate on a schema work entry means the role is still open.
      currentlyWorking: !w.endDate,
      description: str(w.summary),
      highlights: arr(w.highlights).filter((h) => typeof h === "string"),
    })),
    education: arr(resume.education).map((e) => ({
      id: freshId("edu"),
      degree: str(e.studyType),
      institution: str(e.institution),
      field: str(e.area),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      description: str(e.score),
    })),
    skills: arr(resume.skills).map((s) => ({ id: freshId("skl"), name: str(s.name) })),
    projects: [],
    certifications: [],
    awards: arr(resume.awards).map((a) => ({
      id: freshId("awd"),
      title: str(a.title),
      issuer: str(a.awarder),
      date: str(a.date),
      description: str(a.summary),
    })),
    references: arr(resume.references).map((r) => ({
      id: freshId("ref"),
      name: str(r.name),
      title: str(r.reference),
      company: "",
      email: "",
      phone: "",
    })),
    volunteering: arr(resume.volunteer).map((v) => ({
      id: freshId("vol"),
      organization: str(v.organization),
      role: str(v.position),
      startDate: str(v.startDate),
      endDate: str(v.endDate),
      description: str(v.summary),
    })),
    strengths: [],
    interests: arr(resume.interests).map((i) => ({ id: freshId("int"), name: str(i.name) })),
    publications: arr(resume.publications).map((p) => ({
      id: freshId("pub"),
      title: str(p.name),
      publisher: str(p.publisher),
      date: str(p.releaseDate),
      link: str(p.url),
      description: str(p.summary),
    })),
    languages: arr(resume.languages).map((l) => ({
      id: freshId("lng"),
      name: str(l.language),
      proficiency: ratingFor(l.fluency),
    })),
    socialLinks: arr(b.profiles).map((p) => ({
      id: freshId("soc"),
      platform: str(p.network),
      url: str(p.url),
    })),
    customSections: [],
    // The schema says nothing about layout, so an import gets the standard
    // page and the author rearranges it from there.
    sectionOrder: DEFAULT_SECTION_ORDER.map((s) => ({ ...s })),
  };
}
