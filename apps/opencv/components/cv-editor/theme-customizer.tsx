"use client";

import { X, Sun, Moon, Palette, RotateCcw } from "lucide-react";
import type { CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";

export interface ThemeCustomizerProps {
  theme: CVTheme;
  onChange: (theme: CVTheme) => void;
  onClose: () => void;
}

/* ── CV dark / light presets ────────────────────────────────────────────────── */
const DARK_CV_COLORS = {
  backgroundColor: "#1c1917",
  headingColor:    "#f0ebe3",
  bodyColor:       "#cec7be",
  mutedColor:      "#9a9186",
};
const LIGHT_CV_COLORS = {
  backgroundColor: DEFAULT_THEME.backgroundColor,
  headingColor:    DEFAULT_THEME.headingColor,
  bodyColor:       DEFAULT_THEME.bodyColor,
  mutedColor:      DEFAULT_THEME.mutedColor,
};

function isColorDark(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  if (isNaN(n)) return false;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 < 128000;
}

/* ── Original data ──────────────────────────────────────────────────────────── */
const COLOR_PRESETS = [
  { label: "Pink",    primary: "#db2777", heading: "#111827" },
  { label: "Blue",    primary: "#2563eb", heading: "#1e3a5f" },
  { label: "Teal",    primary: "#0d9488", heading: "#134e4a" },
  { label: "Violet",  primary: "#7c3aed", heading: "#2e1065" },
  { label: "Amber",   primary: "#d97706", heading: "#292524" },
  { label: "Slate",   primary: "#475569", heading: "#0f172a" },
  { label: "Rose",    primary: "#e11d48", heading: "#1c1917" },
  { label: "Emerald", primary: "#059669", heading: "#064e3b" },
];

const FONT_FACES = [
  { label: "Inter (Default)",  value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Georgia",          value: "Georgia, 'Times New Roman', serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Lato",             value: "Lato, 'Helvetica Neue', sans-serif" },
  { label: "Merriweather",     value: "Merriweather, Georgia, serif" },
  { label: "Roboto",           value: "Roboto, Arial, sans-serif" },
  { label: "Open Sans",        value: "'Open Sans', Arial, sans-serif" },
  { label: "Helvetica",        value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Times New Roman",  value: "'Times New Roman', Times, serif" },
];

const FONT_WEIGHTS = [
  { label: "Thin (100)",      value: 100 },
  { label: "Light (300)",     value: 300 },
  { label: "Regular (400)",   value: 400 },
  { label: "Medium (500)",    value: 500 },
  { label: "Semibold (600)",  value: 600 },
  { label: "Bold (700)",      value: 700 },
  { label: "Extrabold (800)", value: 800 },
  { label: "Black (900)",     value: 900 },
];


/* ── Sub-components ─────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="cv-fg-label">{children}</span>;
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <label style={{ fontSize: 12.5, color: "var(--cv-text-2)", flex: 1, fontFamily: "var(--cv-font-ui)" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 76, fontSize: 11.5, fontFamily: "var(--cv-font-mono)",
            border: "1px solid var(--cv-border-2)", borderRadius: 6,
            padding: "3px 8px", background: "var(--cv-surface-2)",
            color: "var(--cv-text)", outline: "none",
          }}
          placeholder="#000000"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            border: "1px solid var(--cv-border-2)", padding: 2,
            background: "var(--cv-surface)",
          }}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <label style={{ fontSize: 12.5, color: "var(--cv-text-2)", fontFamily: "var(--cv-font-ui)" }}>{label}</label>
        <span style={{ fontSize: 12, fontFamily: "var(--cv-font-mono)", color: "var(--cv-text-3)" }}>{value}{unit}</span>
      </div>
      <div className="cv-range-field">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function WeightRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <label style={{ fontSize: 12.5, color: "var(--cv-text-2)", flex: 1, fontFamily: "var(--cv-font-ui)" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          fontSize: 12.5, border: "1px solid var(--cv-border-2)", borderRadius: 6,
          padding: "4px 8px", background: "var(--cv-surface-2)",
          color: "var(--cv-text)", fontFamily: "var(--cv-font-ui)", outline: "none", width: 140,
        }}
      >
        {FONT_WEIGHTS.map((fw) => (
          <option key={fw.value} value={fw.value}>{fw.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export function ThemeCustomizer({ theme, onChange, onClose }: ThemeCustomizerProps) {
  const update = (patch: Partial<CVTheme>) => onChange({ ...theme, ...patch });
  const paperIsDark = isColorDark(theme.backgroundColor);

  return (
    /* No scrim — panel floats over content without blocking interaction */
    <aside className="cv-drawer" role="dialog" aria-label="Theme customizer">

      {/* Header */}
      <div className="cv-drawer-hd">
        <div className="cv-drawer-badge">
          <Palette size={19} />
        </div>
        <div className="cv-drawer-hd-txt">
          <h3>Theme</h3>
          <p>Personalize the CV — changes apply live.</p>
        </div>
        <button
          className="cv-iconbtn cv-tip"
          data-tip="Reset to defaults"
          aria-label="Reset to defaults"
          onClick={() => onChange(DEFAULT_THEME)}
        >
          <RotateCcw size={16} />
        </button>
        <button className="cv-iconbtn" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="cv-drawer-body">

        {/* ── CV page appearance ── */}
        <div className="cv-field-group">
          <SectionLabel>Page appearance</SectionLabel>
          <div className="cv-opt-row">
            <button
              className="cv-opt"
              data-active={!paperIsDark ? "true" : undefined}
              onClick={() => onChange({ ...theme, ...LIGHT_CV_COLORS })}
              style={{ flexDirection: "row", justifyContent: "center", paddingTop: 12, paddingBottom: 12, gap: 8 }}
            >
              <Sun size={15} />Light
            </button>
            <button
              className="cv-opt"
              data-active={paperIsDark ? "true" : undefined}
              onClick={() => onChange({ ...theme, ...DARK_CV_COLORS })}
              style={{ flexDirection: "row", justifyContent: "center", paddingTop: 12, paddingBottom: 12, gap: 8 }}
            >
              <Moon size={15} />Dark
            </button>
          </div>
        </div>

        {/* ── Color presets ── */}
        <div className="cv-field-group">
          <SectionLabel>Color presets</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => update({ primaryColor: preset.primary, headingColor: preset.heading })}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid transparent", background: "transparent",
                  fontFamily: "var(--cv-font-ui)", transition: "background 0.12s, border-color 0.12s",
                }}
                title={preset.label}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--cv-hover)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cv-border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", background: preset.primary,
                  border: "2px solid rgba(255,255,255,.6)", boxShadow: "var(--cv-shadow-sm)", flexShrink: 0,
                }} />
                <span style={{ fontSize: 10.5, color: "var(--cv-text-3)" }}>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Individual colors ── */}
        <div className="cv-field-group">
          <SectionLabel>Colors</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ColorRow label="Accent / Primary" value={theme.primaryColor}    onChange={(v) => update({ primaryColor: v })} />
            <ColorRow label="Headings"         value={theme.headingColor}    onChange={(v) => update({ headingColor: v })} />
            <ColorRow label="Body Text"        value={theme.bodyColor}       onChange={(v) => update({ bodyColor: v })} />
            <ColorRow label="Muted / Dates"    value={theme.mutedColor}      onChange={(v) => update({ mutedColor: v })} />
            <ColorRow label="Background"       value={theme.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
          </div>
        </div>

        {/* ── Font face ── */}
        <div className="cv-field-group">
          <SectionLabel>Font face</SectionLabel>
          <select
            value={theme.fontFace}
            onChange={(e) => update({ fontFace: e.target.value })}
            style={{
              width: "100%", fontSize: 13, fontFamily: "var(--cv-font-ui)",
              border: "1px solid var(--cv-border-2)", borderRadius: 8,
              padding: "7px 10px", background: "var(--cv-surface-2)",
              color: "var(--cv-text)", outline: "none",
            }}
          >
            {FONT_FACES.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* ── Font sizes ── */}
        <div className="cv-field-group">
          <SectionLabel>Font sizes</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SliderRow label="Name"             value={theme.nameFontSize}    min={24} max={60} unit="px" onChange={(v) => update({ nameFontSize: v })} />
            <SliderRow label="Section headings" value={theme.sectionFontSize} min={12} max={28} unit="px" onChange={(v) => update({ sectionFontSize: v })} />
            <SliderRow label="Body text"        value={theme.bodyFontSize}    min={10} max={18} unit="px" onChange={(v) => update({ bodyFontSize: v })} />
          </div>
        </div>

        {/* ── Font weights ── */}
        <div className="cv-field-group" style={{ marginBottom: 0 }}>
          <SectionLabel>Font weights</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <WeightRow label="Name"             value={theme.nameWeight}    onChange={(v) => update({ nameWeight: v })} />
            <WeightRow label="Section headings" value={theme.headingWeight} onChange={(v) => update({ headingWeight: v })} />
            <WeightRow label="Body text"        value={theme.bodyWeight}    onChange={(v) => update({ bodyWeight: v })} />
          </div>
        </div>

      </div>
    </aside>
  );
}
