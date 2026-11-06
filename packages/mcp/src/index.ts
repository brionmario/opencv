#!/usr/bin/env node
/**
 * opencv as an MCP server.
 *
 * opencv is a static site with no backend, which normally means there is
 * nothing for an agent to call. What makes this possible is that a résumé
 * lives entirely in its own URL: minting one is a pure function, so the whole
 * build-and-share loop runs here, in process, and the link it returns is
 * served by the same static site a person uses.
 *
 * Documents are spoken in JSON Resume rather than opencv's internal shape.
 * An agent already knows that schema, and the internal one is full of editor
 * bookkeeping (entry ids, section columns) that would be noise to generate
 * and a trap to hand-edit.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  LAYOUTS,
  DEFAULT_THEME,
  ATS_GROUP_LABELS,
  atsVerdict,
  bySeverity,
  fromJsonResume,
  runAtsChecks,
  toJsonResume,
  starterTemplates,
  type AtsCheck,
  type AtsGroup,
  type AtsReport,
  type CVData,
  type CVTheme,
  type LayoutType,
} from "@brionmario/opencv-core";
import { BASE_URL, LONG_URL, buildShareUrl, parseShareUrl } from "./share-url.js";

const LAYOUT_IDS = LAYOUTS.map((l) => l.id) as [LayoutType, ...LayoutType[]];

const layoutArg = z
  .enum(LAYOUT_IDS)
  .default("professional")
  .describe(`Template to render with. One of: ${LAYOUT_IDS.join(", ")}.`);

/**
 * JSON Resume is accepted loosely on purpose. The schema is large, mostly
 * optional, and an agent assembling one should not be rejected over a field
 * this app has no use for; fromJsonResume already coerces what it reads and
 * ignores what it does not.
 */
const resumeArg = z
  .record(z.unknown())
  .describe(
    "The résumé as JSON Resume (https://jsonresume.org/schema): " +
      "{ basics, work, education, skills, … }. Unknown fields are ignored."
  );

const themeArg = z
  .object({
    primaryColor: z.string().optional().describe("Accent colour, e.g. #db2777"),
    headingColor: z.string().optional(),
    bodyColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontFace: z.string().optional().describe("CSS font stack"),
  })
  .partial()
  .optional()
  .describe("Optional colour and type overrides. Anything omitted keeps the default.");

/** Tool results are text; this keeps the shape in one place. */
function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

function failure(body: string) {
  return { ...text(body), isError: true };
}

/** What to say about a link once it exists, including when it is unwieldy. */
function describeLink(url: string, hasPhoto: boolean): string {
  const kb = Math.round(url.length / 1024);
  const lines = [url, "", `The whole résumé is inside that link (${kb}KB); there is no server
holding it, so it works anywhere it is pasted and stops working if it
is truncated.`];

  if (url.length > LONG_URL) {
    lines.push(
      "",
      hasPhoto
        ? "It is long enough that some chat and mail clients will shorten it. The embedded photo is most of that weight; dropping it would cut the link substantially."
        : "It is long enough that some chat and mail clients will shorten it. Send it as a plain URL rather than linked text."
    );
  }

  return lines.join("\n");
}

const server = new McpServer({ name: "opencv", version: "0.1.0" });

/* ── Templates ────────────────────────────────────────────────────────────── */

server.registerTool(
  "list_templates",
  {
    title: "List templates",
    description:
      "The résumé templates available, with what each one is suited to. Call this before create_resume if the user has not named a template.",
    inputSchema: {},
  },
  async () =>
    text(
      LAYOUTS.map(
        (l) =>
          `${l.id}: ${l.name} (${l.columns} column${l.columns > 1 ? "s" : ""})\n  ${l.desc}`
      ).join("\n\n")
    )
);

server.registerTool(
  "get_sample_resume",
  {
    title: "Get a sample résumé",
    description:
      "A complete, well-formed résumé in JSON Resume, to use as a starting point or as a shape reference when building one from scratch.",
    inputSchema: {},
  },
  async () => {
    const sample = starterTemplates.find((t) => t.id === "professional") ?? starterTemplates[0];
    return text(JSON.stringify(toJsonResume(sample.data), null, 2));
  }
);

/* ── Create ───────────────────────────────────────────────────────────────── */

