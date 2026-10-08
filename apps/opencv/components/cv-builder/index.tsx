"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LAYOUTS, type LayoutType } from "@/lib/cv-layouts";
import { useCVData } from "@/hooks/use-cv-data";
import { exportToJSON, exportToMarkdown, exportToHTML, exportToPDF } from "@/lib/export-handler";
import { LinkedInImport } from "./linkedin-import";
import { ProfessionalTemplate } from "@/components/cv-editor/templates/professional";
import { ModernWysiwygTemplate } from "@/components/cv-editor/templates/modern";
import { ClassicWysiwygTemplate } from "@/components/cv-editor/templates/classic";
import { MinimalWysiwygTemplate } from "@/components/cv-editor/templates/minimal";
import { ThemeCustomizer } from "@/components/cv-editor/theme-customizer";
import { SectionsPanel } from "@/components/cv-editor/sections-panel";
import type { CVVersion } from "@/lib/cv-versioning";
import type { CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import {
  Download, FileJson, FileText, FileCode, Linkedin, History,
  Palette, Plus, Sun, Moon, Check, RotateCcw, Eye, ChevronDown,
  Layers, Sparkles, X, ListOrdered, LayoutTemplate, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SelectionProvider } from "@/lib/cv-selection";
import { syncActiveDocument } from "@/lib/cv-documents";
import { PropertiesPanel } from "@/components/cv-editor/properties-panel";

type DrawerType = "theme" | "history" | "sections" | null;
type CanvasType = "soft" | "dots" | "grid" | "plain";

interface Toast {
  id: number;
  msg: string;
  icon: "check" | "loader" | "linkedin" | "rotate" | "sparkles" | "download";
}


const EXPORTS = [
  { id: "pdf",  name: "PDF document", ext: ".pdf",  icon: <FileJson  size={17} />, desc: "Print-ready, ATS-friendly",   handler: "pdf"  },
  { id: "html", name: "Web page",     ext: ".html", icon: <FileCode  size={17} />, desc: "Self-contained HTML file",    handler: "html" },
  { id: "md",   name: "Markdown",     ext: ".md",   icon: <FileText  size={17} />, desc: "Plain text, portable",        handler: "md"   },
  { id: "json", name: "JSON Resume",  ext: ".json", icon: <FileJson  size={17} />, desc: "Structured data schema",      handler: "json" },
];

/* ── Canvas picker (lives on the desk) ───────────────────────────────────── */
const CANVAS_OPTIONS: { id: CanvasType; label: string; style: React.CSSProperties }[] = [
  // Swatches track the chrome tokens so they stay legible in either theme,
  // and each pattern is scaled up enough to read at 24px.
  { id: "soft",  label: "Studio", style: { background: "linear-gradient(180deg, var(--cv-surface-3), var(--cv-desk))" } },
  { id: "dots",  label: "Dots",   style: { backgroundColor: "var(--cv-desk)", backgroundImage: "radial-gradient(var(--cv-text-3) 1px, transparent 1.2px)", backgroundSize: "6px 6px" } },
  { id: "grid",  label: "Grid",   style: { backgroundColor: "var(--cv-desk)", backgroundImage: "linear-gradient(var(--cv-border-2) 1px,transparent 1px),linear-gradient(90deg,var(--cv-border-2) 1px,transparent 1px)", backgroundSize: "7px 7px" } },
  { id: "plain", label: "Plain",  style: { background: "var(--cv-desk)" } },
];

function CanvasPicker({ value, onChange }: { value: CanvasType; onChange: (v: CanvasType) => void }) {
  return (
    <div className="cv-canvas-picker" role="radiogroup" aria-label="Canvas background">
      {CANVAS_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          className="cv-canvas-opt cv-tip"
          data-active={value === opt.id ? "true" : undefined}
          data-tip={opt.label}
          aria-label={opt.label}
          aria-checked={value === opt.id}
          role="radio"
          onClick={() => onChange(opt.id)}
        >
          <span className="cv-canvas-swatch" style={opt.style} />
        </button>
      ))}
    </div>
  );
}

