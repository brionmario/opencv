"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCVData } from "@/hooks/use-cv-data";
import { exportToJSON, exportToMarkdown, exportToHTML, exportToPDF } from "@/lib/export-handler";
import { LinkedInImport } from "./linkedin-import";
import { ProfessionalTemplate } from "@/components/cv-editor/templates/professional";
import { ModernWysiwygTemplate } from "@/components/cv-editor/templates/modern";
import { ClassicWysiwygTemplate } from "@/components/cv-editor/templates/classic";
import { MinimalWysiwygTemplate } from "@/components/cv-editor/templates/minimal";
import { ThemeCustomizer } from "@/components/cv-editor/theme-customizer";
import type { CVVersion } from "@/lib/cv-versioning";
import type { CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import {
  Download, FileJson, FileText, FileCode, Linkedin, History,
  Palette, Plus, Sun, Moon, Check, RotateCcw, Eye, ChevronDown,
  Layers, Sparkles, X,
} from "lucide-react";

type LayoutType = "professional" | "modern" | "classic" | "minimal";
type DrawerType = "theme" | "history" | null;
type CanvasType = "soft" | "dots" | "grid" | "plain";

interface Toast {
  id: number;
  msg: string;
  icon: "check" | "loader" | "linkedin" | "rotate" | "sparkles" | "download";
}

const LAYOUTS: { id: LayoutType; name: string; tag: string; desc: string }[] = [
  { id: "professional", name: "Professional", tag: "popular",  desc: "Two-column with a tinted sidebar. The dependable choice for most roles." },
  { id: "modern",       name: "Modern",       tag: "bold",     desc: "Accent header band and confident type. Stands out in a stack." },
  { id: "classic",      name: "Classic",      tag: "timeless", desc: "Centered serif masthead. Formal, editorial, understated." },
  { id: "minimal",      name: "Minimal",      tag: "quiet",    desc: "Single column, hairline rules, maximum whitespace." },
];

const EXPORTS = [
  { id: "pdf",  name: "PDF document", ext: ".pdf",  icon: <FileJson  size={17} />, desc: "Print-ready, ATS-friendly",   handler: "pdf"  },
  { id: "html", name: "Web page",     ext: ".html", icon: <FileCode  size={17} />, desc: "Self-contained HTML file",    handler: "html" },
  { id: "md",   name: "Markdown",     ext: ".md",   icon: <FileText  size={17} />, desc: "Plain text, portable",        handler: "md"   },
  { id: "json", name: "JSON Resume",  ext: ".json", icon: <FileJson  size={17} />, desc: "Structured data schema",      handler: "json" },
];

/* ── Canvas picker (lives on the desk) ───────────────────────────────────── */
const CANVAS_OPTIONS: { id: CanvasType; label: string; style: React.CSSProperties }[] = [
  { id: "soft",  label: "Studio", style: { background: "radial-gradient(120% 90% at 50% 0%, #fff, #ece6dc)" } },
  { id: "dots",  label: "Dots",   style: { backgroundColor: "#f1ece3", backgroundImage: "radial-gradient(#c9c2b4 1px, transparent 1.2px)", backgroundSize: "6px 6px" } },
  { id: "grid",  label: "Grid",   style: { backgroundColor: "#f3eee5", backgroundImage: "linear-gradient(#ddd7ca 1px,transparent 1px),linear-gradient(90deg,#ddd7ca 1px,transparent 1px)", backgroundSize: "7px 7px" } },
  { id: "plain", label: "Plain",  style: { background: "#eee8de" } },
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

/* ── Mini template previews (for modal thumbnails) ────────────────────────── */
function MiniPreview({ layout }: { layout: string }) {
  if (layout === "professional") {
    return (
      <div className="cv-mini-sidebar">
        <div className="cv-mini-col side">
          <div className="cv-mini-line accent" style={{ width: "70%" }} />
          <div className="cv-mini-line" />
          <div className="cv-mini-line" style={{ width: "80%" }} />
          <div style={{ height: 8 }} />
          <div className="cv-mini-line dark" style={{ width: "50%" }} />
          <div className="cv-mini-line" />
          <div className="cv-mini-line" style={{ width: "60%" }} />
        </div>
        <div className="cv-mini-col">
          <div className="cv-mini-h" />
          <div className="cv-mini-sub" />
          <div className="cv-mini-line" />
          <div className="cv-mini-line" />
          <div className="cv-mini-line" style={{ width: "85%" }} />
          <div style={{ height: 8 }} />
          <div className="cv-mini-line" />
          <div className="cv-mini-line" style={{ width: "70%" }} />
        </div>
      </div>
    );
  }
  if (layout === "modern") {
    return (
      <div>
        <div style={{ background: "var(--cv-accent)", margin: "-11px -10px 9px", padding: "10px 10px 9px", opacity: 0.92 }}>
          <div className="cv-mini-line" style={{ background: "#fff", width: "55%", opacity: 0.95 }} />
          <div className="cv-mini-line" style={{ background: "#fff", width: "35%", opacity: 0.7, marginBottom: 0 }} />
        </div>
        <div className="cv-mini-line dark" style={{ width: "30%" }} />
        <div className="cv-mini-line" />
        <div className="cv-mini-line" style={{ width: "85%" }} />
        <div style={{ height: 7 }} />
        <div className="cv-mini-line dark" style={{ width: "30%" }} />
        <div className="cv-mini-line" />
        <div className="cv-mini-line" style={{ width: "75%" }} />
      </div>
    );
  }
  if (layout === "classic") {
    return (
      <div className="cv-mini-center">
        <div className="cv-mini-h" style={{ width: "55%" }} />
        <div className="cv-mini-sub" style={{ width: "35%" }} />
        <div style={{ height: 1, background: "#e7e3db", margin: "0 0 10px" }} />
        <div className="cv-mini-line dark" style={{ width: "28%", margin: "0 auto 7px" }} />
        <div className="cv-mini-line" />
        <div className="cv-mini-line" style={{ width: "90%" }} />
        <div style={{ height: 7 }} />
        <div className="cv-mini-line dark" style={{ width: "28%", margin: "0 auto 7px" }} />
        <div className="cv-mini-line" style={{ width: "80%" }} />
      </div>
    );
  }
  return (
    <div>
      <div className="cv-mini-h" style={{ width: "45%" }} />
      <div className="cv-mini-sub" style={{ width: "30%" }} />
      <div className="cv-mini-line dark" style={{ width: "22%" }} />
      <div className="cv-mini-line" />
      <div className="cv-mini-line" />
      <div className="cv-mini-line" style={{ width: "70%" }} />
      <div style={{ height: 10 }} />
      <div className="cv-mini-line dark" style={{ width: "22%" }} />
      <div className="cv-mini-line" />
      <div className="cv-mini-line" style={{ width: "60%" }} />
    </div>
  );
}

/* ── Template Picker Modal ────────────────────────────────────────────────── */
function TemplatePickerModal({
  current,
  onPick,
  onClose,
}: {
  current: LayoutType;
  onPick: (id: LayoutType) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<LayoutType>(current);

  return (
    <div className="cv-modal-scrim" onClick={onClose}>
      <div
        className="cv-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a template"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cv-modal-hd">
          <div className="cv-modal-eyebrow">
            <Sparkles size={15} />
            Start a new résumé
          </div>
          <h2>Choose a template</h2>
          <p>
            Pick a starting point — you can switch any time, and your content carries over.
            Every template is print-tested and ATS-friendly.
          </p>
          <button className="cv-iconbtn cv-modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cv-modal-body">
          <div className="cv-tpl-grid">
            {LAYOUTS.map((t) => (
              <button
                key={t.id}
                className="cv-tpl-card"
                data-active={current === t.id ? "true" : undefined}
                onMouseEnter={() => setHovered(t.id)}
                onClick={() => onPick(t.id)}
              >
                <div className="cv-tpl-thumb">
                  <div className="cv-tpl-thumb-inner">
                    <MiniPreview layout={t.id} />
                  </div>
                  <div className="cv-tpl-pick">
                    <span className="cv-tpl-pick-chip">
                      <Check size={15} />
                      Use this
                    </span>
                  </div>
                </div>
                <div className="cv-tpl-meta">
                  <div className="row">
                    <h4>{t.name}</h4>
                    <span className="cv-tag">{t.tag}</span>
                  </div>
                  <p>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="cv-modal-ft">
          <span className="cv-hint">
            <Linkedin size={15} />
            Already have a profile? Import from LinkedIn after picking.
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cv-btn cv-btn-ghost" onClick={onClose}>
              Maybe later
            </button>
            <button
              className="cv-btn cv-btn-primary"
              onClick={() => onPick(hovered || current)}
            >
              Start with {LAYOUTS.find((x) => x.id === (hovered || current))?.name}
              <ChevronDown size={14} style={{ marginRight: -3, transform: "rotate(-90deg)" }} />
            </button>
          </div>
        </div>
      </div>
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
const PAGE_H_PX = 11 * 96; // 11in at 96 dpi
const BREAK_GAP = 120; // 60px top margin + 60px bottom margin between pages

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
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".group\\/card"));

      // Reset injected margins so getBoundingClientRect gives natural positions
      cards.forEach((c) => { c.style.marginTop = ""; });
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
          const gapStart = boundary - BREAK_GAP / 2;
          const gapEnd = boundary + BREAK_GAP / 2;

          // Only push cards that straddle the actual page boundary, not merely
          // overlap the gap zone — avoids over-pushing cards that end near the
          // boundary and leaving large blank gaps on the previous page.
          if (top < boundary && bottom > boundary) {
            const existingMt = parseFloat(getComputedStyle(card).marginTop) || 0;
            const push = Math.ceil(gapEnd - top) + existingMt;
            card.style.marginTop = `${push}px`;
            accumulated += push - existingMt;
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
      Array.from(el.querySelectorAll<HTMLElement>(".group\\/card"))
        .forEach((c) => { c.style.marginTop = ""; });
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
            top: (i + 1) * PAGE_H_PX - BREAK_GAP / 2,
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
  const [showModal, setShowModal] = useState(false);
  const [theme, setTheme] = useState<CVTheme>(DEFAULT_THEME);
  const [dark, setDark] = useState(false);
  const [canvas, setCanvas] = useState<CanvasType>("soft");
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstLayoutSaveRef = useRef(true);
  const previewRef = useRef<HTMLDivElement>(null);
  usePageBreakAvoider(previewRef, isInitialized);
  const { toasts, push: pushToast, drop: dropToast } = useToasts();

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
    addSocialLink,
    deleteSocialLink,
    addLanguage,
    deleteLanguage,
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
      try { setTheme(JSON.parse(savedTheme)); } catch {}
    }

    const savedDark = localStorage.getItem("cvBuilderDark");
    if (savedDark) setDark(savedDark === "true");

    const savedCanvas = localStorage.getItem("cvBuilderCanvas") as CanvasType | null;
    if (savedCanvas) setCanvas(savedCanvas);

    const hasSavedData = !!urlParams.get("data") || !!localStorage.getItem("cvBuilderData");
    if (!hasSavedData) setShowModal(true);

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

  /* ── Handlers ── */
  const handleExport = (id: string) => {
    const e = EXPORTS.find((x) => x.id === id);
    if (!e) return;
    const tidLoading = pushToast(`Preparing <b>${e.name}</b>…`, "loader", 0);
    setTimeout(() => {
      dropToast(tidLoading);
      const name = data.personalInfo.fullName.replace(/\s+/g, "_") || "resume";
      if (id === "pdf") {
        const html = document.getElementById("cv-preview")?.innerHTML;
        if (html) exportToPDF(html, data, `${name}_CV.pdf`);
      } else if (id === "html") {
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
    setShowModal(true);
  };

  const handleModalPick = (id: LayoutType) => {
    setSelectedLayout(id);
    setShowModal(false);
    const name = LAYOUTS.find((x) => x.id === id)?.name;
    pushToast(`Started with the <b>${name}</b> template`, "sparkles");
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
    onAddSocialLink: () => addSocialLink({ platform: "", url: "" }),
    onDeleteSocialLink: deleteSocialLink,
    onAddLanguage: () => addLanguage({ name: "Language", proficiency: 3 }),
    onDeleteLanguage: deleteLanguage,
    onPhotoUpload: handlePhotoUpload,
  };

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

      {/* ── Top Bar ── */}
      <header className="cv-bar" role="banner">
        {/* Left zone: brand */}
        <div className="cv-bar-zone left">
          <Brand />
        </div>

        {/* Center zone: template switcher */}
        <div className="cv-bar-zone center">
          <TemplateSeg value={selectedLayout} onChange={handleLayoutChange} />
        </div>

        {/* Right zone: actions */}
        <div className="cv-bar-zone right">
          <IconBtn tip="Import from LinkedIn" onClick={handleLinkedInClick}>
            <Linkedin size={18} />
          </IconBtn>
          <IconBtn
            tip="Version history"
            active={drawer === "history"}
            onClick={() => setDrawer((d) => (d === "history" ? null : "history"))}
          >
            <History size={18} />
          </IconBtn>
          <span className="cv-divider-v" />
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

      {/* ── Desk Canvas ── */}
      <main className="cv-desk" data-canvas={canvas}>
        <CanvasPicker value={canvas} onChange={setCanvas} />
        <div className="cv-paper-wrap">
          <div
            id="cv-preview"
            ref={previewRef}
            style={{
              background: theme.backgroundColor,
              width: "100%",
              minHeight: "11in",
              borderRadius: 4,
              boxShadow: "var(--cv-shadow-paper)",
              color: theme.bodyColor,
              transition: "background 0.3s, color 0.3s",
            }}
          >
            {renderTemplate()}
          </div>
          <PageBreakOverlay targetRef={previewRef} />
        </div>
      </main>

      {/* ── Theme Drawer ── */}
      {drawer === "theme" && (
        <ThemeCustomizer
          theme={theme}
          onChange={setTheme}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* ── Floating theme button (visible when drawer is closed) ── */}
      {drawer !== "theme" && (
        <button
          className="cv-theme-fab"
          aria-label="Open theme customizer"
          onClick={() => setDrawer("theme")}
        >
          <Palette size={17} />
          Theme
        </button>
      )}

      {/* ── History Drawer ── */}
      {drawer === "history" && (
        <HistoryDrawer
          versions={versions}
          onClose={() => setDrawer(null)}
          onRestore={handleRestore}
          onDelete={removeSavepoint}
          onRename={updateSavepointLabel}
          onExport={handleExportVersion}
          onCreateSavepoint={handleCreateSavepoint}
        />
      )}

      {/* ── Template Picker Modal ── */}
      {showModal && (
        <TemplatePickerModal
          current={selectedLayout}
          onPick={handleModalPick}
          onClose={() => setShowModal(false)}
        />
      )}

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
