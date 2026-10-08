"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Link,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
  Rect,
  Line,
} from "@react-pdf/renderer";
import type { CVData, CVTheme, ExperienceEntry, CustomSection } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import { iconSvgStrings, resolveSocialLinkIcon, type IconName } from "@/lib/icons";
import { sectionsForColumn, getEffectiveSectionOrder } from "@/lib/cv-sections";

Font.registerHyphenationCallback((word) => [word]);

// Embed the same Inter the canvas renders with, so line wrapping and column
// heights in the PDF match the editor (Helvetica is narrower and desyncs
// the WYSIWYG page split). Registered lazily — this module is only imported
// client-side by the export handler.
if (typeof window !== "undefined") {
  Font.register({
    family: "Inter",
    fonts: [
      { src: "/fonts/inter-regular.ttf", fontWeight: 400 },
      { src: "/fonts/inter-italic.ttf", fontWeight: 400, fontStyle: "italic" },
      { src: "/fonts/inter-semibold.ttf", fontWeight: 600 },
      { src: "/fonts/inter-bold.ttf", fontWeight: 700 },
    ],
  });
}

// ── Icons ─────────────────────────────────────────────────────────────────────
// Renders the exact same SVG paths the canvas uses (lib/icons.tsx) via
// react-pdf primitives, so the export stays WYSIWYG with the editor.

function parseSvgAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z0-9-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}

function PdfIcon({ name, size, color }: { name: IconName; size: number; color: string }) {
  const svg = iconSvgStrings[name];
  if (!svg) return null;
  const root = parseSvgAttrs(svg.slice(0, svg.indexOf(">") + 1));
  const filled = root.fill === "currentColor";
  const paint = filled
    ? { fill: color }
    : { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const children: React.ReactNode[] = [];
  const elRe = /<(path|circle|rect|line)\b[^>]*\/?>/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = elRe.exec(svg))) {
    const a = parseSvgAttrs(m[0]);
    const key = i++;
    if (m[1] === "path") children.push(<Path key={key} d={a.d} {...paint} />);
    else if (m[1] === "circle") children.push(<Circle key={key} cx={a.cx} cy={a.cy} r={a.r} {...paint} />);
    else if (m[1] === "rect") children.push(<Rect key={key} x={a.x ?? "0"} y={a.y ?? "0"} width={a.width} height={a.height} rx={a.rx} ry={a.ry} {...paint} />);
    else if (m[1] === "line") children.push(<Line key={key} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} {...paint} />);
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {children}
    </Svg>
  );
}

// ── Page geometry ─────────────────────────────────────────────────────────────
// A4: 595.28 × 841.89 pt, margins 27pt top/bottom, 30pt sides
// (matches the canvas templates and HTML export, which render at 210×297mm
// with 36px/40px padding — pt = px × 0.75)
const PAD_H = 27;
const PAD_SIDE = 30;
const COL_GAP = 21;

// Approx header height (name + title + contacts + padding)
const HEADER_H = 80;

// ── Height estimation constants ───────────────────────────────────────────────
// Conservative (narrower than actual rendered width) so estimates are slightly
// tall, which biases the split to put FEWER entries on page 1 — matching the
// canvas page-break behaviour where break-inside:avoid pushes entries down.
const LEFT_CHARS = 56;  // chars per line estimate for left column
const LINE_H     = 12;  // pt per text line
const SEC_H      = 20;  // section heading + marginBottom
const SEC_M      = 13.5;  // section marginBottom (canvas space-y = 18px)
const ENTRY_M    = 10;  // entry marginBottom

// Budget for left-column content on page 1.
// Deliberately < (841.89 - 2*27 - HEADER_H ≈ 708) to reproduce the canvas break.
const P1_BUDGET = 690;

// ── HTML helpers ──────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

interface Seg { text: string; bold: boolean; italic: boolean; href?: string }

