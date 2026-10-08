"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import {
  LAYOUTS,
  LAYOUT_STORAGE_KEY,
  DATA_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type LayoutType,
} from "@/lib/cv-layouts";
import { starterTemplates } from "@/lib/starter-templates";
import { activeDocumentId, createDocument, openDocument, syncActiveDocument } from "@/lib/cv-documents";
import { TemplatePreview } from "@/components/cv-editor/template-preview";

/** The sample the gallery falls back to when there is nothing saved yet, so a
 *  first-time visitor still sees a filled-in page rather than empty rules. */
const SAMPLE: CVData = starterTemplates[0].data;

export default function TemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<LayoutType>("professional");
  const [applied, setApplied] = useState<LayoutType>("professional");
  const [data, setData] = useState<CVData>(SAMPLE);
  const [theme, setTheme] = useState<CVTheme>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  // The shell theme lives on <html>; this route sets it too so the gallery
  // matches the editor instead of flashing the light default.
  const [dark, setDark] = useState(true);

  // Read the saved document so every preview shows the user's own content.
  useEffect(() => {
    try {
      const savedDark = localStorage.getItem("cvBuilderDark");
      const isDark = savedDark === null ? true : savedDark === "true";
      setDark(isDark);
      document.documentElement.setAttribute("data-cv-theme", isDark ? "dark" : "light");
      const savedData = localStorage.getItem(DATA_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as CVData;
        if (parsed?.personalInfo) setData(parsed);
      }
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) setTheme({ ...DEFAULT_THEME, ...JSON.parse(savedTheme) });
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null;
      if (savedLayout && LAYOUTS.some((l) => l.id === savedLayout)) {
        setSelected(savedLayout);
        setApplied(savedLayout);
      }
    } catch {
      // Corrupt or unavailable storage: the sample above is a fine fallback.
    }
    setReady(true);
  }, []);

  const meta = useMemo(() => LAYOUTS.find((l) => l.id === selected) ?? LAYOUTS[0], [selected]);

  const use = () => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, selected);
    } catch {}
    // Switching template on an open document just restyles it; arriving here
    // with nothing open (straight from the dashboard's "Pick a template")
    // means this is where the document gets created.
    if (activeDocumentId()) {
      syncActiveDocument({ data, theme, layout: selected });
    } else {
      const doc = createDocument({ name: "New résumé", layout: selected, data, theme });
      openDocument(doc.id);
    }
    router.push("/editor");
  };

  return (
    <div className="cv-gallery" data-cv-density="comfortable">
      <header className="cv-gallery-bar">
        <Link href="/" className="cv-btn cv-btn-ghost">
          <ArrowLeft size={15} />
          Dashboard
        </Link>
        <img
          className="cv-gallery-logo"
          src={dark ? "/brand/logo-inverted.png" : "/brand/logo.png"}
          alt="openCV — Open Source CV Builder"
        />
        <div className="cv-gallery-bar-end">
          <button className="cv-btn cv-btn-primary" onClick={use} disabled={!ready}>
            {selected === applied ? <Check size={15} /> : null}
            Use {meta.name}
          </button>
        </div>
      </header>

      <div className="cv-gallery-body">
        {/* ── Chooser ── */}
        <aside className="cv-gallery-list" aria-label="Templates">
          <div className="cv-gallery-list-head">
            <h1>Templates</h1>
            <p>Your content carries over. Every template is print-tested and ATS-friendly.</p>
          </div>

          <ul>
            {LAYOUTS.map((l) => (
              <li key={l.id}>
                <button
                  className="cv-gallery-item"
                  data-active={l.id === selected ? "true" : undefined}
                  onClick={() => setSelected(l.id)}
                  aria-current={l.id === selected}
                >
                  <span className="cv-gallery-item-top">
                    <b>{l.name}</b>
                    <span className="cv-tag">{l.tag}</span>
                  </span>
                  <span className="cv-gallery-item-desc">{l.desc}</span>
                  <span className="cv-gallery-item-meta">
                    {l.columns === 2 ? "Two columns" : "Single column"}
                    {l.id === applied ? " · in use" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Live preview of the selection ── */}
        <section className="cv-gallery-stage" aria-label={`${meta.name} preview`}>
          <div className="cv-gallery-stage-inner">
            <div className="cv-gallery-paper">
              {ready ? (
                <TemplatePreview layout={selected} data={data} theme={theme} />
              ) : null}
            </div>
          </div>
          <footer className="cv-gallery-stage-ft">
            <span>{meta.name}</span>
            <span className="cv-gallery-stage-note">
              Live preview with your own content · A4
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}
