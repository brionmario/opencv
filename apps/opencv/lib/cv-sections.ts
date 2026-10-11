import type { CVData, SectionMeta } from "./cv-builder-types";
import { BUILT_IN_SECTION_IDS, DEFAULT_SECTION_ORDER } from "./cv-builder-types";

const BUILT_IN_SET = new Set<string>(BUILT_IN_SECTION_IDS);

/**
 * Normalizes a CVData's section order into a complete, valid list:
 * - Drops entries referencing a custom section that no longer exists.
 * - Appends any built-in section missing from the saved order (new section
 *   types introduced after a CV was created, or legacy data saved before
 *   sectionOrder existed at all).
 * - Appends any custom section missing from the saved order (defensive;
 *   the hook keeps these in sync, but data can also arrive from restored
 *   versions or hand-edited JSON).
 *
 * Every template and exporter reads section order through this function
 * rather than `data.sectionOrder` directly, so no caller needs its own
 * migration/fallback logic.
 */
export function getEffectiveSectionOrder(data: CVData): SectionMeta[] {
  const existing = data.sectionOrder ?? [];
  const customIds = new Set((data.customSections ?? []).map((s) => s.id));

  const cleaned = existing.filter((s) => BUILT_IN_SET.has(s.id) || customIds.has(s.id));
  const seen = new Set(cleaned.map((s) => s.id));

  for (const def of DEFAULT_SECTION_ORDER) {
    if (!seen.has(def.id)) {
      cleaned.push(def);
      seen.add(def.id);
    }
  }
  for (const id of customIds) {
    if (!seen.has(id)) {
      cleaned.push({ id, column: "left" });
      seen.add(id);
    }
  }
  return cleaned;
}

/** Visible sections in order, restricted to one column (for two-column templates). */
export function sectionsForColumn(data: CVData, column: "left" | "right"): SectionMeta[] {
  return getEffectiveSectionOrder(data).filter((s) => !s.hidden && s.column === column);
}

/** Visible sections in order, ignoring column (for single-column templates). */
export function sectionsFlat(data: CVData): SectionMeta[] {
  return getEffectiveSectionOrder(data).filter((s) => !s.hidden);
}

/**
 * How many entries a section holds, or null for sections that are a single
 * block of text rather than a list.
 *
 * The canvas, the Properties panel and the delete confirmation all need this,
 * and the exporters decide whether to draw a section at all from the same
 * underlying emptiness — so it lives here rather than being re-derived.
 */
export function sectionItemCount(data: CVData, id: string): number | null {
  switch (id) {
    case "summary":      return null;
    case "experience":   return data.experience.length;
    case "education":    return data.education.length;
    case "skills":       return data.skills.length;
    case "awards":       return data.awards.length;
    case "publications": return (data.publications ?? []).length;
    case "references":   return (data.references ?? []).length;
    case "socialLinks":  return (data.socialLinks ?? []).length;
    case "languages":    return (data.languages ?? []).length;
    default:
      return data.customSections.find((s) => s.id === id)?.items.length ?? null;
  }
}

/**
 * Sections that are on the page but would render nothing.
 *
 * The exporters omit an empty section entirely while the canvas still draws
 * its heading and add-button, so the canvas has to say which headings are not
 * going to print — otherwise "what you see is what prints" quietly is not true.
 */
export function emptySectionIds(data: CVData): Set<string> {
  const empty = new Set<string>();
  for (const s of getEffectiveSectionOrder(data)) {
    if (s.hidden) continue;
    if (s.id === "summary") {
      if (!data.personalInfo.summary?.trim()) empty.add(s.id);
      continue;
    }
    const n = sectionItemCount(data, s.id);
    if (n === 0) empty.add(s.id);
  }
  return empty;
}
