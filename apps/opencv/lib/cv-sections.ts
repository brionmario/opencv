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
 *   the hook keeps these in sync, but data can also arrive via LinkedIn
 *   import, restored versions, or hand-edited JSON).
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
