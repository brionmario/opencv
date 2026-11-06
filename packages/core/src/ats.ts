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

  /* ── Formatting ────────────────────────────────────────────────────────── */

  const layout = options.layout ?? "professional";
  const meta = layoutMeta(layout);
  checks.push(
    check({
      id: "columns",
      group: "formatting",
      label: "Column count",
      weight: 2,
      ...(meta.columns === 1
        ? {
            severity: "pass" as const,
            detail: `${meta.name} is a single column, which is what a parser reads most reliably.`,
          }
        : {
            severity: "warn" as const,
            detail: `${meta.name} has two columns.`,
            fix: "Older parsers read a two-column page straight across and interleave the two. If the posting runs through a system you cannot identify, Classic or Minimal is the safer submission.",
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
