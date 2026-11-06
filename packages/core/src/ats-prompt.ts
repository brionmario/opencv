/**
 * The handoff to an agent.
 *
 * The static check in `ats.ts` knows the rules an ATS applies to a document
 * in isolation. It cannot read a job ad, weigh one phrasing against another,
 * or tell a real claim from a padded one. Rather than guess at that in the
 * editor, the panel hands it over: this builds a prompt, and the prompt
 * carries a link to the résumé itself, so whatever the person already talks
 * to can fetch the actual document instead of being told about it.
 *
 * The link is the whole point. A share URL *is* the document: the payload
 * travels in the fragment, so an agent with the opencv MCP server reads it
 * with one call, and an agent with a browser opens it. Either way the review
 * is of the real résumé, not of a paraphrase, and there is nothing to upload.
 */

import type { AtsCheck, AtsReport } from "./ats.js";
import { ATS_GROUP_LABELS, bySeverity } from "./ats.js";

export interface AtsPromptOptions {
  /** The static result, so the agent is not asked to redo what we did. */
  report: AtsReport;
  /** A read-only link to the open résumé. Omitted if one could not be made. */
  shareUrl?: string;
  /** The role being applied for, if the person named one. */
  targetRole?: string;
  /** The posting itself. This is what the static check cannot stand in for. */
  jobDescription?: string;
}

function line(check: AtsCheck): string {
  const mark = check.severity === "fail" ? "FAIL" : "WARN";
  const fix = check.fix ? ` Suggested fix: ${check.fix}` : "";
  return `- [${mark}] ${check.label}: ${check.detail}${fix}`;
}

/** Trimmed, because a whole careers page pasted in buries the ask. */
const JD_LIMIT = 6000;

/**
 * Builds the prompt to paste into an agent.
 *
 * Plain Markdown on purpose: it reads fine in a chat box, in a terminal and
 * in a file, and it survives being pasted anywhere in between.
 */
export function buildAtsPrompt(options: AtsPromptOptions): string {
  const { report, shareUrl, targetRole, jobDescription } = options;
  const flagged = bySeverity(report.checks).filter((c) => c.severity !== "pass");

  const parts: string[] = [];

  parts.push(
    "# Résumé review: ATS readiness and fit",
    "",
    "You are reviewing a résumé that has already passed through a static checker. " +
      "I need the part a static checker cannot do: whether this document actually " +
      "answers the role, and whether anything in it will be read wrongly by the " +
      "software that reads it before a person does."
  );

  /* ── The document ──────────────────────────────────────────────────────── */

  parts.push("", "## The résumé", "");
  if (shareUrl) {
    parts.push(
      "The link below *is* the document: the whole résumé is encoded in the URL " +
        "fragment, so there is no file to fetch and no account to sign into.",
      "",
      shareUrl,
      "",
      "Read it whichever way you can:",
      "",
      "- With the **opencv MCP server** (`https://github.com/brionmario/opencv`): " +
        "call `read_resume` with that URL. You get back JSON Resume plus the template " +
        "in use, and `update_resume` gives you a new link with your revisions applied.",
      "- With a **browser**: open the link. It renders the résumé read-only. The " +
        "payload is in the fragment, so a plain server-side fetch of the URL will " +
        "*not* see the content, it needs a real browser or the MCP server.",
      "",
      "If neither is available, say so and ask me to paste the text instead of " +
        "reviewing from the summary below alone."
    );
  } else {
    parts.push(
      "I could not generate a share link for this résumé, so ask me to paste the " +
        "text or attach the PDF before reviewing."
    );
  }

  /* ── The target ────────────────────────────────────────────────────────── */

  if (targetRole || jobDescription) {
    parts.push("", "## The role", "");
    if (targetRole) parts.push(`Target role: **${targetRole}**`, "");
    if (jobDescription) {
      const jd = jobDescription.trim();
      const clipped = jd.length > JD_LIMIT ? `${jd.slice(0, JD_LIMIT)}\n\n[truncated]` : jd;
      parts.push("Job description:", "", "```", clipped, "```");
    }
  } else {
    parts.push(
      "",
      "## The role",
      "",
      "No job description was supplied. Review against the target title on the " +
        "résumé itself, and tell me what a posting for that title would normally " +
        "ask for that this document does not evidence."
    );
  }

  /* ── What we already know ──────────────────────────────────────────────── */

  parts.push(
    "",
    "## What the static check already found",
    "",
    `Score: **${report.score}/100** (${report.counts.fail} failing, ` +
      `${report.counts.warn} warnings, ${report.counts.pass} passing).`,
    ""
  );

  if (flagged.length === 0) {
    parts.push(
      "Nothing is flagged. Every mechanical check passes, so spend your attention " +
        "on substance rather than on formatting."
    );
  } else {
    parts.push(
      "These are mechanical findings and I can fix them in the editor. Do not " +
        "spend the review relisting them. Say so only where one of them is wrong, " +
        "or where fixing it would change what the résumé claims:",
      ""
    );
    for (const group of ["contact", "structure", "content", "formatting"] as const) {
      const inGroup = flagged.filter((c) => c.group === group);
      if (inGroup.length === 0) continue;
      parts.push(`**${ATS_GROUP_LABELS[group]}**`, ...inGroup.map(line), "");
    }
  }

  /* ── The ask ───────────────────────────────────────────────────────────── */

  parts.push(
    "## What I need from you",
    "",
    "1. **Keyword coverage.** List the hard requirements and named technologies " +
      "in the posting, and for each one say where the résumé evidences it, or " +
      "that it does not. Flag anything the posting asks for by one name that the " +
      "résumé only calls by another, since a literal matcher will miss it.",
    "2. **Parse check.** If you can open the link, read the document in order and " +
      "tell me whether anything comes out interleaved, out of sequence, or " +
      "attached to the wrong heading. Two-column templates are where this goes " +
      "wrong, and it is invisible on screen.",
    "3. **Claim and evidence.** Point at any line that asserts impact without " +
      "something to back it, and at anything a competent interviewer would open " +
      "by asking about. I would rather cut a line than defend it badly.",
    "4. **The honest gaps.** Name the requirements I genuinely do not meet, and " +
      "say whether they are worth applying around or worth skipping the role " +
      "over. Do not pad the résumé to cover them, and do not invent experience.",
    "5. **Rewrites.** For the five weakest lines, give me a replacement. Keep " +
      "every number and fact as it stands; if a stronger line would need a figure " +
      "I have not given you, leave a clearly marked blank for me to fill.",
    "",
    "Be direct about what is weak. A review that tells me the résumé is fine is " +
      "worth nothing to me."
  );

  return parts.join("\n");
}
