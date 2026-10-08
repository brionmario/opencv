"use client";

import type { CVData, CVTheme } from "./cv-builder-types";
import { DEFAULT_THEME } from "./cv-builder-types";
import {
  LAYOUT_STORAGE_KEY,
  DATA_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type LayoutType,
} from "./cv-layouts";

/**
 * Multiple résumés.
 *
 * The editor was built around a single document held in three localStorage
 * keys (data, theme, layout). Rather than rewrite that, those keys stay as the
 * *open document buffer* — the editor reads and writes them exactly as before
 * — and this module owns the library of documents around it: it opens a
 * document into the buffer, and mirrors edits back out of it.
 *
 * That keeps the editor unaware of the library, so there is one place to
 * reason about when documents are created, renamed or deleted.
 */

export interface CVDocument {
  id: string;
  name: string;
  layout: LayoutType;
  theme: CVTheme;
  data: CVData;
  createdAt: number;
  updatedAt: number;
  /** Set when the user deletes it; kept so "Deleted" can restore. */
  deletedAt?: number;
}

const DOCS_KEY = "cvDocuments";
const ACTIVE_KEY = "cvActiveDocument";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or a privacy mode that blocks storage: the in-memory state is
    // still correct for this session, so there is nothing useful to do here.
  }
}

export function newId(): string {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Documents the user can see, newest edit first. */
export function listDocuments(includeDeleted = false): CVDocument[] {
  const all = read<CVDocument[]>(DOCS_KEY, []);
  return all
    .filter((d) => (includeDeleted ? true : !d.deletedAt))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deletedDocuments(): CVDocument[] {
  return read<CVDocument[]>(DOCS_KEY, [])
    .filter((d) => d.deletedAt)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
}

export function getDocument(id: string): CVDocument | undefined {
  return read<CVDocument[]>(DOCS_KEY, []).find((d) => d.id === id);
}

function putAll(docs: CVDocument[]) {
  write(DOCS_KEY, docs);
}

export function upsertDocument(doc: CVDocument) {
  const all = read<CVDocument[]>(DOCS_KEY, []);
  const i = all.findIndex((d) => d.id === doc.id);
  if (i === -1) all.push(doc);
  else all[i] = doc;
  putAll(all);
}

export function renameDocument(id: string, name: string) {
  const all = read<CVDocument[]>(DOCS_KEY, []);
  const doc = all.find((d) => d.id === id);
  if (!doc) return;
  doc.name = name.trim() || "Untitled résumé";
  doc.updatedAt = Date.now();
  putAll(all);
}

/** Soft delete, so the dashboard can offer a restore rather than losing work. */
export function deleteDocument(id: string) {
  const all = read<CVDocument[]>(DOCS_KEY, []);
  const doc = all.find((d) => d.id === id);
  if (!doc) return;
  doc.deletedAt = Date.now();
  putAll(all);
  if (activeDocumentId() === id) setActiveDocumentId(null);
}

export function restoreDocument(id: string) {
  const all = read<CVDocument[]>(DOCS_KEY, []);
  const doc = all.find((d) => d.id === id);
  if (!doc) return;
  delete doc.deletedAt;
  doc.updatedAt = Date.now();
  putAll(all);
}

export function purgeDocument(id: string) {
  putAll(read<CVDocument[]>(DOCS_KEY, []).filter((d) => d.id !== id));
}

export function duplicateDocument(id: string): CVDocument | undefined {
  const src = getDocument(id);
  if (!src) return undefined;
  const now = Date.now();
  const copy: CVDocument = {
    ...src,
    id: newId(),
    name: `${src.name} copy`,
    createdAt: now,
    updatedAt: now,
    deletedAt: undefined,
  };
  upsertDocument(copy);
  return copy;
}

export function activeDocumentId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveDocumentId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

export function createDocument(opts: {
  name?: string;
  layout: LayoutType;
  data: CVData;
  theme?: CVTheme;
}): CVDocument {
  const now = Date.now();
  const doc: CVDocument = {
    id: newId(),
    name: opts.name?.trim() || "Untitled résumé",
    layout: opts.layout,
    theme: opts.theme ?? DEFAULT_THEME,
    data: opts.data,
    createdAt: now,
    updatedAt: now,
  };
  upsertDocument(doc);
  return doc;
}

/** Loads a document into the editor's buffer and marks it active. */
export function openDocument(id: string): CVDocument | undefined {
  const doc = getDocument(id);
  if (!doc) return undefined;
  write(DATA_STORAGE_KEY, doc.data);
  write(THEME_STORAGE_KEY, doc.theme);
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, doc.layout);
  } catch {}
  setActiveDocumentId(doc.id);
  return doc;
}

/**
 * Mirrors the editor's buffer back into the active document. Called by the
 * editor whenever the document changes; a no-op when nothing is open, so the
 * editor can call it unconditionally.
 */
export function syncActiveDocument(patch: {
  data: CVData;
  theme: CVTheme;
  layout: LayoutType;
}) {
  const id = activeDocumentId();
  if (!id) return;
  const doc = getDocument(id);
  if (!doc) return;
  doc.data = patch.data;
  doc.theme = patch.theme;
  doc.layout = patch.layout;
  doc.updatedAt = Date.now();
  upsertDocument(doc);
}

/**
 * Adopts a pre-library résumé as the first document, so an existing user's
 * work appears in the dashboard instead of looking lost. Safe to call on every
 * dashboard mount: it only acts when there are no documents yet.
 */
export function migrateLegacyDocument(): CVDocument | null {
  if (read<CVDocument[]>(DOCS_KEY, []).length > 0) return null;
  const data = read<CVData | null>(DATA_STORAGE_KEY, null);
  if (!data?.personalInfo) return null;

  const layout = ((): LayoutType => {
    try {
      return (localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType) || "professional";
    } catch {
      return "professional";
    }
  })();

  const doc = createDocument({
    name: data.personalInfo.fullName ? `${data.personalInfo.fullName} — résumé` : "My résumé",
    layout,
    data,
    theme: { ...DEFAULT_THEME, ...read<Partial<CVTheme>>(THEME_STORAGE_KEY, {}) },
  });
  setActiveDocumentId(doc.id);
  return doc;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const yr = Math.round(mo / 12);
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}
