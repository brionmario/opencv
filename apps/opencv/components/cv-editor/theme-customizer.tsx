"use client";

import { X, RotateCcw } from "lucide-react";
import type { CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";

interface ThemeCustomizerProps {
  theme: CVTheme;
  onChange: (theme: CVTheme) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { label: "Pink", primary: "#db2777", heading: "#111827" },
  { label: "Blue", primary: "#2563eb", heading: "#1e3a5f" },
  { label: "Teal", primary: "#0d9488", heading: "#134e4a" },
  { label: "Violet", primary: "#7c3aed", heading: "#2e1065" },
  { label: "Amber", primary: "#d97706", heading: "#292524" },
  { label: "Slate", primary: "#475569", heading: "#0f172a" },
  { label: "Rose", primary: "#e11d48", heading: "#1c1917" },
  { label: "Emerald", primary: "#059669", heading: "#064e3b" },
];

const FONT_FACES = [
  { label: "Inter (Default)", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Lato", value: "Lato, 'Helvetica Neue', sans-serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', Arial, sans-serif" },
  { label: "Helvetica", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
];

const FONT_WEIGHTS = [
  { label: "Thin (100)", value: 100 },
  { label: "Light (300)", value: 300 },
  { label: "Regular (400)", value: 400 },
  { label: "Medium (500)", value: 500 },
  { label: "Semibold (600)", value: 600 },
  { label: "Bold (700)", value: 700 },
  { label: "Extrabold (800)", value: 800 },
  { label: "Black (900)", value: 900 },
];

export function ThemeCustomizer({ theme, onChange, onClose }: ThemeCustomizerProps) {
  const update = (patch: Partial<CVTheme>) => onChange({ ...theme, ...patch });

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-xl z-[60] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900 text-sm">Theme Customizer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(DEFAULT_THEME)}
            title="Reset to defaults"
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Color Presets */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Color Presets</h3>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => update({ primaryColor: preset.primary, headingColor: preset.heading })}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                title={preset.label}
              >
                <span
                  className="w-8 h-8 rounded-full border border-white shadow-sm"
                  style={{ background: preset.primary }}
                />
                <span className="text-[10px] text-gray-600">{preset.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Colors</h3>
          <div className="space-y-3">
            <ColorRow
              label="Accent / Primary"
              value={theme.primaryColor}
              onChange={(v) => update({ primaryColor: v })}
            />
            <ColorRow
              label="Headings"
              value={theme.headingColor}
              onChange={(v) => update({ headingColor: v })}
            />
            <ColorRow
              label="Body Text"
              value={theme.bodyColor}
              onChange={(v) => update({ bodyColor: v })}
            />
            <ColorRow
              label="Muted / Dates"
              value={theme.mutedColor}
              onChange={(v) => update({ mutedColor: v })}
            />
            <ColorRow
              label="Background"
              value={theme.backgroundColor}
              onChange={(v) => update({ backgroundColor: v })}
            />
          </div>
        </section>

        {/* Font Face */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Font Face</h3>
          <select
            value={theme.fontFace}
            onChange={(e) => update({ fontFace: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {FONT_FACES.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </section>

        {/* Font Sizes */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Font Sizes</h3>
          <div className="space-y-4">
            <SliderRow
              label="Name"
              value={theme.nameFontSize}
              min={24}
              max={60}
              unit="px"
              onChange={(v) => update({ nameFontSize: v })}
            />
            <SliderRow
              label="Section Headings"
              value={theme.sectionFontSize}
              min={12}
              max={28}
              unit="px"
              onChange={(v) => update({ sectionFontSize: v })}
            />
            <SliderRow
              label="Body Text"
              value={theme.bodyFontSize}
              min={10}
              max={18}
              unit="px"
              onChange={(v) => update({ bodyFontSize: v })}
            />
          </div>
        </section>

        {/* Font Weights */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Font Weights</h3>
          <div className="space-y-3">
            <WeightRow
              label="Name"
              value={theme.nameWeight}
              onChange={(v) => update({ nameWeight: v })}
            />
            <WeightRow
              label="Section Headings"
              value={theme.headingWeight}
              onChange={(v) => update({ headingWeight: v })}
            />
            <WeightRow
              label="Body Text"
              value={theme.bodyWeight}
              onChange={(v) => update({ bodyWeight: v })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs text-gray-700 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-xs font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="#000000"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200"
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-gray-700">{label}</label>
        <span className="text-xs font-mono text-gray-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}

function WeightRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs text-gray-700 flex-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-36"
      >
        {FONT_WEIGHTS.map((fw) => (
          <option key={fw.value} value={fw.value}>
            {fw.label}
          </option>
        ))}
      </select>
    </div>
  );
}
