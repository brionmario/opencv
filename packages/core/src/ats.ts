/**
 * The ATS check.
 *
 * An applicant tracking system reads a résumé before a person does, and it
 * reads it badly: it wants a single column, standard headings, dates it can
 * parse and words it can match. Most of what it objects to is visible in the
 * document itself, so it can be checked here, with no model and no network.
 *
 * Two deliberate limits, both of which the panel says out loud:
 *
 * 1. This is a static check. It can see that a bullet has no number in it;
 *    it cannot see whether the résumé answers a particular job ad. That part
 *    is what `buildAtsPrompt` hands to an agent, along with a link to the
 *    document, so the judgement happens somewhere that can actually judge.
 * 2. Nothing here blocks anything. Every check produces a message. A low
 *    score is an opinion about one hiring pipeline, not a verdict on a
 *    résumé, and plenty of good reasons to ignore it exist.
 *
 * It lives in the package rather than the app because the rules are part of
 * the contract: an agent revising a résumé through the MCP server should be
 * held to the same checks the editor shows.
 */

import type { CVData } from "./types.js";
import type { LayoutType } from "./layouts.js";
import { layoutMeta } from "./layouts.js";
import { getEffectiveSectionOrder, sectionItemCount } from "./sections.js";

/* ── Shape ────────────────────────────────────────────────────────────────── */

/** `fail` is something a parser is likely to get wrong; `warn` is a risk. */
export type AtsSeverity = "pass" | "warn" | "fail";

/** Which heading the check sits under in the panel. */
export type AtsGroup = "contact" | "structure" | "content" | "formatting";

export interface AtsCheck {
  /** Stable id, so a check can be referenced from a prompt or a test. */
  id: string;
  group: AtsGroup;
  /** What is being checked, as a noun phrase. */
  label: string;
  severity: AtsSeverity;
  /** What the document currently says, in one sentence. */
  detail: string;
  /** What to do about it. Absent when the check passes. */
  fix?: string;
  /** The section this is about, so the panel can select it on the page. */
  sectionId?: string;
  /** How much it counts toward the score, relative to the other checks. */
  weight: number;
}

export interface AtsReport {
  /** 0 to 100, weighted, with a warning counting as half a pass. */
  score: number;
  checks: AtsCheck[];
  counts: { pass: number; warn: number; fail: number };
}

export interface AtsOptions {
  /** The template in use. Two-column templates carry a parsing risk. */
  layout?: LayoutType;
  /** Rendered page count, if the caller has measured one. */
  pageCount?: number;
}

export const ATS_GROUP_LABELS: Record<AtsGroup, string> = {
  contact: "Contact details",
  structure: "Structure",
  content: "Content",
  formatting: "Formatting",
};

/* ── Text helpers ─────────────────────────────────────────────────────────── */

/**
 * Rich-text fields hold HTML. An ATS sees the text an exporter writes out,
 * so every content check reads it the same way: tags gone, entities resolved,
 * whitespace collapsed.
 */
export function plainText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|ul|ol)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** Deliberately loose, and the same shape the header's own check uses. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

/**
 * Every line of prose an ATS would index: the summary, and each experience
 * description and highlight. Education and award descriptions are left out
 * on purpose, since the phrasing checks below are about how work is
 * described.
 */
function experienceLines(data: CVData): string[] {
  const lines: string[] = [];
  for (const job of data.experience ?? []) {
    const description = plainText(job.description);
    if (description) lines.push(description);
    for (const highlight of job.highlights ?? []) {
      const text = plainText(highlight);
      if (text) lines.push(text);
    }
  }
  return lines;
}

/* ── Dates ────────────────────────────────────────────────────────────────── */

/**
 * Shapes a parser can place on a timeline: a year, a year and month in
 * either order, or a month name with a year. "Present" and its cousins are
 * handled by the caller, since an open end date is a state rather than a
 * date.
 */
const DATE_SHAPES = [
  /^\d{4}$/,                                   // 2021
  /^\d{4}-\d{1,2}$/,                           // 2021-07
  /^\d{1,2}\/\d{4}$/,                          // 07/2021
  /^\d{4}\/\d{1,2}$/,                          // 2021/07
  /^\d{4}-\d{1,2}-\d{1,2}$/,                   // 2021-07-01
  /^[a-z]{3,9}\.?\s+\d{4}$/i,                  // July 2021, Jul. 2021
  /^\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4}$/i,        // 1 July 2021
];

const OPEN_ENDED = /^(present|current|now|ongoing|to date|till date)$/i;

function isParseableDate(value: string): boolean {
  const date = value.trim();
  if (!date) return false;
  return DATE_SHAPES.some((shape) => shape.test(date));
}

/** A bare year parses, but it leaves the length of a role ambiguous by up
 *  to eleven months, which is what makes two adjacent years read as a gap. */
const YEAR_ONLY = /^\d{4}$/;

/* ── Phrasing ─────────────────────────────────────────────────────────────── */

/**
 * Openers that spend the start of a bullet on the job's existence rather
 * than on what was done in it. Not an ATS problem as such: a keyword match
 * does not care. It is the reason the human who gets the match discards the
 * résumé anyway, which is the same outcome, so it is worth saying.
 */
