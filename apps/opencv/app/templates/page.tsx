"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sun, Moon } from "lucide-react";
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
import { ConfirmDelete } from "@/components/cv-editor/confirm-delete";
import { assetPath } from "@/lib/asset-path";
import { initChromeTheme, setChromeTheme } from "@/lib/chrome-theme";

/** A filled-in résumé, so a template can be judged on real content. */
const SAMPLE: CVData =
  starterTemplates.find((t) => t.id === "professional")?.data ?? starterTemplates[0].data;

/** The same document with nothing written in it — headings and placeholders. */
const BLANK: CVData =
  starterTemplates.find((t) => t.id === "blank")?.data ?? starterTemplates[0].data;

export default function TemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<LayoutType>("professional");
  const [applied, setApplied] = useState<LayoutType>("professional");
  const [data, setData] = useState<CVData>(SAMPLE);
  /** True when this visit will create a document rather than restyle one. */
  const [creating, setCreating] = useState(false);
  /** Only meaningful while creating: start from the sample, or from a blank. */
  const [keepSample, setKeepSample] = useState(true);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [theme, setTheme] = useState<CVTheme>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  // The shell theme lives on <html>; this route sets it too so the gallery
  // matches the editor instead of flashing the light default.
  const [dark, setDark] = useState(true);

  // Read the saved document so every preview shows the user's own content.
  useEffect(() => {
    try {
      setDark(initChromeTheme());
      // With a document open this page only restyles it, so it previews that
      // document. With nothing open it is the create step, and the preview
      // follows the sample/blank choice instead.
      const open = !!activeDocumentId();
      setCreating(!open);
      // Creating: the sample is the obvious starting point. Restyling an
      // existing résumé: taking the sample would discard it, so opt in.
      setKeepSample(!open);
      const savedData = localStorage.getItem(DATA_STORAGE_KEY);
      if (open && savedData) {
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
  // Always preview the sample. Judging a template against a sparse document
  // tells you nothing about it, so the preview shows the design filled in and
  // the toggle below decides whether that content comes with it.
  const previewData = SAMPLE;
  /** Whether opting in would actually destroy something. A document still
   *  carrying the blank starter's placeholders has nothing to lose — and its
   *  placeholders are non-empty strings, so "is it filled in?" has to mean
   *  "does it differ from the blank?", not "is it truthy?". */
  const hasOwnContent =
    !creating &&
    (data.experience.length > 0 ||
      data.education.length > 0 ||
      data.skills.length > 0 ||
      (data.awards?.length ?? 0) > 0 ||
      data.personalInfo.fullName !== BLANK.personalInfo.fullName ||
      data.personalInfo.summary !== BLANK.personalInfo.summary);

  const use = () => {
    // Overwriting a real document with the sample is destructive, so ask.
    if (keepSample && hasOwnContent && !confirmingReplace) {
      setConfirmingReplace(true);
      return;
    }
    setConfirmingReplace(false);
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, selected);
    } catch {}
    // Switching template on an open document just restyles it; arriving here
    // with nothing open (straight from the dashboard's "Pick a template")
    // means this is where the document gets created.
    if (!creating) {
      syncActiveDocument({ data: keepSample ? SAMPLE : data, theme, layout: selected });
      // The editor reads the open-document buffer, not the library row, and
      // writes the buffer back on mount — so updating only the row would be
      // immediately overwritten by the stale buffer. Re-open to load it.
      const openId = activeDocumentId();
      if (keepSample && openId) openDocument(openId);
    } else {
      const doc = createDocument({
        name: keepSample ? `${meta.name} résumé` : "Untitled résumé",
        layout: selected,
        data: keepSample ? SAMPLE : BLANK,
        theme,
      });
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
          src={assetPath(dark ? "/brand/logo-inverted.png" : "/brand/logo.png")}
          alt="openCV — Open Source CV Builder"
        />
        <div className="cv-gallery-bar-end">
          <label className="cv-keep-sample" title={creating
            ? "Start this résumé from the sample content shown"
            : "Replace your current content with the sample shown"}>
            <input
              type="checkbox"
              checked={keepSample}
              onChange={(e) => setKeepSample(e.target.checked)}
            />
            Keep sample content
          </label>
          <button
            className="cv-iconbtn"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            onClick={() => { const next = !dark; setDark(next); setChromeTheme(next); }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="cv-btn cv-btn-primary" onClick={use} disabled={!ready}>
            {selected === applied ? <Check size={15} /> : null}
            Use {meta.name}
          </button>
        </div>
      </header>

      {confirmingReplace && (
        <ConfirmDelete
          label="your résumé content"
          lost={null}
          recoverable={false}
          title="Replace your content with the sample?"
          body={`Your current résumé${
            data.experience.length
              ? ` — including ${data.experience.length} experience ${
                  data.experience.length === 1 ? "entry" : "entries"
                } —`
              : ""
          } will be replaced by the sample shown. This cannot be undone.`}
          confirmLabel="Replace content"
          onCancel={() => setConfirmingReplace(false)}
          onConfirm={use}
        />
      )}

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
                <TemplatePreview layout={selected} data={previewData} theme={theme} />
              ) : null}
            </div>
          </div>
          <footer className="cv-gallery-stage-ft">
            <span>{meta.name}</span>
            <span className="cv-gallery-stage-note">
              {keepSample
                ? "Sample content · you will keep it · A4"
                : creating
                  ? "Sample content · you will start with empty placeholders · A4"
                  : "Sample content · your own résumé is kept · A4"}
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}