server.registerTool(
  "create_resume",
  {
    title: "Create a résumé",
    description:
      "Renders a JSON Resume into an opencv résumé and returns a link to it. " +
      "The link is read-only and self-contained: the document travels inside the URL, " +
      "so nothing is stored anywhere and the recipient needs no account.",
    inputSchema: { resume: resumeArg, layout: layoutArg, theme: themeArg },
  },
  async ({ resume, layout, theme }) => {
    const data = fromJsonResume(resume as never);

    if (!data.personalInfo.fullName && data.experience.length === 0) {
      return failure(
        "That résumé has neither a name nor any work history, so there would be nothing to show. " +
          "Expected JSON Resume: at least basics.name, and usually a work array. " +
          "Call get_sample_resume to see the shape."
      );
    }

    const merged: CVTheme = { ...DEFAULT_THEME, ...(theme ?? {}) };
    const url = await buildShareUrl({ v: 1, data, theme: merged, layout });

    return text(
      `Created “${data.personalInfo.fullName || "Untitled"}” using the ${layout} template.\n\n` +
        describeLink(url, !!data.personalInfo.avatar) +
        `\n\nOpening it offers “Edit a copy”, which loads it into the editor at ${BASE_URL}.`
    );
  }
);

/* ── Read ─────────────────────────────────────────────────────────────────── */

server.registerTool(
  "read_resume",
  {
    title: "Read a résumé link",
    description:
      "Decodes an opencv share link and returns the résumé as JSON Resume, with the template it uses. Use this to inspect or revise a résumé someone has sent.",
    inputSchema: {
      url: z
        .string()
        .describe("An opencv share link, or just the encoded part after the '#cv='."),
    },
  },
  async ({ url }) => {
    const result = await parseShareUrl(url);
    if ("error" in result) return failure(result.error);

    const { data, layout } = result.payload;
    return text(
      `Template: ${layout ?? "professional"}\n\n${JSON.stringify(toJsonResume(data), null, 2)}`
    );
  }
);

/* ── Update ───────────────────────────────────────────────────────────────── */

server.registerTool(
  "update_resume",
  {
    title: "Update a résumé",
    description:
      "Takes an existing share link and returns a new one with changes applied. " +
      "Because a link IS the document, the original keeps working unchanged, " +
      "share the new link to supersede it. Pass only what you are changing.",
    inputSchema: {
      url: z.string().describe("The share link to revise."),
      resume: resumeArg
        .optional()
        .describe(
          "A full replacement résumé in JSON Resume. Omit to change only the template or theme. " +
            "To edit content, call read_resume first, modify what it returns, and pass it back whole."
        ),
      layout: z.enum(LAYOUT_IDS).optional().describe("Switch to a different template."),
      theme: themeArg,
    },
  },
  async ({ url, resume, layout, theme }) => {
    const result = await parseShareUrl(url);
    if ("error" in result) return failure(result.error);

    const current = result.payload;
    if (!resume && !layout && !theme) {
      return failure(
        "Nothing to change. Pass a resume, a layout, a theme, or some combination of them."
      );
    }

    const data = resume ? fromJsonResume(resume as never) : current.data;
    const next = await buildShareUrl({
      v: 1,
      data,
      theme: { ...DEFAULT_THEME, ...(current.theme ?? {}), ...(theme ?? {}) },
      layout: layout ?? current.layout ?? "professional",
    });

    const changed = [resume && "content", layout && `template (${layout})`, theme && "theme"]
      .filter(Boolean)
      .join(", ");

    return text(
      `Updated ${changed}.\n\n${describeLink(next, !!data.personalInfo.avatar)}\n\n` +
        `The link you passed in still resolves to the previous version.`
    );
  }
);

/* ── Check ────────────────────────────────────────────────────────────────── */

const VERDICT_LINE = {
  strong: "reads cleanly",
  fair: "some risk",
  weak: "likely to be misread",
} as const;

/** One finding, as a line an agent can act on without parsing anything. */
function findingLine(check: AtsCheck): string {
  const mark = check.severity === "fail" ? "FAIL" : "WARN";
  return check.fix
    ? `- [${mark}] ${check.label}: ${check.detail}\n      Fix: ${check.fix}`
    : `- [${mark}] ${check.label}: ${check.detail}`;
}

