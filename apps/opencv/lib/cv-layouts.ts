/**
 * The template catalogue, shared by the builder shell and the template
 * gallery page so both describe the same set from one place.
 */

export type LayoutType = "professional" | "modern" | "classic" | "minimal";

export interface LayoutMeta {
  id: LayoutType;
  name: string;
  tag: string;
  desc: string;
  /** Column model, which decides whether sections can be placed left/right. */
  columns: 1 | 2;
}

export const LAYOUTS: LayoutMeta[] = [
  { id: "professional", name: "Professional", tag: "popular",  columns: 2, desc: "Two-column with a tinted sidebar. The dependable choice for most roles." },
  { id: "modern",       name: "Modern",       tag: "bold",     columns: 2, desc: "Accent header band and confident type. Stands out in a stack." },
  { id: "classic",      name: "Classic",      tag: "timeless", columns: 1, desc: "Centered serif masthead. Formal, editorial, understated." },
  { id: "minimal",      name: "Minimal",      tag: "quiet",    columns: 1, desc: "Single column, hairline rules, maximum whitespace." },
];

export function layoutMeta(id: LayoutType): LayoutMeta {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export const LAYOUT_STORAGE_KEY = "cvBuilderLayout";
export const DATA_STORAGE_KEY = "cvBuilderData";
export const THEME_STORAGE_KEY = "cvBuilderTheme";