const WEAK_OPENERS = [
  "responsible for",
  "duties included",
  "tasked with",
  "worked on",
  "worked with",
  "helped with",
  "helped to",
  "assisted with",
  "involved in",
  "in charge of",
];

/** First-person phrasing. Résumé convention drops it, and so should this. */
const FIRST_PERSON = /\b(i|i'm|i've|my|me|we|our)\b/i;

/**
 * The objective that says nothing. Every one of these is a stock phrase that
 * survives being pasted onto any résumé for any role, which is the test: a
 * summary that would fit someone else's application is not a summary.
 */
const GENERIC_OBJECTIVE = [
  "seeking a challenging position",
  "seeking a challenging role",
  "looking for a challenging",
  "to obtain a position",
  "to secure a position",
  "where i can utilize my skills",
  "utilize my skills and knowledge",
  "apply my knowledge and skills",
  "a reputed organization",
  "a reputable organization",
  "a well reputed company",
  "grow with the company",
  "growth of the organization",
  "hardworking and dedicated",
  "hard working and dedicated",
  "team player with excellent communication",
];

/**
 * The document labelling itself. A parser keys the record on the first
 * strong line it finds, and a heading that reads "Curriculum Vitae" takes
 * that slot from the name. It is also two lines of a six-second scan spent
 * telling the reader what they already know they are holding.
 */
const SELF_TITLE = /^(curriculum\s*vitae|curriculum|resum[eé]|cv|my\s+cv|my\s+resum[eé])$/i;

/** Said on the page, it spends a line on a convention nobody now expects. */
const REFERENCES_ON_REQUEST = /references?\s+(are\s+)?(available\s+)?(up)?on\s+request/i;

/**
 * Headings for the section the deck leaves off its list entirely. Flagged
 * rather than failed: a hobby that evidences the role is worth the line, and
 * nothing static can tell that one from a list of television programmes.
 */
const INTEREST_HEADINGS = new Set(["interests", "hobbies", "hobbies and interests", "interests and hobbies", "personal interests"]);

/**
 * Local parts that read as a handle rather than a person. Deliberately
 * narrow: a name with a birth year after it (silva94) is ordinary and is
 * not flagged, because a false accusation here is worse than a missed one.
 */
const HANDLE_WORD =
  "x+|cool|hot|sexy|cute|baby|babe|crazy|lazy|killer|savage|gamer|gaming|noob|pro|ninja|rockstar|boss|king|queen|prince|princess|angel|devil|dude|guy|girl|boy|boi|kid|lad|lover|dark|sad|lonely|bad|big|master|legend|silent|broken|sweet|little";

const HANDLE_SEGMENT = new RegExp(`^(?:${HANDLE_WORD})+$`, "i");
const HANDLE_TILE = new RegExp(`(${HANDLE_WORD})`, "gi");

/**
 * How much of a local part is built out of handle words.
 *
 * One of them on its own proves nothing: `king.charles` and `boss.kumar`
 * are shaped exactly like a name, and King is a surname. So this counts
 * only whole dot-separated segments that are made of nothing else, and the
 * caller requires two before it says anything. That costs the occasional
 * real handle, which is the trade this check is willing to make: being told
 * your name looks unprofessional is worse than not being told anything.
 */
function handleWordCount(localPart: string): number {
  let count = 0;
  for (const segment of localPart.split(/[._-]+/)) {
    const letters = segment.replace(/\d+/g, "");
    if (!letters || !HANDLE_SEGMENT.test(letters)) continue;
    count += (letters.match(HANDLE_TILE) ?? []).length;
  }
  return count;
}

/** Words that only appear in a street address, not in a city or a country. */
const STREET_WORDS =
  /\b(street|st\.|road|rd\.|lane|ln\.|avenue|ave\.|mawatha|place|drive|dr\.|court|crescent|terrace|boulevard|blvd\.|apartment|apt\.|flat|floor|suite|no\.)\b/i;

/**
 * Glyphs worth flagging: emoji, dingbats and decorative arrows. Accented
 * letters, curly quotes and dashes are left alone, since they survive
 * extraction fine and flagging a name would be insulting.
 */
const RISKY_GLYPHS =
  /[←-⇿⌀-⏿■-➿⬀-⯿️\u{1F000}-\u{1FAFF}]/u;

/* ── Check assembly ───────────────────────────────────────────────────────── */

/** Identity, there only so each literal below is checked against AtsCheck
 *  at the point it is written rather than once the array is assembled. */
function check(draft: AtsCheck): AtsCheck {
  return draft;
}

/** Every text field a glyph check should look at. */
function allText(data: CVData): string[] {
  const texts: string[] = [
    data.personalInfo.fullName,
    data.personalInfo.jobTitle,
    plainText(data.personalInfo.summary),
    ...experienceLines(data),
    ...(data.skills ?? []).map((s) => s.name),
    ...(data.education ?? []).map((e) => `${e.degree} ${e.institution} ${e.field}`),
    ...(data.awards ?? []).map((a) => `${a.title} ${a.issuer}`),
    ...(data.customSections ?? []).flatMap((s) => [
      s.title,
      ...s.items.map((i) => `${i.title} ${i.subtitle ?? ""} ${plainText(i.description)}`),
    ]),
  ];
  return texts.filter(Boolean);
}

