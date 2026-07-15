"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CVData, CVTheme, ExperienceEntry } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";

Font.registerHyphenationCallback((word) => [word]);

// ── Page geometry ─────────────────────────────────────────────────────────────
// LETTER: 612 × 792 pt, margins 36pt top/bottom, 40pt sides
const PAD_H = 36;
const PAD_SIDE = 40;
const COL_GAP = 20;

// Approx header height (name + title + contacts + padding)
const HEADER_H = 90;

// ── Height estimation constants ───────────────────────────────────────────────
// Conservative (narrower than actual rendered width) so estimates are slightly
// tall, which biases the split to put FEWER entries on page 1 — matching the
// canvas page-break behaviour where break-inside:avoid pushes entries down.
const LEFT_CHARS = 38;  // chars per line estimate for left column
const LINE_H     = 16;  // pt per text line
const SEC_H      = 24;  // section heading + marginBottom
const SEC_M      = 14;  // section marginBottom
const ENTRY_M    = 10;  // entry marginBottom

// Budget for left-column content on page 1.
// Deliberately < (792 - 2*36 - HEADER_H = 630) to reproduce the canvas break.
const P1_BUDGET = 590;

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

interface Seg { text: string; bold: boolean; italic: boolean }

function parseInline(html: string): Seg[] {
  const segs: Seg[] = [];
  let cur: Seg = { text: "", bold: false, italic: false };
  const flush = () => {
    if (cur.text) { segs.push({ ...cur }); cur = { text: "", bold: cur.bold, italic: cur.italic }; }
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
    const tag = src.slice(i, gt + 1).toLowerCase().replace(/\s+/g, "");
    flush();
    if      (tag === "<strong>" || tag === "<b>")  cur.bold = true;
    else if (tag === "</strong>" || tag === "</b>") cur.bold = false;
    else if (tag === "<em>" || tag === "<i>")       cur.italic = true;
    else if (tag === "</em>" || tag === "</i>")     cur.italic = false;
    i = gt + 1;
  }
  flush();
  return segs;
}

function fontFor(bold: boolean, italic: boolean) {
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold)           return "Helvetica-Bold";
  if (italic)         return "Helvetica-Oblique";
  return "Helvetica";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichText({ html, style }: { html: string; style: any }) {
  const segs = parseInline(html);
  if (!segs.length) return null;
  if (segs.every(s => !s.bold && !s.italic)) {
    return <Text style={style}>{segs.map(s => s.text).join("")}</Text>;
  }
  return (
    <Text style={style}>
      {segs.map((s, i) => (
        <Text key={i} style={{ fontFamily: fontFor(s.bold, s.italic) }}>{s.text}</Text>
      ))}
    </Text>
  );
}

function fmtDate(s: string): string {
  if (!s) return "";
  if (s === "Present") return "Present";
  const [yr, mo] = s.split("-");
  if (!yr) return s;
  if (!mo) return yr;
  return new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
}

// ── Height estimation ─────────────────────────────────────────────────────────

function textLines(text: string): number {
  return Math.max(1, Math.ceil(text.length / LEFT_CHARS));
}