/**
 * The report as text rather than JSON.
 *
 * An agent is going to read this and decide what to change, not deserialize
 * it, and the fix lines are the useful part. The check ids are included so a
 * follow-up call can be compared against this one without matching on prose.
 */
function describeReport(report: AtsReport, measuredLength: boolean): string {
  const flagged = bySeverity(report.checks).filter((c) => c.severity !== "pass");
  const lines: string[] = [
    `ATS score: ${report.score}/100 (${VERDICT_LINE[atsVerdict(report.score)]})`,
    `${report.counts.fail} failing, ${report.counts.warn} warnings, ${report.counts.pass} passing.`,
    "",
  ];

  if (flagged.length === 0) {
    lines.push("Nothing is flagged. Every mechanical check passes.");
  } else {
    for (const group of ["contact", "structure", "content", "formatting"] as AtsGroup[]) {
      const inGroup = flagged.filter((c) => c.group === group);
      if (inGroup.length === 0) continue;
      lines.push(`${ATS_GROUP_LABELS[group]}:`, ...inGroup.map(findingLine), "");
    }
  }

  lines.push(
    `Passing: ${report.checks
      .filter((c) => c.severity === "pass")
      .map((c) => c.id)
      .join(", ")}`,
    ""
  );

  // Being explicit about the edges of the check, so neither a clean report
  // nor a poor one gets read as more than it is.
  lines.push("What this check cannot see:");
  if (!measuredLength) {
    lines.push(
      "- Page count. Nothing renders here, so length is not checked. Open the link in a browser for that."
    );
  }
  lines.push(
    "- The job being applied for. Keyword coverage against a posting is judgement, not a rule, and is yours to make.",
    "- How any particular tracking system behaves. These are the ways parsers are known to fail, not one vendor's rules.",
    "",
    "Nothing here blocks anything. A low score is an opinion about one hiring pipeline."
  );

  return lines.join("\n");
}

server.registerTool(
  "check_resume",
  {
    title: "Check a résumé for ATS readiness",
    description:
      "Runs the same static check the opencv editor shows: contact fields, section structure, " +
      "dates, phrasing, columns and formatting. Returns a score out of 100 and a list of " +
      "findings with suggested fixes. Takes either a share link or a JSON Resume, so a draft " +
      "can be checked before create_resume mints a link for it. It reads the document only; " +
      "it knows nothing about the job being applied for.",
    inputSchema: {
      url: z
        .string()
        .optional()
        .describe("An opencv share link to check. Pass this or resume, not both."),
      resume: resumeArg
        .optional()
        .describe("A JSON Resume to check before it has a link. Pass this or url, not both."),
      layout: z
        .enum(LAYOUT_IDS)
        .optional()
        .describe(
          "Template to check against, when passing a resume rather than a url. " +
            "Column count is one of the checks, so this changes the result."
        ),
    },
  },
  async ({ url, resume, layout }) => {
    if (!url && !resume) {
      return failure("Pass either a share link (url) or a JSON Resume (resume) to check.");
    }
    if (url && resume) {
      return failure("Pass a url or a resume, not both; otherwise it is unclear which to check.");
    }

    let data: CVData;
    let checkedLayout: LayoutType;
    let label: string;

    if (url) {
      const result = await parseShareUrl(url);
      if ("error" in result) return failure(result.error);
      data = result.payload.data;
      // A link carries its own template, and the one in the link is the one
      // that will be read, so an argument would only be a way to get a
      // misleading answer.
      checkedLayout = result.payload.layout ?? "professional";
      label = `“${data.personalInfo.fullName || "Untitled"}”, ${checkedLayout} template`;
    } else {
      data = fromJsonResume(resume as never);
      checkedLayout = layout ?? "professional";
      label = `a draft résumé, checked against the ${checkedLayout} template`;
    }

    const report = runAtsChecks(data, { layout: checkedLayout });
    return text(`Checked ${label}.\n\n${describeReport(report, false)}`);
  }
);

/* ── Transport ────────────────────────────────────────────────────────────── */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the protocol channel, so anything diagnostic goes to stderr.
  console.error(`opencv MCP server ready; links will point at ${BASE_URL}`);
}

main().catch((err) => {
  console.error("opencv MCP server failed to start:", err);
  process.exit(1);
});