/* ── Toast helper ─────────────────────────────────────────────────────────── */
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((msg: string, icon: Toast["icon"] = "check", ttl = 2600) => {
    const id = ++idRef.current;
    setToasts((cur) => [...cur, { id, msg, icon }]);
    if (ttl) setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), ttl);
    return id;
  }, []);

  const drop = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, drop };
}

/* ── Click-outside hook ───────────────────────────────────────────────────── */
function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") cb(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [cb]);
  return ref;
}

/* ── Segmented template switcher ──────────────────────────────────────────── */
function TemplateSeg({ value, onChange }: { value: LayoutType; onChange: (v: LayoutType) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const btn = el.querySelector<HTMLButtonElement>(`[data-id="${value}"]`);
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value]);

  return (
    <div className="cv-seg" ref={ref} role="tablist" aria-label="Template">
      <div className="cv-seg-thumb" style={{ left: thumb.left, width: thumb.width }} />
      {LAYOUTS.map((t) => (
        <button
          key={t.id}
          className="cv-seg-btn"
          data-id={t.id}
          data-active={value === t.id ? "true" : undefined}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
        >
          <span className="cv-dot" />
          {t.name}
        </button>
      ))}
    </div>
  );
}

/* ── Export dropdown ──────────────────────────────────────────────────────── */
function ExportMenu({ onExport }: { onExport: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));

  return (
    <div className="cv-pop-wrap" ref={ref}>
      <button
        className="cv-btn cv-btn-primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Download size={15} />
        Export
        <ChevronDown size={13} style={{ marginRight: -3, opacity: 0.8 }} />
      </button>
      {open && (
        <div className="cv-menu" role="menu">
          <div className="cv-menu-label">Export résumé as</div>
          {EXPORTS.map((e) => (
            <button
              key={e.id}
              className="cv-menu-item"
              role="menuitem"
              onClick={() => { setOpen(false); onExport(e.id); }}
            >
              <span className="cv-menu-ic">{e.icon}</span>
              <span className="cv-menu-txt">
                <b>{e.name}</b>
                <span>{e.desc}</span>
              </span>
              <span className="cv-menu-ext">{e.ext}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Brand mark ───────────────────────────────────────────────────────────── */
function Brand() {
  return (
    <div className="cv-brand">
      <div className="cv-brand-mark" aria-hidden="true">
        <Layers size={17} strokeWidth={1.8} />
      </div>
      <div className="cv-brand-name">
        open<b>CV</b>
      </div>
      <div className="cv-doc-name">
        <span className="slash">/</span>
        <b>My Résumé</b>
      </div>
    </div>
  );
}

/* ── Icon button ──────────────────────────────────────────────────────────── */
function IconBtn({
  children, tip, onClick, active,
}: {
  children: React.ReactNode;
  tip: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      className="cv-iconbtn cv-tip"
      data-tip={tip}
      data-active={active ? "true" : undefined}
      aria-label={tip}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── Toast list ───────────────────────────────────────────────────────────── */
function Toasts({ items }: { items: Toast[] }) {
  const icons: Record<Toast["icon"], React.ReactNode> = {
    check:    <Check size={15} />,
    loader:   <Download size={15} />,
    linkedin: <Linkedin size={15} />,
    rotate:   <RotateCcw size={15} />,
    sparkles: <Sparkles size={15} />,
    download: <Download size={15} />,
  };
  return (
    <div className="cv-toast-wrap" aria-live="polite">
      {items.map((t) => (
        <div className="cv-toast" key={t.id}>
          <span className="cv-toast-ic">{icons[t.icon]}</span>
          <span dangerouslySetInnerHTML={{ __html: t.msg }} />
        </div>
      ))}
    </div>
  );
}

/* ── History Drawer ───────────────────────────────────────────────────────── */
function HistoryDrawer({
  versions,
  onClose,
  onRestore,
  onDelete,
  onRename,
  onExport,
  onCreateSavepoint,
}: {
  versions: CVVersion[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onExport: (v: CVVersion) => void;
  onCreateSavepoint: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const getRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
  };

  const saveEdit = (id: string) => {
    if (editLabel.trim()) onRename(id, editLabel.trim());
    setEditingId(null);
  };

  return (
    <>
      <div className="cv-scrim" onClick={onClose} />
      <aside className="cv-drawer" role="dialog" aria-label="Version history">
        <div className="cv-drawer-hd">
          <div className="cv-drawer-badge">
            <History size={19} />
          </div>
          <div className="cv-drawer-hd-txt">
            <h3>Version history</h3>
            <p>Every change is saved automatically.</p>
          </div>
          <button className="cv-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cv-drawer-body">
          {versions.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--cv-text-3)", textAlign: "center", marginTop: 32 }}>
              No saved versions yet. Auto-save creates versions as you edit.
            </p>
          ) : (
            <div className="cv-ver-list">
              {versions.map((v, i) => (
                <div className="cv-ver" key={v.id} data-current={i === 0 ? "true" : undefined}>
                  <div className="cv-ver-rail">
                    <div className="cv-ver-node" />
                    <div className="cv-ver-line" />
                  </div>
                  <div className="cv-ver-card">
                    <div className="cv-ver-top">
                      {editingId === v.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => saveEdit(v.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(v.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          style={{
                            flex: 1, fontSize: 13, border: "1px solid var(--cv-border-2)",
                            borderRadius: 6, padding: "2px 8px", background: "var(--cv-surface)",
                            color: "var(--cv-text)", fontFamily: "var(--cv-font-ui)",
                          }}
                        />
                      ) : (
                        <span className="cv-ver-label">{v.label}</span>
                      )}
                      <span className="cv-ver-when">{getRelativeTime(v.timestamp)}</span>
                    </div>
                    <div className="cv-ver-meta">
                      <span className="cv-ver-hash" style={{ fontFamily: "var(--cv-font-mono)" }}>
                        {v.id.slice(-6)}
                      </span>
                      <span className="cv-ver-hash" style={{ fontFamily: "var(--cv-font-ui)", textTransform: "capitalize" }}>
                        {v.data.experience.length} exp
                      </span>
                      <span className="cv-ver-hash" style={{ fontFamily: "var(--cv-font-ui)", textTransform: "capitalize" }}>
                        {v.data.skills.length} skills
                      </span>
                    </div>
                    <div className="cv-ver-actions">
                      {i === 0 ? (
                        <span className="cv-ver-now">
                          <Check size={15} />
                          Current version
                        </span>
                      ) : (
                        <>
                          <button className="cv-btn" onClick={() => { onRestore(v.id); onClose(); }}>
                            <RotateCcw size={14} />
                            Restore
                          </button>
                          <button className="cv-btn cv-btn-ghost" onClick={() => onExport(v)}>
                            <Eye size={14} />
                            Export
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--cv-border)" }}>
          <button
            className="cv-btn"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onCreateSavepoint}
          >
            <Plus size={15} />
            Save snapshot
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Page break overlay ───────────────────────────────────────────────────── */
const PAGE_H_PX = (297 / 25.4) * 96; // A4 height (297mm) at 96 dpi — must match template page size and PDF export
// Divider band drawn BELOW each page boundary. It must never cover the space
// above the boundary — that is printable page-N area, and hiding it makes the
// canvas lie about how much fits on a page.
const BREAK_GAP = 80;
// Extra whitespace after the divider before page N+1's content starts,
// mirroring the top inset a real printed page has (matches the page-1
// header's own top padding). Without this, content sits flush against the
// divider with no visual "new page" margin.
const PAGE_TOP_MARGIN = 32;

/**
 * Pushes EditableCard elements that straddle a page-break gap zone entirely
 * onto the next page, preventing cards from being sliced mid-entry.
 *
 * Loop-safety: after applying margins we record the resulting height as
 * "expected". The ResizeObserver skips its own height changes by comparing
 * the current height against that expectation, so only real content edits
 * trigger a re-calculation.
 */
function usePageBreakAvoider(containerRef: React.RefObject<HTMLDivElement>, enabled: boolean) {
  const expectedHeightRef = useRef(-1);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const adjust = () => {
      // EditableCards plus other unbreakable leaf rows (e.g. language rows)
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".group\\/card, .group\\/lang"));

      // A card that is the first item in its section's list container has a
      // heading sitting right before that container. If the card gets pushed
      // to the next page, push the heading along with it — otherwise the
      // heading is left orphaned at the bottom of the previous page with a
      // large blank gap beneath it.
      const headingFor = new Map<HTMLElement, HTMLElement>();
      cards.forEach((c) => {
        const container = c.parentElement;
        if (container && container.firstElementChild === c) {
          const head = container.previousElementSibling;
          if (head instanceof HTMLElement) headingFor.set(c, head);
        }
      });

      // Reset injected margins so getBoundingClientRect gives natural positions
      cards.forEach((c) => { c.style.marginTop = ""; });
      headingFor.forEach((head) => { head.style.marginTop = ""; });
      void el.offsetHeight; // force synchronous reflow

      const elRect = el.getBoundingClientRect();
      const base = elRect.top;
      // Split cards by column (left/right of the container midpoint) so that
      // accumulated push offsets don't bleed across independent flex columns
      const midX = elRect.left + elRect.width / 2;
      const colGroups: [HTMLElement[], HTMLElement[]] = [[], []];
      cards.forEach((c) => {
        colGroups[c.getBoundingClientRect().left < midX ? 0 : 1].push(c);
      });

      for (const col of colGroups) {
        let accumulated = 0;
        for (const card of col) {
          const r = card.getBoundingClientRect();
          const top = r.top - base + accumulated;
          const bottom = r.bottom - base + accumulated;

          const pageNum = Math.floor(top / PAGE_H_PX);
          const boundary = (pageNum + 1) * PAGE_H_PX;
          // The divider band sits entirely below the boundary; content resumes
          // PAGE_TOP_MARGIN further down, giving page N+1 a real top inset
          const gapEnd = boundary + BREAK_GAP + PAGE_TOP_MARGIN;

          // Only push cards that straddle the actual page boundary, not merely
          // overlap the gap zone — avoids over-pushing cards that end near the
          // boundary and leaving large blank gaps on the previous page.
          if (top < boundary && bottom > boundary) {
            const head = headingFor.get(card);
            if (head) {
              // Push the heading (not the card) far enough that the heading
              // itself clears the gap — the card follows it in normal flow.
              // Using the card's own offset here would under-push the heading,
              // leaving it inside the gap zone, hidden behind the divider.
              const headRect = head.getBoundingClientRect();
              const headTop = headRect.top - base + accumulated;
              const shift = Math.ceil(gapEnd - headTop);

              // The heading is the first child of its section wrapper, so its
              // margin-top collapses with the previous section's bottom margin
              // (the column's space-y gap) rather than adding on top of it.
              // Setting marginTop to just `shift` would therefore fall short by
              // that collapsed baseline, leaving the heading hidden behind the
              // page-break divider — so measure the real gap to the previous
              // section and add it back in.
              const wrapper = head.parentElement;
              const prevSibling = wrapper?.previousElementSibling ?? null;
              let marginToSet = shift;
              if (prevSibling) {
                const prevBottom = prevSibling.getBoundingClientRect().bottom - base + accumulated;
                marginToSet = shift + (headTop - prevBottom);
              }
              head.style.marginTop = `${Math.max(marginToSet, 0)}px`;
              accumulated += shift;
            } else {
              const existingMt = parseFloat(getComputedStyle(card).marginTop) || 0;
              const push = Math.ceil(gapEnd - top) + existingMt;
              card.style.marginTop = `${push}px`;
              accumulated += push - existingMt;
            }
          }
        }
      }

      // Record resulting height — ResizeObserver compares against this to
      // distinguish our margin changes from real content changes
      void el.offsetHeight;
      expectedHeightRef.current = el.offsetHeight;
    };

    const ro = new ResizeObserver(() => {
      // ResizeObserver fires asynchronously after layout; by then our margins
      // are applied and the height matches expectedHeight — so skip our own fires.
      if (el.offsetHeight === expectedHeightRef.current) return;
      requestAnimationFrame(adjust);
    });

    ro.observe(el);
    requestAnimationFrame(adjust);

    return () => {
      ro.disconnect();
      Array.from(el.querySelectorAll<HTMLElement>(".group\\/card, .group\\/lang")).forEach((c) => {
        c.style.marginTop = "";
        const head = c.parentElement?.firstElementChild === c ? c.parentElement.previousElementSibling : null;
        if (head instanceof HTMLElement) head.style.marginTop = "";
      });
    };
  }, [containerRef, enabled]);
}

function PageBreakOverlay({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const update = () => setContentHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [targetRef]);

  const pageCount = Math.ceil(contentHeight / PAGE_H_PX);
  if (pageCount <= 1) return null;

  return (
    <div
      className="print:hidden"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}
    >
      {Array.from({ length: pageCount - 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: (i + 1) * PAGE_H_PX,
            left: 0,
            right: 0,
            height: BREAK_GAP,
            background: "var(--cv-desk)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: BREAK_GAP / 2, background: "linear-gradient(to bottom, rgba(0,0,0,0.07), transparent)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: BREAK_GAP / 2, background: "linear-gradient(to top, rgba(0,0,0,0.07), transparent)" }} />
          <span style={{ width: 40, height: 1, background: "var(--cv-border-2)", position: "relative", zIndex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cv-text-3)", fontFamily: "var(--cv-font-ui)", whiteSpace: "nowrap", position: "relative", zIndex: 1 }}>
            Page {i + 2}
          </span>
          <span style={{ width: 40, height: 1, background: "var(--cv-border-2)", position: "relative", zIndex: 1 }} />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main CVBuilder
══════════════════════════════════════════════════════════════════════════ */
export function CVBuilder() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("professional");
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [drawer, setDrawer] = useState<DrawerType>(null);
  const router = useRouter();
  const [theme, setTheme] = useState<CVTheme>(DEFAULT_THEME);
  // Dark is the default register: the chrome recedes so the paper is the
  // only bright surface on the desk. A saved preference still wins.
  const [dark, setDark] = useState(true);
  const [canvas, setCanvas] = useState<CanvasType>("soft");
  // Which section on the page the Properties dock is describing.
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  // The dock always shows Properties; this picks the tool panel under it.
  const [tool, setTool] = useState<DrawerType>("sections");
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstLayoutSaveRef = useRef(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  usePageBreakAvoider(previewRef, isInitialized);
  const { toasts, push: pushToast, drop: dropToast } = useToasts();

  // Round the paper's height up to a whole number of A4 pages, so the last
  // page's background fills the full sheet instead of stopping wherever the
  // content happens to end (a bare minHeight only guarantees one page).
  // Measured from the content wrapper, not previewRef itself, so setting
  // previewRef's height here can't retrigger this effect.
  const [paperHeight, setPaperHeight] = useState<number | null>(null);
  useEffect(() => {
    // CVBuilder renders null until isInitialized flips true, so this must
    // re-run once that happens — otherwise previewContentRef is still null
    // on the one-and-only pass of an empty-deps effect.
    if (!isInitialized) return;
    const el = previewContentRef.current;
    if (!el) return;
    const update = () => {
      const pages = Math.max(1, Math.ceil(el.offsetHeight / PAGE_H_PX));
      setPaperHeight(pages * PAGE_H_PX);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isInitialized]);

  const {
    data,
    updatePersonalInfo,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addSkill,
    deleteSkill,
    addAward,
    deleteAward,
    addPublication,
    deletePublication,
    addReference,
    deleteReference,
    addSocialLink,
    deleteSocialLink,
    addLanguage,
    deleteLanguage,
    addCustomSection,
    deleteCustomSection,
    updateCustomSectionTitle,
    addCustomSectionItem,
    updateCustomSectionItem,
    deleteCustomSectionItem,
    toggleSectionHidden,
    setSectionColumn,
    moveSection,
    updateField,
    resetData,
    importData,
    versions,
    createSavepoint,
    restoreSavepoint,
    removeSavepoint,
    updateSavepointLabel,
  } = useCVData();

  /* ── Init ── */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLayout = urlParams.get("layout");
    const savedLayout = localStorage.getItem("cvBuilderLayout");
    const layout = urlLayout || savedLayout;
    if (layout) setSelectedLayout(layout as LayoutType);

    const savedTheme = localStorage.getItem("cvBuilderTheme");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        // Migrate themes saved under the old (US Letter era) default type
        // scale to the current A4-matched defaults.
        if (parsed.nameFontSize === 36 && parsed.sectionFontSize === 18 && parsed.bodyFontSize === 14) {
          parsed.nameFontSize = DEFAULT_THEME.nameFontSize;
          parsed.sectionFontSize = DEFAULT_THEME.sectionFontSize;
          parsed.bodyFontSize = DEFAULT_THEME.bodyFontSize;
        }
        setTheme(parsed);
      } catch {}
    }

    const savedDark = localStorage.getItem("cvBuilderDark");
    if (savedDark) setDark(savedDark === "true");

    const savedCanvas = localStorage.getItem("cvBuilderCanvas") as CanvasType | null;
    if (savedCanvas) setCanvas(savedCanvas);

    const hasSavedData = !!urlParams.get("data") || !!localStorage.getItem("cvBuilderData");
    // Nothing saved yet: start in the gallery rather than on an empty page.
    if (!hasSavedData) router.replace("/");

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("cvBuilderTheme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("cvBuilderDark", String(dark));
    // dark here is the app-shell dark mode (toolbar moon/sun), not the CV page
    document.documentElement.setAttribute("data-cv-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("cvBuilderCanvas", canvas);
  }, [canvas]);

  useEffect(() => {
    if (isFirstLayoutSaveRef.current) { isFirstLayoutSaveRef.current = false; return; }
    localStorage.setItem("cvBuilderLayout", selectedLayout);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", selectedLayout);
    window.history.replaceState(null, "", url.toString());
  }, [selectedLayout]);

  // Keep the library row for the open document in step with the editor's
  // buffer, so the dashboard shows current templates and edit times.
  useEffect(() => {
    if (!isInitialized) return;
    syncActiveDocument({ data, theme, layout: selectedLayout });
  }, [data, theme, selectedLayout, isInitialized]);

  /* ── Handlers ── */
  const handleExport = (id: string) => {
    const e = EXPORTS.find((x) => x.id === id);
    if (!e) return;
    const name = data.personalInfo.fullName.replace(/\s+/g, "_") || "resume";

    if (id === "pdf") {
      const tidLoading = pushToast(`Generating <b>PDF</b>…`, "loader", 0);
      // Mirror the canvas page split exactly: any experience card the
      // page-break avoider pushed past the A4 boundary goes to page 2 in
      // the PDF too. Only the professional canvas carries the markers —
      // other layouts fall back to the PDF document's own estimate.
      let page2ExpIds: string[] | undefined;
      const paper = previewRef.current;
      if (paper && paper.querySelector("[data-cv-professional]")) {
        const base = paper.getBoundingClientRect().top;
        page2ExpIds = Array.from(paper.querySelectorAll<HTMLElement>("[data-entry-id]"))
          .filter((el) => el.getBoundingClientRect().top - base >= PAGE_H_PX)
          .map((el) => el.dataset.entryId as string);
      }
      exportToPDF("", data, `${name}_CV.pdf`, theme, page2ExpIds).then(() => {
        dropToast(tidLoading);
        pushToast(`Downloaded <b>${name}.pdf</b>`, "download");
      });
      return;
    }

    const tidLoading = pushToast(`Preparing <b>${e.name}</b>…`, "loader", 0);
    setTimeout(() => {
      dropToast(tidLoading);
      if (id === "html") {
        const html = document.getElementById("cv-preview")?.innerHTML;
        if (html) exportToHTML(html, data, `${name}_CV.html`);
      } else if (id === "md") {
        exportToMarkdown(data, `${name}_CV.md`);
      } else if (id === "json") {
        exportToJSON(data, `${name}_CV.json`);
      }
      pushToast(`Downloaded <b>${name}${e.ext}</b>`, "download");
    }, 1100);
  };

  const handleLinkedInImport = (linkedInData: any) => {
    importData({
      ...data,
      personalInfo: { ...data.personalInfo, ...linkedInData.personalInfo },
      experience: [...data.experience, ...(linkedInData.experience || [])],
      education: [...data.education, ...(linkedInData.education || [])],
      skills: [...data.skills, ...(linkedInData.skills || [])],
    });
    pushToast("Imported profile from <b>LinkedIn</b>", "linkedin");
  };

  const handleLinkedInClick = () => {
    setShowLinkedInImport(true);
  };

  const handleExportVersion = (version: CVVersion) => {
    const name = data.personalInfo.fullName.replace(/\s+/g, "_") || "resume";
    exportToJSON(version.data, `${name}_CV_${version.label.replace(/\s+/g, "_")}.json`);
  };

  const handleNewCV = () => {
    router.push("/");
  };

  const handleRestore = (id: string) => {
    restoreSavepoint(id);
    const v = versions.find((x) => x.id === id);
    pushToast(`Restored to <b>"${v?.label || "snapshot"}"</b>`, "rotate");
  };

  const handleCreateSavepoint = () => {
    createSavepoint(`Snapshot — ${new Date().toLocaleString()}`);
    pushToast("Snapshot saved", "check");
  };

  const handlePhotoUpload = (dataUrl: string) => {
    updatePersonalInfo({ avatar: dataUrl });
  };

  const handleLayoutChange = (id: LayoutType) => {
    setSelectedLayout(id);
    const name = LAYOUTS.find((x) => x.id === id)?.name;
    pushToast(`Switched to <b>${name}</b>`, "sparkles");
  };

  /* ── Template props (unchanged shape) ── */
  const templateProps = {
    data,
    theme,
    onUpdate: updateField,
    onAddExperience: () =>
      addExperience({ jobTitle: "", company: "", startDate: "", endDate: "", currentlyWorking: false, location: "", description: "", highlights: [] }),
    onDeleteExperience: deleteExperience,
    onAddEducation: () =>
      addEducation({ degree: "", institution: "", field: "", startDate: "", endDate: "", description: "" }),
    onDeleteEducation: deleteEducation,
    onAddSkill: () => addSkill({ name: "" }),
    onDeleteSkill: deleteSkill,
    onAddAward: () => addAward({ title: "", issuer: "", date: "" }),
    onDeleteAward: deleteAward,
    onAddPublication: () => addPublication({ title: "Publication Title", publisher: "", date: "" }),
    onDeletePublication: deletePublication,
    onAddReference: () => addReference({ name: "", title: "", company: "", email: "", phone: "" }),
    onDeleteReference: deleteReference,
    onAddSocialLink: () => addSocialLink({ platform: "", url: "" }),
    onDeleteSocialLink: deleteSocialLink,
    onAddLanguage: () => addLanguage({ name: "Language", proficiency: 3 }),
    onDeleteLanguage: deleteLanguage,
    onPhotoUpload: handlePhotoUpload,
    onDeleteCustomSection: deleteCustomSection,
    onUpdateCustomSectionTitle: updateCustomSectionTitle,
    onAddCustomSectionItem: addCustomSectionItem,
    onUpdateCustomSectionItem: updateCustomSectionItem,
    onDeleteCustomSectionItem: deleteCustomSectionItem,
  };

  // professional/modern render two columns; classic/minimal flow as one
  const layoutColumns: 1 | 2 = selectedLayout === "professional" || selectedLayout === "modern" ? 2 : 1;
  const pageCount = Math.max(1, Math.ceil((paperHeight ?? PAGE_H_PX) / PAGE_H_PX));

  const renderTemplate = () => {
    switch (selectedLayout) {
      case "professional": return <ProfessionalTemplate {...templateProps} />;
      case "modern":       return <ModernWysiwygTemplate {...templateProps} />;
      case "classic":      return <ClassicWysiwygTemplate {...templateProps} />;
      case "minimal":      return <MinimalWysiwygTemplate {...templateProps} />;
      default:             return <ProfessionalTemplate {...templateProps} />;
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="cv-app" data-cv-density="comfortable">

      {/* ── Options bar ── */}
      <header className="cv-bar" role="banner">
        <div className="cv-bar-zone left">
          <Brand />
        </div>

        <div className="cv-bar-zone center">
          <TemplateSeg value={selectedLayout} onChange={handleLayoutChange} />
        </div>

        <div className="cv-bar-zone right">
          <Link className="cv-btn" href="/templates">
            <LayoutTemplate size={15} />
            Templates
          </Link>
          <button className="cv-btn" onClick={handleNewCV}>
            <Plus size={15} />
            New
          </button>
          <IconBtn
            tip={dark ? "Light mode" : "Dark mode"}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </IconBtn>
          <ExportMenu onExport={handleExport} />
        </div>
      </header>

      {/* ── Tool rail ── */}
      <nav className="cv-rail" aria-label="Tools">
        <IconBtn
          tip="Properties"
          active={tool === null}
          onClick={() => setTool(null)}
        >
          <SlidersHorizontal size={17} />
        </IconBtn>
        <span className="cv-rail-sep" />
        <IconBtn tip="Sections" active={tool === "sections"} onClick={() => setTool("sections")}>
          <ListOrdered size={17} />
        </IconBtn>
        <IconBtn tip="Theme" active={tool === "theme"} onClick={() => setTool("theme")}>
          <Palette size={17} />
        </IconBtn>
        <IconBtn tip="Version history" active={tool === "history"} onClick={() => setTool("history")}>
          <History size={17} />
        </IconBtn>
        <span className="cv-rail-sep" />
        <IconBtn tip="Import from LinkedIn" onClick={handleLinkedInClick}>
          <Linkedin size={17} />
        </IconBtn>
      </nav>

      {/* ── Desk canvas ── */}
      <main
        className="cv-desk"
        data-canvas={canvas}
        onClick={(e) => {
          // A click on the desk itself (not on the paper) clears the selection.
          if (e.target === e.currentTarget) setSelectedSection(null);
        }}
      >
        <CanvasPicker value={canvas} onChange={setCanvas} />
        <div className="cv-paper-wrap">
          <div
            id="cv-preview"
            ref={previewRef}
            style={{
              background: theme.backgroundColor,
              width: "100%",
              height: paperHeight ? `${paperHeight}px` : "297mm",
              borderRadius: 4,
              boxShadow: "var(--cv-shadow-paper)",
              color: theme.bodyColor,
              transition: "background 0.3s, color 0.3s",
            }}
          >
            <div ref={previewContentRef}>
              <SelectionProvider selectedId={selectedSection} onSelect={setSelectedSection}>
                {renderTemplate()}
              </SelectionProvider>
            </div>
          </div>
          <PageBreakOverlay targetRef={previewRef} />
        </div>
      </main>

      {/* ── Right dock ── */}
      <aside className="cv-dock" aria-label="Panels">
        <section className="cv-dock-panel">
          <div className="cv-dock-hd">Properties</div>
          <div className="cv-dock-body">
            <PropertiesPanel
              data={data}
              selectedId={selectedSection}
              layoutColumns={layoutColumns}
              onToggleHidden={toggleSectionHidden}
              onMove={moveSection}
              onSetColumn={setSectionColumn}
              onDeleteCustomSection={deleteCustomSection}
            />
          </div>
        </section>

        {tool && (
          <section className="cv-dock-panel grow">
            {tool === "sections" && (
              <SectionsPanel
                data={data}
                layoutColumns={layoutColumns}
                onToggleHidden={toggleSectionHidden}
                onMove={moveSection}
                onSetColumn={setSectionColumn}
                onAddCustomSection={addCustomSection}
                onDeleteCustomSection={deleteCustomSection}
                onClose={() => setTool(null)}
              />
            )}
            {tool === "theme" && (
              <ThemeCustomizer theme={theme} onChange={setTheme} onClose={() => setTool(null)} />
            )}
            {tool === "history" && (
              <HistoryDrawer
                versions={versions}
                onClose={() => setTool(null)}
                onRestore={handleRestore}
                onDelete={removeSavepoint}
                onRename={updateSavepointLabel}
                onExport={handleExportVersion}
                onCreateSavepoint={handleCreateSavepoint}
              />
            )}
          </section>
        )}
      </aside>

      {/* ── Status bar ── */}
      <footer className="cv-status">
        <span><b>{LAYOUTS.find((l) => l.id === selectedLayout)?.name}</b></span>
        <span className="sep" />
        <span>A4 · {pageCount} page{pageCount === 1 ? "" : "s"}</span>
        <span className="sep" />
        <span>{layoutColumns === 2 ? "2 columns" : "1 column"}</span>
        <span className="grow" />
        <span>{selectedSection ? `selected: ${selectedSection}` : "no selection"}</span>
      </footer>

      {/* ── LinkedIn Import Modal ── */}
      <LinkedInImport
        isOpen={showLinkedInImport}
        onClose={() => setShowLinkedInImport(false)}
        onImport={handleLinkedInImport}
      />

      {/* ── Toasts ── */}
      <Toasts items={toasts} />
    </div>
  );
}
