"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, FileText, Home, Trash2, Copy, Pencil, LayoutTemplate,
  Linkedin, LayoutGrid, Rows3, Undo2, Clock, Sun, Moon,
} from "lucide-react";
import { starterTemplates } from "@/lib/starter-templates";
import { TemplatePreview } from "@/components/cv-editor/template-preview";
import {
  listDocuments, deletedDocuments, migrateLegacyDocument, openDocument,
  createDocument, duplicateDocument, deleteDocument, restoreDocument,
  purgeDocument, renameDocument, relativeTime, type CVDocument,
} from "@/lib/cv-documents";
import { layoutMeta } from "@/lib/cv-layouts";
import { initChromeTheme, setChromeTheme } from "@/lib/chrome-theme";
import { assetPath } from "@/lib/asset-path";

type View = "home" | "files" | "deleted";
type Density = "grid" | "list";

export function Dashboard() {
  const router = useRouter();
  const [docs, setDocs] = useState<CVDocument[]>([]);
  const [trash, setTrash] = useState<CVDocument[]>([]);
  const [view, setView] = useState<View>("home");
  const [density, setDensity] = useState<Density>("grid");
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setDocs(listDocuments());
    setTrash(deletedDocuments());
  }, []);

  useEffect(() => {
    setDark(initChromeTheme());

    // An existing single-document user keeps their work: it becomes doc one.
    migrateLegacyDocument();
    refresh();
    setReady(true);
  }, [refresh]);

  const open = (id: string) => {
    openDocument(id);
    router.push("/editor");
  };

  const createBlank = () => {
    const starter = starterTemplates.find((t) => t.id === "blank") ?? starterTemplates[0];
    const doc = createDocument({ name: "Untitled résumé", layout: starter.defaultLayout, data: starter.data });
    open(doc.id);
  };

  const createFromSample = () => {
    const starter = starterTemplates[0];
    const doc = createDocument({ name: "New résumé", layout: starter.defaultLayout, data: starter.data });
    open(doc.id);
  };

  const shown = view === "deleted" ? trash : docs;

  return (
    <div className="cv-home">
      {/* ── Title bar ── */}
      <header className="cv-home-bar">
        <img
          className="cv-home-logo"
          src={assetPath(dark ? "/brand/logo-inverted.png" : "/brand/logo.png")}
          alt="openCV — Open Source CV Builder"
        />
        <button
          className="cv-iconbtn cv-home-theme"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
          onClick={() => { const next = !dark; setDark(next); setChromeTheme(next); }}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      <div className="cv-home-body">
        {/* ── Sidebar ── */}
        <aside className="cv-home-side">
          <button className="cv-btn cv-btn-primary cv-home-new" onClick={createBlank}>
            <Plus size={15} />
            New résumé
          </button>
          <Link className="cv-btn cv-btn-ghost cv-home-open" href="/templates">
            Browse templates
          </Link>

          <nav className="cv-home-nav" aria-label="Sections">
            <button data-active={view === "home" || undefined} onClick={() => setView("home")}>
              <Home size={15} /> Home
            </button>
            <button data-active={view === "files" || undefined} onClick={() => setView("files")}>
              <FileText size={15} /> Your résumés
              <span className="cv-home-count">{docs.length}</span>
            </button>
            <span className="cv-home-nav-label">Library</span>
            <button data-active={view === "deleted" || undefined} onClick={() => setView("deleted")}>
              <Trash2 size={15} /> Deleted
              {trash.length > 0 && <span className="cv-home-count">{trash.length}</span>}
            </button>
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="cv-home-main">
          {view === "home" && (
            <section
              className="cv-home-hero"
              style={{ backgroundImage: `url(${assetPath("/brand/home-banner.jpg")})` }}
            >
              <div className="cv-home-hero-text">
                <span className="cv-home-hero-eyebrow">Open source · no account</span>
                <h1>What you see is what prints.</h1>
                <p>
                  Four print-tested templates, a live layout editor, and exports
                  measured against the page — not approximated from it.
                </p>
                <div className="cv-home-hero-actions">
                  <button className="cv-btn cv-btn-primary" onClick={createBlank}>
                    <Plus size={15} />
                    New résumé
                  </button>
                  <Link className="cv-btn" href="/templates">
                    Browse templates
                  </Link>
                </div>
              </div>
            </section>
          )}

          {view === "home" && (
            <section className="cv-home-start">
              <h2>What do you want to create?</h2>
              <div className="cv-home-cards">
                <button className="cv-home-card" onClick={createBlank}>
                  <span className="cv-home-card-art"><Plus size={22} /></span>
                  <b>Blank résumé</b>
                  <span>Start from an empty page and fill it in.</span>
                </button>
                <button className="cv-home-card" onClick={createFromSample}>
                  <span className="cv-home-card-art"><FileText size={22} /></span>
                  <b>From a sample</b>
                  <span>A filled-in résumé you can edit down.</span>
                </button>
                <Link className="cv-home-card" href="/templates">
                  <span className="cv-home-card-art"><LayoutTemplate size={22} /></span>
                  <b>Pick a template</b>
                  <span>Compare all four side by side, then start.</span>
                </Link>
                <button className="cv-home-card" onClick={createBlank}>
                  <span className="cv-home-card-art"><Linkedin size={22} /></span>
                  <b>Import from LinkedIn</b>
                  <span>Paste a profile and let it fill the page.</span>
                </button>
              </div>
            </section>
          )}

          <section className="cv-home-recent">
            <div className="cv-home-recent-hd">
              <h2>
                {view === "deleted" ? "Deleted" : view === "files" ? "Your résumés" : "Recent"}
              </h2>
              {view !== "deleted" && (
                <div className="cv-home-view" role="group" aria-label="Layout">
                  <button
                    aria-label="Grid"
                    data-active={density === "grid" || undefined}
                    onClick={() => setDensity("grid")}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    aria-label="List"
                    data-active={density === "list" || undefined}
                    onClick={() => setDensity("list")}
                  >
                    <Rows3 size={14} />
                  </button>
                </div>
              )}
            </div>

            {!ready ? null : shown.length === 0 ? (
              <p className="cv-home-empty">
                {view === "deleted"
                  ? "Nothing deleted."
                  : "No résumés yet — create one above and it will show up here."}
              </p>
            ) : density === "list" || view === "deleted" ? (
              <table className="cv-home-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Template</th>
                    <th>{view === "deleted" ? "Deleted" : "Last edit"}</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <FileText size={14} />
                        {d.name}
                      </td>
                      <td>{layoutMeta(d.layout).name}</td>
                      <td>{relativeTime(view === "deleted" ? d.deletedAt ?? d.updatedAt : d.updatedAt)}</td>
                      <td className="cv-home-row-actions">
                        {view === "deleted" ? (
                          <>
                            <button className="cv-iconbtn" title="Restore" onClick={() => { restoreDocument(d.id); refresh(); }}>
                              <Undo2 size={15} />
                            </button>
                            <button className="cv-iconbtn" title="Delete for good" onClick={() => { purgeDocument(d.id); refresh(); }}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="cv-btn cv-btn-sm" onClick={() => open(d.id)}>Open</button>
                            <button className="cv-iconbtn" title="Duplicate" onClick={() => { duplicateDocument(d.id); refresh(); }}>
                              <Copy size={15} />
                            </button>
                            <button className="cv-iconbtn" title="Delete" onClick={() => { deleteDocument(d.id); refresh(); }}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ul className="cv-home-grid">
                {shown.map((d) => (
                  <li key={d.id} className="cv-home-doc">
                    {/* The preview renders a real template, which contains its
                        own buttons — so the hit target is an overlay sibling
                        rather than a wrapping <button>, which would nest
                        interactive elements and break hydration. */}
                    <div className="cv-home-thumb">
                      <TemplatePreview layout={d.layout} data={d.data} theme={d.theme} />
                      <button
                        className="cv-home-thumb-hit"
                        onClick={() => open(d.id)}
                        aria-label={`Open ${d.name}`}
                      />
                    </div>
                    <div className="cv-home-doc-meta">
                      {renaming === d.id ? (
                        <input
                          className="cv-home-rename"
                          defaultValue={d.name}
                          autoFocus
                          onBlur={(e) => { renameDocument(d.id, e.target.value); setRenaming(null); refresh(); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setRenaming(null);
                          }}
                        />
                      ) : (
                        <b title={d.name}>{d.name}</b>
                      )}
                      <span>
                        {layoutMeta(d.layout).name}
                        <span className="cv-home-dot">·</span>
                        <Clock size={11} />
                        {relativeTime(d.updatedAt)}
                      </span>
                    </div>
                    <div className="cv-home-doc-actions">
                      <button className="cv-iconbtn" title="Rename" onClick={() => setRenaming(d.id)}>
                        <Pencil size={14} />
                      </button>
                      <button className="cv-iconbtn" title="Duplicate" onClick={() => { duplicateDocument(d.id); refresh(); }}>
                        <Copy size={14} />
                      </button>
                      <button className="cv-iconbtn" title="Delete" onClick={() => { deleteDocument(d.id); refresh(); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