function estimateSummaryH(html: string): number {
  if (!html) return 0;
  return SEC_H + textLines(stripHtml(html)) * LINE_H + SEC_M;
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
  const muted   = "#6b7280";
  const faint   = "#9ca3af";

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica", fontSize: 10, color: body,
      backgroundColor: t.backgroundColor || "#ffffff",
      paddingTop: PAD_H, paddingBottom: PAD_H, paddingHorizontal: 0,
    },

    // ── Header
    header:     { paddingHorizontal: PAD_SIDE, paddingBottom: 14, marginBottom: 6 },
    name:       { fontFamily: "Helvetica-Bold", fontSize: 26, color: heading, marginBottom: 2 },
    jobTitle:   { fontFamily: "Helvetica-Bold", fontSize: 12,  color: primary, marginBottom: 6 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 2 },
    contactTxt: { fontSize: 8.5, color: muted },

    // ── Columns
    cols:  { flexDirection: "row", paddingHorizontal: PAD_SIDE, columnGap: COL_GAP },
    left:  { flex: 58 },
    right: { flex: 42 },

    // ── Section
    section: { marginBottom: SEC_M },
    secHead: {
      fontFamily: "Helvetica-Bold", fontSize: 8.5, color: heading,
      textTransform: "uppercase", letterSpacing: 1.0,
      borderBottomWidth: 1.5, borderBottomColor: primary,
      paddingBottom: 2, marginBottom: 7,
    },

    // ── Experience entry
    entry:        { marginBottom: ENTRY_M },
    entryTitle:   { fontFamily: "Helvetica-Bold", fontSize: 10,  color: heading },
    entryCompany: { fontFamily: "Helvetica-Bold", fontSize: 9,   color: primary, marginTop: 1 },
    entryMeta:    { flexDirection: "row", columnGap: 12, marginTop: 2, marginBottom: 4 },
    metaTxt:      { fontSize: 8, color: faint },

    bulletRow: { flexDirection: "row", marginBottom: 2.5 },
    bulletDot: { fontSize: 9, color: faint, marginRight: 5, width: 8 },
    bulletTxt: { fontSize: 9, color: body, flex: 1, lineHeight: 1.6 },

    summaryTxt: { fontSize: 9.5, color: body, lineHeight: 1.65 },

    // ── Skills
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    skillTag: {
      backgroundColor: "#f3f4f6", borderWidth: 0.5, borderColor: "#d1d5db",
      borderRadius: 3, paddingVertical: 3, paddingHorizontal: 6,
      fontSize: 7.5, color: body, margin: 2,
    },

    // ── Education entry (compact)
    eduEntry:    { marginBottom: 9 },
    eduDegree:   { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: heading },
    eduInst:     { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: primary, marginTop: 1 },

    // ── Achievement
    awardRow:   { flexDirection: "row", columnGap: 6, marginBottom: 8 },
    awardIcon:  { fontSize: 8, color: primary, marginTop: 1, width: 10 },
    awardTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: heading },
    awardDesc:  { fontSize: 7.5, color: muted, marginTop: 1, lineHeight: 1.4 },

    // ── Publication
    pubEntry: { marginBottom: 8 },
    pubTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: heading },
    pubMeta:  { fontSize: 8, color: muted, marginTop: 1 },
    pubLink:  { fontSize: 7.5, color: primary, marginTop: 2 },

    // ── Social
    socialEntry:    { marginBottom: 6 },
    socialPlatform: { fontFamily: "Helvetica-Bold", fontSize: 9, color: heading },
    socialUrl:      { fontSize: 8, color: muted },

    // ── Language
    langRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    langName: { fontFamily: "Helvetica-Bold", fontSize: 9, color: heading },
    langDots: { flexDirection: "row", columnGap: 3 },
    dot:      { width: 6, height: 6, borderRadius: 3 },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfessionalPDFDocument({ data, theme: tp }: { data: CVData; theme?: CVTheme }) {
  const t = tp ?? DEFAULT_THEME;
  const S = makeStyles(t);

  const contacts = [
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.website,
    data.personalInfo.location,
  ].filter(Boolean) as string[];

  const allExps = data.experience.filter(e => e.jobTitle || e.company);
  const skills  = data.skills.filter(s => s.name);
  const pubs    = (data.publications ?? []).filter(p => p.title);
  const links   = (data.socialLinks  ?? []).filter(l => l.platform);
  const langs   = data.languages ?? [];

  // ── Decide which experience entries go on page 1 ──────────────────────────
  const summaryH = estimateSummaryH(data.personalInfo.summary || "");
  const expHdrH  = allExps.length > 0 ? SEC_H : 0;
  let budget = P1_BUDGET - summaryH - expHdrH;

  const page1Exps: ExperienceEntry[] = [];
  const page2Exps: ExperienceEntry[] = [];
  for (const exp of allExps) {
    const h = estimateExpH(exp);
    if (budget >= h) { page1Exps.push(exp); budget -= h; }
    else              { page2Exps.push(exp); }
  }
  const hasPage2 = page2Exps.length > 0;

  // ── Reusable experience-entry block (inline, no inner component) ──────────
  const renderExp = (exp: ExperienceEntry) => (
    <View key={exp.id} style={S.entry} wrap={false}>
      <Text style={S.entryTitle}>{exp.jobTitle}</Text>
      <Text style={S.entryCompany}>{exp.company}</Text>
      <View style={S.entryMeta}>
        <Text style={S.metaTxt}>
          {fmtDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : fmtDate(exp.endDate)}
        </Text>
        {exp.location ? <Text style={S.metaTxt}>{exp.location}</Text> : null}
      </View>
      {exp.highlights.filter(Boolean).map((h, i) => (
        <View key={i} style={S.bulletRow}>
          <Text style={S.bulletDot}>·</Text>
          <RichText html={h} style={S.bulletTxt} />
        </View>
      ))}
    </View>
  );

  return (
    <Document>
      {/* ══════════ PAGE 1 ══════════ */}
      <Page size="LETTER" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.name}>{data.personalInfo.fullName}</Text>
          <Text style={S.jobTitle}>{data.personalInfo.jobTitle}</Text>
          <View style={S.contactRow}>
            {contacts.map((c, i) => <Text key={i} style={S.contactTxt}>{c}</Text>)}
          </View>
        </View>

        {/* Two-column body */}
        <View style={S.cols}>

          {/* ── Left: Summary + first batch of experience ── */}
          <View style={S.left}>
            {data.personalInfo.summary ? (
              <View style={S.section}>
                <Text style={S.secHead}>Summary</Text>
                <RichText html={data.personalInfo.summary} style={S.summaryTxt} />
              </View>
            ) : null}

            {page1Exps.length > 0 ? (
              <View style={S.section}>
                <Text style={S.secHead}>Experience</Text>
                {page1Exps.map(renderExp)}
              </View>
            ) : null}
          </View>

          {/* ── Right: Skills, Education, Key Achievements ── */}
          {/* When hasPage2: also add Publications header at the bottom,   */}
          {/* mirroring the canvas where the Pubs section header sits on   */}
          {/* page 1 right and the content flows to page 2.               */}
          <View style={S.right}>
            {skills.length > 0 ? (
              <View style={S.section}>
                <Text style={S.secHead}>Skills</Text>
                <View style={S.skillsWrap}>
                  {skills.map(s => (
                    <View key={s.id} style={S.skillTag}><Text>{s.name}</Text></View>
                  ))}
                </View>
              </View>
            ) : null}

            {data.education.length > 0 ? (
              <View style={S.section}>
                <Text style={S.secHead}>Education</Text>
                {data.education.map(edu => (
                  <View key={edu.id} style={S.eduEntry} wrap={false}>
                    <Text style={S.eduDegree}>{edu.degree}</Text>
                    <Text style={S.eduInst}>{edu.institution}</Text>
                    <Text style={S.metaTxt}>{fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data.awards.length > 0 ? (
              <View style={S.section}>
                <Text style={S.secHead}>Key Achievements</Text>
                {data.awards.map(a => (
                  <View key={a.id} style={S.awardRow} wrap={false}>
                    <Text style={S.awardIcon}>◆</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={S.awardTitle}>{a.title}</Text>
                      {a.description
                        ? <RichText html={a.description} style={S.awardDesc} />
                        : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* When page 2 exists: show Publications section header only on page 1
                (matching canvas behaviour) — content appears on page 2 right.
                When no page 2: show all right-column sections here. */}
            {hasPage2 ? (
              /* Publications header only */
              pubs.length > 0 ? (
                <View style={S.section}>
                  <Text style={S.secHead}>Publications</Text>
                </View>
              ) : null
            ) : (
              /* No page 2 — show everything */
              <>
                {pubs.length > 0 ? (
                  <View style={S.section}>
                    <Text style={S.secHead}>Publications</Text>
                    {pubs.map(pub => (
                      <View key={pub.id} style={S.pubEntry} wrap={false}>
                        <Text style={S.pubTitle}>{pub.title}</Text>
                        <Text style={S.pubMeta}>{[pub.publisher, pub.date].filter(Boolean).join(" · ")}</Text>
                        {pub.link ? <Link src={pub.link} style={S.pubLink}>{pub.link}</Link> : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {links.length > 0 ? (
                  <View style={S.section}>
                    <Text style={S.secHead}>Find Me Online</Text>
                    {links.map(l => (
                      <View key={l.id} style={S.socialEntry} wrap={false}>
                        <Text style={S.socialPlatform}>{l.platform}</Text>
                        <Text style={S.socialUrl}>{l.url}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {langs.length > 0 ? (
                  <View style={S.section}>
                    <Text style={S.secHead}>Languages</Text>
                    {langs.map(lang => (
                      <View key={lang.name} style={S.langRow} wrap={false}>
                        <Text style={S.langName}>{lang.name}</Text>
                        <View style={S.langDots}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <View key={i} style={[S.dot, { backgroundColor: i < lang.proficiency ? "#3b82f6" : "#e5e7eb" }]} />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Page>

      {/* ══════════ PAGE 2 (experience overflow + right-col remainder) ══════════ */}
      {hasPage2 ? (
        <Page size="LETTER" style={S.page}>
          <View style={S.cols}>

            {/* Left: remaining experience entries */}
            <View style={S.left}>
              <View style={S.section}>
                {page2Exps.map(renderExp)}
              </View>
            </View>

            {/* Right: Publications content + Find Me Online + Languages */}
            <View style={S.right}>
              {pubs.length > 0 ? (
                <View style={S.section}>
                  {pubs.map(pub => (
                    <View key={pub.id} style={S.pubEntry} wrap={false}>
                      <Text style={S.pubTitle}>{pub.title}</Text>
                      <Text style={S.pubMeta}>{[pub.publisher, pub.date].filter(Boolean).join(" · ")}</Text>
                      {pub.link ? <Link src={pub.link} style={S.pubLink}>{pub.link}</Link> : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {links.length > 0 ? (
                <View style={S.section}>
                  <Text style={S.secHead}>Find Me Online</Text>
                  {links.map(l => (
                    <View key={l.id} style={S.socialEntry} wrap={false}>
                      <Text style={S.socialPlatform}>{l.platform}</Text>
                      <Text style={S.socialUrl}>{l.url}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {langs.length > 0 ? (
                <View style={S.section}>
                  <Text style={S.secHead}>Languages</Text>
                  {langs.map(lang => (
                    <View key={lang.name} style={S.langRow} wrap={false}>
                      <Text style={S.langName}>{lang.name}</Text>
                      <View style={S.langDots}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <View key={i} style={[S.dot, { backgroundColor: i < lang.proficiency ? "#3b82f6" : "#e5e7eb" }]} />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </Page>
      ) : null}
    </Document>
  );
}