/**
 * Custom headings an ATS is likely to recognize anyway. A screener maps
 * headings to its own fields by name, so an invented one tends to land in a
 * catch-all or nowhere at all.
 */
const KNOWN_HEADINGS = new Set([
  "projects",
  "certifications",
  "certificates",
  "volunteering",
  "volunteer experience",
  "publications",
  "awards",
  "achievements",
  "courses",
  "coursework",
  "training",
  "interests",
  "languages",
  "profile",
  "summary",
  "objective",
  "skills",
  "technical skills",
  "experience",
  "work experience",
  "education",
  "references",
]);

/* ── The checks ───────────────────────────────────────────────────────────── */

/**
 * Runs every static check over a document.
 *
 * Pure, synchronous and free of anything browser-shaped, so the editor can
 * call it on every keystroke and a script can call it on a file.
 *
 * A check with nothing to look at carries no weight. "Every date parses" is
 * trivially true of a résumé with no dates on it, and counting that as a
 * pass handed an empty document a respectable score, which is the one
 * reading this must never produce. Such a check still reports, so the panel
 * lists it, but it is left out of the arithmetic.
 */
export function runAtsChecks(data: CVData, options: AtsOptions = {}): AtsReport {
  const checks: AtsCheck[] = [];
  const info = data.personalInfo;

  const order = getEffectiveSectionOrder(data);
  const visible = new Set(order.filter((s) => !s.hidden).map((s) => s.id));
  const isVisible = (id: string) => visible.has(id);

  /* ── Contact ───────────────────────────────────────────────────────────── */

  const name = info.fullName?.trim() ?? "";
  checks.push(
    check({
      id: "name",
      group: "contact",
      label: "Name",
      weight: 3,
      ...(name
        ? { severity: "pass" as const, detail: `Reads as “${name}”.` }
        : {
            severity: "fail" as const,
            detail: "The résumé has no name on it.",
            fix: "Add your full name to the header. It is the field every screener keys the record on.",
          }),
    })
  );

  const email = info.email?.trim() ?? "";
  checks.push(
    check({
      id: "email",
      group: "contact",
      label: "Email address",
      weight: 3,
      ...(!email
        ? {
            severity: "fail" as const,
            detail: "No email address.",
            fix: "Add one. An application with no address to reply to is usually dropped on import.",
          }
        : EMAIL_RE.test(email)
          ? { severity: "pass" as const, detail: `Parses cleanly: ${email}.` }
          : {
              severity: "fail" as const,
              detail: `“${email}” is not a shape an address parser will accept.`,
              fix: "Check for a missing @ or a domain with no dot in it.",
            }),
    })
  );

  const phone = info.phone?.trim() ?? "";
  checks.push(
    check({
      id: "phone",
      group: "contact",
      label: "Phone number",
      weight: 2,
      ...(phone
        ? { severity: "pass" as const, detail: "A number is in the header." }
        : {
            severity: "warn" as const,
            detail: "No phone number.",
            fix: "Add one in international form (+94 71 234 5678). Some pipelines rank an incomplete contact record lower.",
          }),
    })
  );

  const location = info.location?.trim() ?? "";
  checks.push(
    check({
      id: "location",
      group: "contact",
      label: "Location",
      weight: 1,
      ...(location
        ? { severity: "pass" as const, detail: `Reads as “${location}”.` }
        : {
            severity: "warn" as const,
            detail: "No location.",
            fix: "Add at least a city and country. Location is a common filter, and a blank one filters out.",
          }),
    })
  );

  const jobTitle = info.jobTitle?.trim() ?? "";
  checks.push(
    check({
      id: "headline",
      group: "contact",
      label: "Target title",
      weight: 2,
      ...(jobTitle
        ? { severity: "pass" as const, detail: `Reads as “${jobTitle}”.` }
        : {
            severity: "warn" as const,
            detail: "No title under the name.",
            fix: "Add the title you are applying for. It is the first string a keyword match lands on.",
          }),
    })
  );

  // The address a screener forwards to the hiring manager. A handle in it
  // costs nothing mechanically and a great deal on the first impression,
  // which is the stage this field exists for.
  const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : "";
  const mostlyDigits = localPart.length > 0 && localPart.replace(/\D/g, "").length / localPart.length > 0.6;
  const handleLike = Boolean(localPart) && (handleWordCount(localPart) >= 2 || mostlyDigits);
  checks.push(
    check({
      id: "email-tone",
      group: "contact",
      label: "Email address reads professionally",
      weight: email ? 1 : 0,
      ...(!email
        ? { severity: "pass" as const, detail: "No address to judge yet." }
        : handleLike
          ? {
              severity: "warn" as const,
              detail: `“${localPart}” reads as a handle rather than a name.`,
              fix: "Use something built from your name. This is the address a screener forwards to the hiring manager, and it is read as a choice.",
            }
          : { severity: "pass" as const, detail: "Built from a name, as a screener expects." }),
    })
  );

  // A city and a country are a filter a pipeline runs. A street and a house
  // number are neither useful to it nor something to publish on a document
  // that gets forwarded and stored in systems you will never see.
  const hasStreet = Boolean(location) && (STREET_WORDS.test(location) || /^\d+[\s,/]/.test(location));
  checks.push(
    check({
      id: "address-detail",
      group: "contact",
      label: "Address detail",
      weight: location ? 1 : 0,
      ...(!location
        ? { severity: "pass" as const, detail: "No location to judge yet." }
        : hasStreet
          ? {
              severity: "warn" as const,
              detail: "The location looks like a full street address.",
              fix: "Cut it to a city and a country. Nothing matches on the street, and the document gets forwarded and stored well beyond the people you sent it to.",
            }
          : { severity: "pass" as const, detail: "A city and country, which is what a location filter reads." }),
    })
  );

  // Two numbers in one field is one field a parser cannot place, and a
  // question for whoever is calling about which of them to try.
  const phoneRuns = phone.split(/[/,;]|\bor\b/i).filter((part) => part.replace(/\D/g, "").length >= 7);
  checks.push(
    check({
      id: "phone-count",
      group: "contact",
      label: "One phone number",
      weight: phone ? 1 : 0,
      ...(!phone
        ? { severity: "pass" as const, detail: "No number to judge yet." }
        : phoneRuns.length > 1
          ? {
              severity: "warn" as const,
              detail: `${phoneRuns.length} numbers in one field.`,
              fix: "Keep the one you answer. A parser stores a single value, so it takes whichever it reaches first and the rest become noise in the middle of your contact line.",
            }
          : { severity: "pass" as const, detail: "A single number, which is what the field holds." }),
    })
  );

  /* ── Structure ─────────────────────────────────────────────────────────── */

  const experience = data.experience ?? [];
  checks.push(
    check({
      id: "experience-section",
      group: "structure",
      label: "Experience section",
      weight: 3,
      sectionId: "experience",
      ...(experience.length === 0
        ? {
            severity: "fail" as const,
            detail: "No experience entries.",
            fix: "Add your roles. Experience is the section most screeners score on first.",
          }
        : !isVisible("experience")
          ? {
              severity: "fail" as const,
              detail: `${experience.length} ${experience.length === 1 ? "entry" : "entries"} exist, but the section is hidden, so nothing prints.`,
              fix: "Show the Experience section.",
            }
          : {
              severity: "pass" as const,
              detail: `${experience.length} ${experience.length === 1 ? "role" : "roles"}, under a standard heading.`,
            }),
    })
  );

  const education = data.education ?? [];
  checks.push(
    check({
      id: "education-section",
      group: "structure",
      label: "Education section",
      weight: 2,
      sectionId: "education",
      ...(education.length > 0 && isVisible("education")
        ? {
            severity: "pass" as const,
            detail: `${education.length} ${education.length === 1 ? "entry" : "entries"}.`,
          }
        : {
            severity: "warn" as const,
            detail: education.length === 0 ? "No education entries." : "The section is hidden.",
            fix: "Add or show it. Plenty of pipelines treat a missing education record as an incomplete application.",
          }),
    })
  );

  const skills = data.skills ?? [];
  const SKILL_FLOOR = 6;
  checks.push(
    check({
      id: "skills-section",
      group: "structure",
      label: "Skills section",
      weight: 3,
      sectionId: "skills",
      ...(skills.length === 0 || !isVisible("skills")
        ? {
            severity: "fail" as const,
            detail: skills.length === 0 ? "No skills listed." : "The section is hidden.",
            fix: "List your skills as separate entries. This is the section keyword matching reads most literally.",
          }
        : skills.length < SKILL_FLOOR
          ? {
              severity: "warn" as const,
              detail: `Only ${skills.length} ${skills.length === 1 ? "skill" : "skills"} listed.`,
              fix: `Aim for ${SKILL_FLOOR} or more, named the way the job ad names them.`,
            }
          : { severity: "pass" as const, detail: `${skills.length} skills, each its own entry.` }),
    })
  );

  // A skill entry carrying a sentence is a keyword a matcher will not find,
  // because it matches against the whole entry.
  const longSkills = skills.filter((s) => wordCount(s.name) > 4);
  checks.push(
    check({
      id: "skills-granularity",
      group: "structure",
      label: "Skills as keywords",
      weight: skills.length === 0 ? 0 : 1,
      sectionId: "skills",
      ...(longSkills.length === 0
        ? { severity: "pass" as const, detail: "Each skill is short enough to match as a keyword." }
        : {
            severity: "warn" as const,
            detail: `${longSkills.length} ${longSkills.length === 1 ? "entry reads" : "entries read"} as a phrase rather than a keyword, starting with “${longSkills[0].name.slice(0, 40)}”.`,
            fix: "Split them. A matcher compares whole entries, so a sentence matches nothing.",
          }),
    })
  );

  const summary = plainText(info.summary);
  const summaryWords = wordCount(summary);
  checks.push(
    check({
      id: "summary-section",
      group: "structure",
      label: "Summary",
      weight: 2,
      sectionId: "summary",
      ...(summaryWords === 0
        ? {
            severity: "warn" as const,
            detail: "No summary.",
            fix: "Write 40 to 90 words naming your role, your years and your two or three strongest skills.",
          }
        : summaryWords < 25
          ? {
              severity: "warn" as const,
              detail: `${summaryWords} words, too short to carry any keywords.`,
              fix: "Take it to 40 to 90 words.",
            }
          : summaryWords > 140
            ? {
                severity: "warn" as const,
                detail: `${summaryWords} words, long enough that the top of the résumé is spent on prose.`,
                fix: "Cut it to 40 to 90 words.",
              }
            : { severity: "pass" as const, detail: `${summaryWords} words.` }),
    })
  );

  // Of the four fields a role record needs, the employer is the one with no
  // fallback: a title with no company behind it cannot be verified, dated
  // against anything, or matched to an industry.
  const unnamedEmployers = experience.filter((job) => !job.company?.trim());
  checks.push(
    check({
      id: "company-names",
      group: "structure",
      label: "Employer on every role",
      weight: experience.length === 0 ? 0 : 2,
      sectionId: "experience",
      ...(experience.length === 0
        ? { severity: "pass" as const, detail: "No roles yet." }
        : unnamedEmployers.length === 0
          ? { severity: "pass" as const, detail: "Every role names where it was." }
          : {
              severity: "fail" as const,
              detail: `${unnamedEmployers.length} ${unnamedEmployers.length === 1 ? "role has" : "roles have"} no employer, starting with “${unnamedEmployers[0].jobTitle || "an untitled role"}”.`,
              fix: "Add the organization name. A role record with no employer in it cannot be placed in an industry or checked against anything.",
            }),
    })
  );

  // Achievements are one of the six things a reader looks for in the first
  // pass, and the only one that distinguishes two people with the same job
  // title. Awards is where this template puts them; a custom section by a
  // conventional name counts just as well.
  const achievementHeadings = new Set(["achievements", "certifications", "certificates", "awards", "accomplishments", "honours", "honors"]);
  const achievementCustom = (data.customSections ?? []).filter(
    (s) => isVisible(s.id) && s.items.length > 0 && achievementHeadings.has(s.title.trim().toLowerCase())
  );
  const awards = data.awards ?? [];
  const hasAchievements = (awards.length > 0 && isVisible("awards")) || achievementCustom.length > 0;
  checks.push(
    check({
      id: "achievements-section",
      group: "structure",
      label: "Achievements or certifications",
      weight: 1,
      sectionId: "awards",
      ...(hasAchievements
        ? { severity: "pass" as const, detail: "The résumé evidences something beyond the roles themselves." }
        : {
            severity: "warn" as const,
            detail: "Nothing on the page records an achievement or a certification.",
            fix: "Add a section for them. It is the part of a first pass that separates two people holding the same job title, and a certification is the one claim on a résumé that can be checked.",
          }),
    })
  );

  const oddHeadings = (data.customSections ?? [])
    .filter((s) => isVisible(s.id))
    .filter((s) => !KNOWN_HEADINGS.has(s.title.trim().toLowerCase()));
  checks.push(
    check({
      id: "headings",
      group: "structure",
      label: "Section headings",
      weight: 1,
      sectionId: oddHeadings[0]?.id,
      ...(oddHeadings.length === 0
        ? { severity: "pass" as const, detail: "Every heading is one a screener maps to a field." }
        : {
            severity: "warn" as const,
            detail: `${oddHeadings.length} heading${oddHeadings.length === 1 ? "" : "s"} a parser will not recognize: ${oddHeadings.map((s) => `“${s.title}”`).join(", ")}.`,
            fix: "Rename to a conventional heading where you can, such as Projects, Certifications or Volunteering. Anything unrecognized tends to land in a catch-all field.",
          }),
    })
  );

  /* ── Content ───────────────────────────────────────────────────────────── */

  const datedEntries: { label: string; start: string; end: string; open: boolean }[] = [
    ...experience.map((job) => ({
      label: job.jobTitle || job.company || "an experience entry",
      start: job.startDate ?? "",
      end: job.endDate ?? "",
      open: Boolean(job.currentlyWorking),
    })),
    ...education.map((entry) => ({
      label: entry.degree || entry.institution || "an education entry",
      start: entry.startDate ?? "",
      end: entry.endDate ?? "",
      open: false,
    })),
  ];

  const missingDates = datedEntries.filter(
    (entry) => !entry.start.trim() || (!entry.open && !entry.end.trim())
  );
  checks.push(
    check({
      id: "dates-present",
      group: "content",
      label: "Dates on every entry",
      weight: datedEntries.length === 0 ? 0 : 3,
      sectionId: "experience",
      ...(datedEntries.length === 0
        ? { severity: "pass" as const, detail: "Nothing dated yet." }
        : missingDates.length === 0
          ? { severity: "pass" as const, detail: "Every role and qualification is dated." }
          : {
              severity: "fail" as const,
              detail: `${missingDates.length} ${missingDates.length === 1 ? "entry is" : "entries are"} missing a date, starting with “${missingDates[0].label}”.`,
              fix: "Fill in both dates, or mark the role as current. Undated experience is what makes a parser compute zero years.",
            }),
    })
  );

  const unparseableDates = datedEntries
    .flatMap((entry) => [entry.start, entry.open ? "" : entry.end])
    .filter((value) => value.trim())
    .filter((value) => !isParseableDate(value) && !OPEN_ENDED.test(value.trim()));
  checks.push(
    check({
      id: "dates-format",
      group: "content",
      label: "Date format",
      weight: datedEntries.length === 0 ? 0 : 2,
      sectionId: "experience",
      ...(unparseableDates.length === 0
        ? { severity: "pass" as const, detail: "Every date is in a shape a parser reads." }
        : {
            severity: "warn" as const,
            detail: `${unparseableDates.length} date${unparseableDates.length === 1 ? "" : "s"} in an unusual format, such as “${unparseableDates[0]}”.`,
            fix: "Use a month and a year (Jul 2021, or 2021-07). Anything freer gets read as text, and a role with no readable span counts for nothing.",
          }),
    })
  );

  // A bare year parses, so `dates-format` passes it. It still leaves the
  // span of a role ambiguous by up to eleven months, which is how two
  // adjacent years come out of a parser looking like a gap.
  const yearOnlyDates = datedEntries
    .flatMap((entry) => [entry.start, entry.open ? "" : entry.end])
    .filter((value) => YEAR_ONLY.test(value.trim()));
  checks.push(
    check({
      id: "dates-granularity",
      group: "content",
      label: "Month and year",
      weight: datedEntries.length === 0 ? 0 : 1,
      sectionId: "experience",
      ...(yearOnlyDates.length === 0
        ? { severity: "pass" as const, detail: "Every date carries a month." }
        : {
            severity: "warn" as const,
            detail: `${yearOnlyDates.length} date${yearOnlyDates.length === 1 ? " is" : "s are"} a year on its own, such as “${yearOnlyDates[0]}”.`,
            fix: "Add the month (Jul 2021). A year on its own leaves the length of the role uncertain by up to eleven months, and two years side by side read as a gap that was never there.",
          }),
    })
  );

  const emptyRoles = experience.filter(
    (job) => !plainText(job.description) && (job.highlights ?? []).every((h) => !plainText(h))
  );
  checks.push(
    check({
      id: "role-detail",
      group: "content",
      label: "Detail under each role",
      weight: experience.length === 0 ? 0 : 2,
      sectionId: "experience",
      ...(experience.length === 0
        ? { severity: "pass" as const, detail: "No roles yet." }
        : emptyRoles.length === 0
          ? { severity: "pass" as const, detail: "Every role says what you did." }
          : {
              severity: "warn" as const,
              detail: `${emptyRoles.length} ${emptyRoles.length === 1 ? "role has" : "roles have"} a title and nothing under it, starting with “${emptyRoles[0].jobTitle || emptyRoles[0].company}”.`,
              fix: "Add two or three bullets each. A job title on its own carries no keywords.",
            }),
    })
  );

  const lines = experienceLines(data);
  const quantified = lines.filter((line) => /\d/.test(line));
  const quantifiedShare = lines.length ? quantified.length / lines.length : 0;
  checks.push(
    check({
      id: "quantified",
      group: "content",
      label: "Measured results",
      weight: lines.length === 0 ? 0 : 2,
      sectionId: "experience",
      ...(lines.length === 0
        ? { severity: "pass" as const, detail: "Nothing written yet." }
        : quantifiedShare >= 0.3
          ? {
              severity: "pass" as const,
              detail: `${quantified.length} of ${lines.length} lines carry a number.`,
            }
          : {
              severity: "warn" as const,
              detail:
                quantified.length === 0
                  ? `None of the ${lines.length} lines under your roles carry a number.`
                  : `Only ${quantified.length} of ${lines.length} lines carry a number.`,
              fix: "Put a figure in at least a third of them: how much, how many, how fast, how much cheaper.",
            }),
    })
  );

  const weakLines = lines.filter((line) =>
    WEAK_OPENERS.some((opener) => line.toLowerCase().startsWith(opener))
  );
  checks.push(
    check({
      id: "weak-openers",
      group: "content",
      label: "Bullet openers",
      weight: lines.length === 0 ? 0 : 1,
      sectionId: "experience",
      ...(weakLines.length === 0
        ? { severity: "pass" as const, detail: "No bullet opens on what you were assigned." }
        : {
            severity: "warn" as const,
            detail: `${weakLines.length} line${weakLines.length === 1 ? "" : "s"} open with a phrase about the job rather than the work, starting with “${weakLines[0].slice(0, 48)}…”.`,
            fix: "Open on a verb: Built, Led, Cut, Shipped, Migrated.",
          }),
    })
  );

  const firstPersonLines = [summary, ...lines].filter((line) => FIRST_PERSON.test(line));
  checks.push(
    check({
      id: "first-person",
      group: "content",
      label: "Voice",
      weight: lines.length === 0 && !summary ? 0 : 1,
      ...(firstPersonLines.length === 0
        ? { severity: "pass" as const, detail: "Written in the implied first person, as convention expects." }
        : {
            severity: "warn" as const,
            detail: `${firstPersonLines.length} line${firstPersonLines.length === 1 ? "" : "s"} use “I”, “my” or “we”.`,
            fix: "Drop the pronoun: “Led the migration”, not “I led the migration”.",
          }),
    })
  );

  // A summary made of stock phrases is worse than no summary: it occupies
  // the one position on the page that is read every time, and spends it on
  // sentences that would sit just as well on anybody else's application.
  const matchedStock = GENERIC_OBJECTIVE.filter((phrase) => summary.toLowerCase().includes(phrase));
  checks.push(
    check({
      id: "generic-objective",
      group: "content",
      label: "Summary says something specific",
      weight: summaryWords === 0 ? 0 : 2,
      sectionId: "summary",
      ...(summaryWords === 0
        ? { severity: "pass" as const, detail: "Nothing written yet." }
        : matchedStock.length === 0
          ? { severity: "pass" as const, detail: "Nothing in it is stock phrasing." }
          : {
              severity: "warn" as const,
              detail: `The summary uses stock phrasing: “${matchedStock[0]}”.`,
              fix: "Replace it with what you have actually done: your role, your years, and the two or three things you are strongest at. A line that would fit anyone's résumé tells a reader nothing about yours.",
            }),
    })
  );

  // The name field is what a parser keys the record on. A document that
  // labels itself hands that slot to the word "Resume".
  const titledSelf = SELF_TITLE.test(name);
  const selfTitledHeadings = (data.customSections ?? [])
    .filter((s) => isVisible(s.id))
    .filter((s) => SELF_TITLE.test(s.title.trim()));
  checks.push(
    check({
      id: "document-title",
      group: "content",
      label: "No “Curriculum Vitae” label",
      weight: 1,
      sectionId: selfTitledHeadings[0]?.id,
      ...(!titledSelf && selfTitledHeadings.length === 0
        ? { severity: "pass" as const, detail: "The document leads with your name rather than with its own description." }
        : {
            severity: "warn" as const,
            detail: titledSelf
              ? "The name field reads as a document label rather than a name."
              : `A heading reads “${selfTitledHeadings[0].title}”.`,
            fix: "Delete it. Everyone receiving the file knows what it is, and the top of the page is the most-read line you have.",
          }),
    })
  );

  // References on the page spend space on contact details nobody asked for
  // yet, and expose three other people's numbers to every system the file
  // passes through.
  const references = data.references ?? [];
  const referencesShown = references.length > 0 && isVisible("references");
  const onRequest = [summary, ...lines, ...(data.customSections ?? []).flatMap((s) => s.items.map((i) => plainText(i.description)))].some(
    (text) => REFERENCES_ON_REQUEST.test(text)
  );
  checks.push(
    check({
      id: "references-on-page",
      group: "content",
      label: "References held back",
      weight: 1,
      sectionId: "references",
      ...(referencesShown || onRequest
        ? {
            severity: "warn" as const,
            detail: referencesShown
              ? `${references.length} ${references.length === 1 ? "reference is" : "references are"} printed on the résumé.`
              : "The résumé says references are available on request.",
            fix: referencesShown
              ? "Hide the section and supply them when asked. It is space spent on contact details nobody has requested, and it puts three other people's numbers into every system this file passes through."
              : "Drop the line. It is assumed, and it costs you a line of a page you are trying to keep to two.",
          }
        : { severity: "pass" as const, detail: "No reference details on the page, which is the current convention." }),
    })
  );

  // Hobbies are flagged, never failed. One that evidences the role earns its
  // line; nothing static can tell that one from a list of box sets.
  const interestSections = (data.customSections ?? [])
    .filter((s) => isVisible(s.id) && s.items.length > 0)
    .filter((s) => INTEREST_HEADINGS.has(s.title.trim().toLowerCase()));
  checks.push(
    check({
      id: "interests-section",
      group: "content",
      label: "Interests earn their space",
      weight: interestSections.length === 0 ? 0 : 1,
      sectionId: interestSections[0]?.id,
      ...(interestSections.length === 0
        ? { severity: "pass" as const, detail: "No interests section competing with the rest of the page." }
        : {
            severity: "warn" as const,
            detail: `“${interestSections[0].title}” holds ${interestSections[0].items.length} ${interestSections[0].items.length === 1 ? "entry" : "entries"}.`,
            fix: "Keep only what says something about the work: a side project, a competition, something you organized. An interest a reader cannot connect to the role is space taken from one that could.",
          }),
    })
  );

  /* ── Formatting ────────────────────────────────────────────────────────── */

  const layout = options.layout ?? "professional";
  const meta = layoutMeta(layout);
  checks.push(
    check({
      id: "columns",
      group: "formatting",
      // Weighted below the other formatting checks on purpose. The usual
      // two-column disaster is a text layer that interleaves the columns,
      // and this exporter does not produce one: it writes the left column
      // out whole, then the right. The residual risk is a parser that does
      // its own spatial reconstruction, which is real but narrower than the
      // generic advice assumes, so it costs less than a photo does.
      label: "Column count",
      weight: 1,
      ...(meta.columns === 1
        ? {
            severity: "pass" as const,
            detail: `${meta.name} is a single column, which is what a parser reads most reliably.`,
          }
        : {
            severity: "warn" as const,
            detail: `${meta.name} has two columns, though the PDF export writes them in reading order.`,
            fix: "The export puts the whole left column in the text layer before the right one, so a parser reading the file in order gets clean text, which is the failure this warning usually describes and it does not apply here. What remains is the parser that ignores that order and reconstructs the page from where the words sit. If the posting runs through a system you cannot identify, Classic or Minimal removes the question.",
          }),
    })
  );

  const hasPhoto = Boolean(info.avatar || info.photo);
  checks.push(
    check({
      id: "photo",
      group: "formatting",
      label: "Photo",
      weight: 2,
      ...(hasPhoto
        ? {
            severity: "warn" as const,
            detail: "The résumé carries a photo.",
            fix: "An image contributes nothing to a text extraction, some screeners discard the file to avoid a bias claim, and it makes a share link far longer. Keep it only where a photo is expected locally.",
          }
        : { severity: "pass" as const, detail: "No photo, which is the safer default for a screened application." }),
    })
  );

  if (typeof options.pageCount === "number") {
    const pages = options.pageCount;
    checks.push(
      check({
        id: "length",
        group: "formatting",
        label: "Length",
        weight: 2,
        ...(pages <= 2
          ? { severity: "pass" as const, detail: `${pages} page${pages === 1 ? "" : "s"}.` }
          : pages === 3
            ? {
                severity: "warn" as const,
                detail: "Three pages.",
                fix: "Cut to two unless you are in academia or a senior role with a publication list.",
              }
            : {
                severity: "fail" as const,
                detail: `${pages} pages.`,
                fix: "Cut to two. Past that, the later pages are rarely read by anyone.",
              }),
      })
    );
  }

  const glyphText = allText(data).filter((text) => RISKY_GLYPHS.test(text));
  checks.push(
    check({
      id: "glyphs",
      group: "formatting",
      label: "Characters",
      weight: allText(data).length === 0 ? 0 : 1,
      ...(glyphText.length === 0
        ? { severity: "pass" as const, detail: "Nothing but text a PDF extraction will keep." }
        : {
            severity: "warn" as const,
            detail: `${glyphText.length} field${glyphText.length === 1 ? "" : "s"} contain an emoji or a decorative symbol.`,
            fix: "Replace them with words. They extract as noise, or as nothing.",
          }),
    })
  );

  const links = [
    info.website?.trim() ?? "",
    ...(data.socialLinks ?? []).map((link) => link.url?.trim() ?? ""),
  ].filter(Boolean);
  const bareLinks = links.filter((url) => !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url));
  checks.push(
    check({
      id: "links",
      group: "formatting",
      label: "Links",
      weight: 1,
      sectionId: "socialLinks",
      ...(links.length === 0
        ? {
            severity: "warn" as const,
            detail: "No links.",
            fix: "Add at least a LinkedIn or portfolio URL. It is a field most pipelines have a slot for.",
          }
        : bareLinks.length === 0
          ? { severity: "pass" as const, detail: `${links.length} link${links.length === 1 ? "" : "s"}, each a full URL.` }
          : {
              severity: "warn" as const,
              detail: `${bareLinks.length} link${bareLinks.length === 1 ? "" : "s"} written without a scheme, starting with “${bareLinks[0]}”.`,
              fix: "Write the whole URL, https:// included, so it extracts as a link rather than as text.",
            }),
    })
  );

  const emptyVisible = order
    .filter((s) => !s.hidden)
    .filter((s) => {
      if (s.id === "summary") return !summary;
      return sectionItemCount(data, s.id) === 0;
    });
  checks.push(
    check({
      id: "empty-sections",
      group: "formatting",
      label: "Empty sections",
      weight: 1,
      sectionId: emptyVisible[0]?.id,
      ...(emptyVisible.length === 0
        ? { severity: "pass" as const, detail: "No section on the page is empty." }
        : {
            severity: "warn" as const,
            detail: `${emptyVisible.length} section${emptyVisible.length === 1 ? "" : "s"} on the page would print a heading with nothing under it.`,
            fix: "Fill them or hide them. Export already drops them, so this is mostly about what you are looking at.",
          }),
    })
  );

  /* ── Score ─────────────────────────────────────────────────────────────── */

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce(
    (sum, c) => sum + c.weight * (c.severity === "pass" ? 1 : c.severity === "warn" ? 0.5 : 0),
    0
  );

  return {
    score: totalWeight ? Math.round((earned / totalWeight) * 100) : 100,
    checks,
    counts: {
      pass: checks.filter((c) => c.severity === "pass").length,
      warn: checks.filter((c) => c.severity === "warn").length,
      fail: checks.filter((c) => c.severity === "fail").length,
    },
  };
}

/** A one-word read on a score, for the panel and the status bar. */
export function atsVerdict(score: number): "strong" | "fair" | "weak" {
  if (score >= 85) return "strong";
  if (score >= 65) return "fair";
  return "weak";
}

/** Fails first, then warnings, then everything that passed. */
export function bySeverity(checks: AtsCheck[]): AtsCheck[] {
  const rank: Record<AtsSeverity, number> = { fail: 0, warn: 1, pass: 2 };
  return [...checks].sort((a, b) => rank[a.severity] - rank[b.severity] || b.weight - a.weight);
}