function parseInline(html: string): Seg[] {
  const segs: Seg[] = [];
  let cur: Seg = { text: "", bold: false, italic: false, href: undefined };
  const flush = () => {
    if (cur.text) { segs.push({ ...cur }); cur = { text: "", bold: cur.bold, italic: cur.italic, href: cur.href }; }
  };
  const src = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  let i = 0;
  while (i < src.length) {
    if (src[i] !== "<") {
      if (src[i] === "&") {
        const sc = src.indexOf(";", i);
        if (sc > i && sc - i <= 7) {
          const e = src.slice(i, sc + 1);
          const m: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
          cur.text += m[e] ?? e; i = sc + 1; continue;
        }
      }
      cur.text += src[i++]; continue;
    }
    const gt = src.indexOf(">", i);
    if (gt === -1) { cur.text += src[i++]; continue; }
    const rawTag = src.slice(i, gt + 1);
    const tag = rawTag.toLowerCase().replace(/\s+/g, "");
    flush();
    if      (tag === "<strong>" || tag === "<b>")  cur.bold = true;
    else if (tag === "</strong>" || tag === "</b>") cur.bold = false;
    else if (tag === "<em>" || tag === "<i>")       cur.italic = true;
    else if (tag === "</em>" || tag === "</i>")     cur.italic = false;
    else if (/^<a[\s>]/i.test(rawTag)) {
      const hrefMatch = rawTag.match(/href\s*=\s*"([^"]*)"/i) ?? rawTag.match(/href\s*=\s*'([^']*)'/i);
      cur.href = hrefMatch ? hrefMatch[1] : undefined;
    }
    else if (tag === "</a>") cur.href = undefined;
    i = gt + 1;
  }
  flush();
  return segs;
}

function fontFor(bold: boolean, italic: boolean) {
  return {
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? ("italic" as const) : ("normal" as const),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichText({ html, style }: { html: string; style: any }) {
  const segs = parseInline(html);
  if (!segs.length) return null;
  if (segs.every(s => !s.bold && !s.italic && !s.href)) {
    return <Text style={style}>{segs.map(s => s.text).join("")}</Text>;
  }
  // The canvas leaves anchors unstyled (Tailwind preflight makes them inherit
  // colour and decoration), so neutralise react-pdf's blue/underlined <Link>
  // default and inherit the surrounding text colour instead — the link stays
  // clickable, it just stops looking different from the export's siblings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flat: any = Array.isArray(style) ? Object.assign({}, ...style) : style;
  const linkBase = { color: flat?.color, textDecoration: "none" as const };
  return (
    <Text style={style}>
      {segs.map((s, i) =>
        s.href ? (
          <Link key={i} src={s.href} style={[linkBase, fontFor(s.bold, s.italic)]}>{s.text}</Link>
        ) : (
          <Text key={i} style={fontFor(s.bold, s.italic)}>{s.text}</Text>
        )
      )}
    </Text>
  );
}

/** react-pdf fetches image sources itself, so a cross-origin URL without a
 *  CORS header fails silently and leaves an empty ring on the page. Uploads
 *  are data: URLs and the bundled default is same-origin, so only a
 *  hand-entered remote URL hits this — drop the photo rather than print a
 *  hollow circle. */
function isEmbeddableImage(src: string | undefined): boolean {
  if (!src) return false;
  if (/^(https?:)?\/\//i.test(src)) {
    // Same-origin absolute URLs are fine; anything else we cannot read.
    return typeof window !== "undefined" && src.startsWith(window.location.origin);
  }
  return true; // data: URL, or a root-relative path served by the app
}

function fmtDate(s: string): string {
  if (!s) return "";
  if (s === "Present") return "Present";
  const [yr, mo] = s.split("-");
  if (!yr) return s;
  if (!mo) return yr;
  return new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
}

function fmtDateRange(start: string, end: string): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

// ── Height estimation ─────────────────────────────────────────────────────────

function textLines(text: string): number {
  return Math.max(1, Math.ceil(text.length / LEFT_CHARS));
}

function estimateSummaryH(html: string): number {
  if (!html) return 0;
  return SEC_H + textLines(stripHtml(html)) * LINE_H + SEC_M;
}

function estimateEduH(count: number): number {
  if (!count) return 0;
  // degree + institution + meta ≈ 3 lines, plus entry margin
  return SEC_H + count * (3 * LINE_H + 8) + SEC_M;
}

function estimateExpH(exp: ExperienceEntry): number {
  const base = 12 + 10 + 11; // entryTitle + entryCompany + metaRow
  const bulletsH = exp.highlights.filter(Boolean).reduce((s, h) => {
    return s + textLines(stripHtml(h)) * LINE_H;
  }, 0);
  return base + bulletsH + ENTRY_M;
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(t: CVTheme) {
  const primary = t.primaryColor || "#db2777";
  const heading = t.headingColor || "#111827";
  const body    = t.bodyColor    || "#374151";
  const muted   = "#6b7280";  // gray-500 — canvas meta/secondary text
  const soft    = "#4b5563";  // gray-600 — canvas descriptions
  const faint   = "#9ca3af";  // gray-400 — canvas meta icons only

  return StyleSheet.create({
    page: {
      fontFamily: "Inter", fontSize: 8.25, color: body,
      backgroundColor: t.backgroundColor || "#ffffff",
      paddingTop: PAD_H, paddingBottom: PAD_H, paddingHorizontal: 0,
    },

    // ── Header
    header:     { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: PAD_SIDE, paddingBottom: 12, marginBottom: 6 },
    headerText: { flex: 1 },
    // 80px avatar on the canvas → 60pt here (pt = px × 0.75)
    avatar: {
      width: 60, height: 60, borderRadius: 30, objectFit: "cover",
      marginLeft: 15, borderWidth: 1.5, borderColor: "#e5e7eb",
    },
    name:       { fontWeight: 700, fontSize: 22.5, color: heading, marginBottom: 2 },
    jobTitle:   { fontWeight: 600, fontSize: 11.25, color: primary, marginBottom: 6 },
    contactRow:  { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 2 },
    contactItem: { flexDirection: "row", alignItems: "center", columnGap: 3 },
    contactTxt:  { fontSize: 8.25, color: muted },

    // ── Columns
    cols:  { flexDirection: "row", paddingHorizontal: PAD_SIDE, columnGap: COL_GAP },
    left:  { flex: 58 },
    right: { flex: 42 },

    // ── Section
    section: { marginBottom: SEC_M },
    secHead: {
      fontWeight: 700, fontSize: 9.75, color: heading,
      textTransform: "uppercase", letterSpacing: 0.8,
      borderBottomWidth: 1.5, borderBottomColor: primary,
      paddingBottom: 3, marginBottom: 12,
    },

    // ── Experience entry
    entry:        { marginBottom: ENTRY_M },
    entryTitle:   { fontWeight: 700, fontSize: 8.25, color: heading },
    entryCompany: { fontWeight: 600, fontSize: 8.25, color: primary, marginTop: 1 },
    entryMeta:    { flexDirection: "row", columnGap: 9, marginTop: 2, marginBottom: 3 },
    metaItem:     { flexDirection: "row", alignItems: "center", columnGap: 2.5 },
    metaTxt:      { fontSize: 7.5, color: muted },

    bulletRow: { flexDirection: "row", marginBottom: 2 },
    bulletDot: { fontSize: 8, color: faint, marginRight: 4, width: 7 },
    bulletTxt: { fontSize: 8, color: body, flex: 1, lineHeight: 1.5 },

    summaryTxt: { fontSize: 8.25, color: body, lineHeight: 1.6 },

    // ── Skills
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    skillTag: {
      backgroundColor: "#f3f4f6", borderWidth: 0.5, borderColor: "#d1d5db",
      borderRadius: 3, paddingVertical: 2.25, paddingHorizontal: 6,
      fontSize: 7.5, color: body, margin: 2,
    },

    // ── Education entry (compact)
    eduEntry:    { marginBottom: 9 },
    eduDegree:   { fontWeight: 700, fontSize: 8.25, color: heading },
    eduInst:     { fontWeight: 600, fontSize: 8.25, color: primary, marginTop: 1 },

    // ── Achievement
    awardRow:   { flexDirection: "row", columnGap: 5, marginBottom: 9 },
    awardIcon:  { width: 11, marginTop: 0.5 },
    awardTitle: { fontWeight: 700, fontSize: 8.25, color: heading },
    awardDesc:  { fontSize: 7.5, color: soft, marginTop: 1, lineHeight: 1.4 },

    // ── Publication
    pubEntry:  { flexDirection: "row", columnGap: 5, marginBottom: 9 },
    pubIcon:   { width: 11, marginTop: 0.5 },
    pubTitle:  { fontWeight: 700, fontSize: 8.25, color: heading, textDecoration: "none" },
    pubMeta:   { fontSize: 7.5, color: soft, marginTop: 1 },

    // ── Reference
    refEntry:    { marginBottom: 9 },
    refName:     { fontWeight: 700, fontSize: 8.25, color: heading },
    refTitle:    { fontWeight: 600, fontSize: 8.25, color: primary, marginTop: 1 },
    refCompany:  { fontSize: 7.5, color: soft, marginTop: 1 },
    refContactRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 9, rowGap: 2, marginTop: 2 },
    refContactItem: { flexDirection: "row", alignItems: "center", columnGap: 2.5 },
    refContactTxt: { fontSize: 7.5, color: muted },

    // ── Social
    socialEntry:    { flexDirection: "row", alignItems: "center", columnGap: 6, marginBottom: 6 },
    socialPlatform: { fontWeight: 700, fontSize: 7.5, color: heading },
    socialUrl:      { fontSize: 7.5, color: muted },

    // ── Language
    langRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    langName:  { fontWeight: 700, fontSize: 8.25, color: heading },
    langLabel: { fontSize: 7.5, color: muted, marginTop: 1 },
    langDots: { flexDirection: "row", columnGap: 3 },
    dot:      { width: 6, height: 6, borderRadius: 3 },

    // ── Custom section entry
    customEntry:    { marginBottom: 9 },
    customTitle:    { fontWeight: 700, fontSize: 8.25, color: heading },
    customSubtitle: { fontWeight: 600, fontSize: 8.25, color: primary, marginTop: 1 },
    customMeta:     { fontSize: 7.5, color: muted, marginTop: 1 },
    customDesc:     { fontSize: 7.5, color: soft, marginTop: 2, lineHeight: 1.4 },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfessionalPDFDocument({
  data,
  theme: tp,
  page2ExpIds,
}: {
  data: CVData;
  theme?: CVTheme;
  /** Experience ids the canvas rendered past the page-1 boundary. When
   *  provided the PDF mirrors that split exactly instead of estimating. */
  page2ExpIds?: string[];
}) {
  const t = tp ?? DEFAULT_THEME;
  const S = makeStyles(t);
  const primary = t.primaryColor || "#db2777";

  const contacts = (
    [
      ["phone", data.personalInfo.phone],
      ["email", data.personalInfo.email],
      ["link", data.personalInfo.website],
      ["location", data.personalInfo.location],
    ] as [IconName, string | undefined][]
  ).filter(([, v]) => Boolean(v)) as [IconName, string][];

  const allExps  = data.experience.filter(e => e.jobTitle || e.company);
  const edus     = data.education.filter(e => e.degree || e.institution);
  const skills   = data.skills.filter(s => s.name);
  const awards   = data.awards.filter(a => a.title);
  const pubs     = (data.publications ?? []).filter(p => p.title);
  const refs     = (data.references  ?? []).filter(r => r.name);
  const links    = (data.socialLinks  ?? []).filter(l => l.platform || l.url);
  const allLangs = (data.languages ?? []).filter(l => l.name);
  const p2Ids    = new Set(page2ExpIds ?? []);
  const langs      = allLangs.filter(l => !p2Ids.has(`lang-${l.name}`));
  const page2Langs = allLangs.filter(l => p2Ids.has(`lang-${l.name}`));

  // ── Decide which experience entries go on page 1 ──────────────────────────
  const page1Exps: ExperienceEntry[] = [];
  const page2Exps: ExperienceEntry[] = [];
  if (page2ExpIds) {
    // Exact split measured from the rendered canvas
    for (const exp of allExps) (p2Ids.has(exp.id) ? page2Exps : page1Exps).push(exp);
  } else {
    // Fallback: estimate heights when no canvas measurement is available
    const summaryH = estimateSummaryH(data.personalInfo.summary || "");
    const eduH     = estimateEduH(edus.length);
    const expHdrH  = allExps.length > 0 ? SEC_H : 0;
    let budget = P1_BUDGET - summaryH - eduH - expHdrH;
    for (const exp of allExps) {
      const h = estimateExpH(exp);
      if (budget >= h) { page1Exps.push(exp); budget -= h; }
      else              { page2Exps.push(exp); }
    }
  }
  const hasPage2 = page2Exps.length > 0 || page2Langs.length > 0;

  // ── Reusable experience-entry block (inline, no inner component) ──────────
  const renderExp = (exp: ExperienceEntry) => (
    <View key={exp.id} style={S.entry} wrap={false}>
      <Text style={S.entryTitle}>{exp.jobTitle}</Text>
      <Text style={S.entryCompany}>{exp.company}</Text>
      <View style={S.entryMeta}>
        <View style={S.metaItem}>
          <PdfIcon name="calendar" size={7.5} color="#9ca3af" />
          <Text style={S.metaTxt}>
            {fmtDateRange(exp.startDate, exp.currentlyWorking ? "Present" : exp.endDate)}
          </Text>
        </View>
        {exp.location ? (
          <View style={S.metaItem}>
            <PdfIcon name="location" size={7.5} color="#9ca3af" />
            <Text style={S.metaTxt}>{exp.location}</Text>
          </View>
        ) : null}
      </View>
      {exp.highlights.filter(Boolean).map((h, i) => (
        <View key={i} style={S.bulletRow}>
          <Text style={S.bulletDot}>•</Text>
          <RichText html={h} style={S.bulletTxt} />
        </View>
      ))}
    </View>
  );

  const renderLangs = (list: typeof allLangs) => (
    <View key="languages" style={S.section} wrap={false}>
      <Text style={S.secHead}>Languages</Text>
      {list.map(lang => (
        <View key={lang.name} style={S.langRow} wrap={false}>
          <View>
            <Text style={S.langName}>{lang.name}</Text>
            <Text style={S.langLabel}>
              {["Beginner", "Elementary", "Intermediate", "Proficient", "Fluent"][lang.proficiency - 1]}
            </Text>
          </View>
          <View style={S.langDots}>
            {Array.from({ length: 5 }, (_, i) => (
              <View key={i} style={[S.dot, { backgroundColor: i < lang.proficiency ? primary : "#e5e7eb" }]} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderCustomSection = (section: CustomSection) => (
    <View key={section.id} style={S.section} wrap={false}>
      <Text style={S.secHead}>{section.title}</Text>
      {section.items.map(item => (
        <View key={item.id} style={S.customEntry} wrap={false}>
          <Text style={S.customTitle}>{item.title}</Text>
          {item.subtitle ? <Text style={S.customSubtitle}>{item.subtitle}</Text> : null}
          {item.meta ? <Text style={S.customMeta}>{item.meta}</Text> : null}
          {item.description ? <RichText html={item.description} style={S.customDesc} /> : null}
        </View>
      ))}
    </View>
  );

  // ── Section registry — mirrors the canvas: order/visibility/column come
  // from sectionOrder; this only knows how to draw each section. Overflow to
  // page 2 remains scoped to experience + languages (the only sections the
  // canvas tags with per-item ids for measurement) — other sections are
  // assumed to fit page 1, matching the app's existing pagination model. ──
  const builtInBlocks: Record<string, React.ReactNode> = {
    summary: data.personalInfo.summary ? (
      <View key="summary" style={S.section} wrap={false}>
        <Text style={S.secHead}>Summary</Text>
        <RichText html={data.personalInfo.summary} style={S.summaryTxt} />
      </View>
    ) : null,

    education: edus.length > 0 ? (
      <View key="education" style={S.section} wrap={false}>
        <Text style={S.secHead}>Education</Text>
        {edus.map(edu => (
          <View key={edu.id} style={S.eduEntry} wrap={false}>
            <Text style={S.eduDegree}>{edu.degree}</Text>
            <Text style={S.eduInst}>{edu.institution}</Text>
            <View style={[S.metaItem, { marginTop: 2 }]}>
              <PdfIcon name="calendar" size={7.5} color="#9ca3af" />
              <Text style={S.metaTxt}>{fmtDateRange(edu.startDate, edu.endDate)}</Text>
            </View>
            {edu.gpa ? (
              <View style={[S.metaItem, { marginTop: 2 }]}>
                <PdfIcon name="award" size={7.5} color="#9ca3af" />
                <Text style={S.metaTxt}>{edu.gpa}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    ) : null,

    experience: page1Exps.length > 0 ? (
      <View key="experience" style={S.section} wrap={false}>
        <Text style={S.secHead}>Experience</Text>
        {page1Exps.map(renderExp)}
      </View>
    ) : null,

    skills: skills.length > 0 ? (
      <View key="skills" style={S.section} wrap={false}>
        <Text style={S.secHead}>Skills</Text>
        <View style={S.skillsWrap}>
          {skills.map(s => (
            <View key={s.id} style={S.skillTag}><Text>{s.name}</Text></View>
          ))}
        </View>
      </View>
    ) : null,

    awards: awards.length > 0 ? (
      <View key="awards" style={S.section} wrap={false}>
        <Text style={S.secHead}>Key Achievements</Text>
        {awards.map(a => (
          <View key={a.id} style={S.awardRow} wrap={false}>
            <View style={S.awardIcon}>
              <PdfIcon name="award" size={10} color={primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.awardTitle}>{a.title}</Text>
              {a.description ? <RichText html={a.description} style={S.awardDesc} /> : null}
            </View>
          </View>
        ))}
      </View>
    ) : null,

    publications: pubs.length > 0 ? (
      <View key="publications" style={S.section} wrap={false}>
        <Text style={S.secHead}>Publications</Text>
        {pubs.map(pub => (
          <View key={pub.id} style={S.pubEntry} wrap={false}>
            <View style={S.pubIcon}>
              <PdfIcon name="link" size={10} color={primary} />
            </View>
            <View style={{ flex: 1 }}>
              <RichText
                html={pub.link && !/<a[\s>]/i.test(pub.title) ? `<a href="${pub.link}">${pub.title}</a>` : pub.title}
                style={S.pubTitle}
              />
              <Text style={S.pubMeta}>{[pub.publisher, pub.date].filter(Boolean).join(" • ")}</Text>
            </View>
          </View>
        ))}
      </View>
    ) : null,

    references: refs.length > 0 ? (
      <View key="references" style={S.section} wrap={false}>
        <Text style={S.secHead}>References</Text>
        {refs.map(ref => (
          <View key={ref.id} style={S.refEntry} wrap={false}>
            <Text style={S.refName}>{ref.name}</Text>
            {ref.title ? <Text style={S.refTitle}>{ref.title}</Text> : null}
            {ref.company ? <Text style={S.refCompany}>{ref.company}</Text> : null}
            {ref.phone || ref.email ? (
              <View style={S.refContactRow}>
                {ref.phone ? (
                  <View style={S.refContactItem}>
                    <PdfIcon name="phone" size={7.5} color="#9ca3af" />
                    <Text style={S.refContactTxt}>{ref.phone}</Text>
                  </View>
                ) : null}
                {ref.email ? (
                  <View style={S.refContactItem}>
                    <PdfIcon name="email" size={7.5} color="#9ca3af" />
                    <Text style={S.refContactTxt}>{ref.email}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    ) : null,

    socialLinks: links.length > 0 ? (
      <View key="socialLinks" style={S.section} wrap={false}>
        <Text style={S.secHead}>Find Me Online</Text>
        {links.map(l => {
          const resolved = resolveSocialLinkIcon(l.icon, l.platform);
          return (
            <View key={l.id} style={S.socialEntry} wrap={false}>
              <PdfIcon
                name={resolved.type === "icon" ? resolved.name : "globe"}
                size={11}
                color="#4b5563"
              />
              <View>
                <Text style={S.socialPlatform}>{l.platform}</Text>
                <Text style={S.socialUrl}>{l.url}</Text>
              </View>
            </View>
          );
        })}
      </View>
    ) : null,

    languages: langs.length > 0 ? renderLangs(langs) : null,
  };

  const customBlocks: Record<string, React.ReactNode> = {};
  (data.customSections ?? []).forEach((cs) => { customBlocks[cs.id] = renderCustomSection(cs); });

  const renderBlock = (id: string): React.ReactNode => builtInBlocks[id] ?? customBlocks[id] ?? null;

  // builtInBlocks.experience/.languages already render only the page-1 slice
  // (page1Exps/langs) — the overflow (page2Exps/page2Langs) renders on page 2
  // below, in whichever column experience/languages are actually assigned to.
  const leftSections = sectionsForColumn(data, "left");
  const rightSections = sectionsForColumn(data, "right");

  const orderMeta = getEffectiveSectionOrder(data);
  const expColumn = orderMeta.find((s) => s.id === "experience")?.column ?? "left";
  const langColumn = orderMeta.find((s) => s.id === "languages")?.column ?? "right";

  return (
    <Document>
      {/* ══════════ PAGE 1 ══════════ */}
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View style={S.headerText}>
            <Text style={S.name}>{data.personalInfo.fullName}</Text>
            <Text style={S.jobTitle}>{data.personalInfo.jobTitle}</Text>
            <View style={S.contactRow}>
              {contacts.map(([icon, c], i) => (
                <View key={i} style={S.contactItem}>
                  <PdfIcon name={icon} size={9} color={primary} />
                  <Text style={S.contactTxt}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
          {isEmbeddableImage(data.personalInfo.avatar) ? (
            <Image style={S.avatar} src={data.personalInfo.avatar as string} />
          ) : null}
        </View>

        {/* Two-column body */}
        <View style={S.cols}>

          {/* ── Left / Right — driven by sectionOrder, same as the canvas ── */}
          <View style={S.left}>
            {leftSections.map((s) => renderBlock(s.id))}
          </View>
          <View style={S.right}>
            {rightSections.map((s) => renderBlock(s.id))}
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 2 (canvas overflow, mirroring the measured split) ══════════ */}
      {hasPage2 ? (
        <Page size="A4" style={S.page}>
          <View style={S.cols}>
            <View style={S.left}>
              {expColumn === "left" && page2Exps.length > 0 ? (
                <View style={S.section}>{page2Exps.map(renderExp)}</View>
              ) : null}
              {langColumn === "left" && page2Langs.length > 0 ? renderLangs(page2Langs) : null}
            </View>
            <View style={S.right}>
              {expColumn === "right" && page2Exps.length > 0 ? (
                <View style={S.section}>{page2Exps.map(renderExp)}</View>
              ) : null}
              {langColumn === "right" && page2Langs.length > 0 ? renderLangs(page2Langs) : null}
            </View>
          </View>
        </Page>
      ) : null}
    </Document>
  );
}
