"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Printer, Link2, Check, Moon, Sun } from "lucide-react";
import { TemplatePreview } from "@/components/cv-editor/template-preview";
import { DEFAULT_THEME, type CVData, type CVTheme } from "@/lib/cv-builder-types";
import { type LayoutType } from "@/lib/cv-layouts";
import { assetPath } from "@/lib/asset-path";
import { readChromeTheme, setChromeTheme } from "@/lib/chrome-theme";
import { createDocument, openDocument } from "@/lib/cv-documents";
import { withoutEmptySections } from "@/lib/cv-sections";
import {
  decodeLegacyQuery,
  decodeShare,
  readShareHash,
  LEGACY_QUERY_KEY,
} from "@/lib/cv-share";

/**
 * The read-only page a share link opens.
 *
 * Everything it renders comes out of the URL — there is no backend, and it
 * deliberately does not read the viewer's own localStorage for CV content or
 * theme. A shared CV has to look the way its author left it, not the way the
 * recipient's last editing session happened to be configured.
 *
 * It writes nothing either, until the viewer asks for a copy: opening someone
 * else's link must not disturb the résumé you have open in another tab.
 */

interface Loaded {
  /** What gets rendered: empty sections stripped. */
  data: CVData;
  /** What the link actually carried, which is what a copy should start from
   *  — an empty section the author is still working on is part of their
   *  document, even though a reader should not see the bare heading. */
  source: CVData;
  theme: CVTheme;
  layout: LayoutType;
}

type State =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "broken" }
  | { kind: "ready"; cv: Loaded };

export default function ViewPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDark(readChromeTheme());
  }, []);

  const load = useCallback(async () => {
    const encoded = readShareHash(window.location.hash);

    if (encoded) {
      const payload = await decodeShare(encoded);
      if (!payload) {
        setState({ kind: "broken" });
        return;
      }
      setState({
        kind: "ready",
        cv: {
          // A read-only link is a finished document, so sections the author
          // left empty are dropped rather than shown as bare headings.
          data: withoutEmptySections(payload.data),
          source: payload.data,
          // A link made before a theme field existed, or by a hand-edited
          // URL, still renders: the defaults fill the gaps.
          theme: { ...DEFAULT_THEME, ...(payload.theme ?? {}) },
          layout: payload.layout ?? "professional",
        },
      });
      return;
    }

    // Links the editor minted before there was a share feature put bare
    // base64 CVData in ?data= and carried no theme or layout.
    const legacy = new URLSearchParams(window.location.search).get(LEGACY_QUERY_KEY);
    if (legacy) {
      const data = decodeLegacyQuery(legacy);
      setState(
        data
          ? {
              kind: "ready",
              cv: {
                data: withoutEmptySections(data),
                source: data,
                theme: DEFAULT_THEME,
                layout: "professional",
              },
            }
          : { kind: "broken" }
      );
      return;
    }

    setState({ kind: "empty" });
  }, []);

  useEffect(() => {
    load();
    // Pasting a different link into the same tab only changes the fragment,
    // which navigates nothing — so the page has to re-read it itself.
    const onHashChange = () => {
      setState({ kind: "loading" });
      load();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [load]);

  // The tab name is the only place a viewer sees whose CV this is before it
  // paints, and it is what a bookmark keeps.
  useEffect(() => {
    if (state.kind !== "ready") return;
    const name = state.cv.data.personalInfo.fullName?.trim();
    const title = name ? `${name} — résumé` : "Résumé — opencv";

    // Applied again after paint because the router writes the route's own
    // static metadata title during commit. On a hash change this effect runs
    // later and wins on its own; on a cold load of the page it can run first
    // and be overwritten, which left the tab reading "Resume Builder".
    document.title = title;
    const frame = requestAnimationFrame(() => {
      document.title = title;
    });
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const handleEditCopy = () => {
    if (state.kind !== "ready") return;
    const { source, theme, layout } = state.cv;
    const name = source.personalInfo.fullName?.trim();
    // A copy, not a takeover: this becomes a new document in the viewer's own
    // library, leaving whatever they already had open untouched.
    const doc = createDocument({
      name: name ? `${name} — résumé (copy)` : "Shared résumé (copy)",
      layout,
      data: source,
      theme,
    });
    openDocument(doc.id);
    router.push("/editor");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied (insecure origin, or a permission prompt the
      // viewer dismissed). The URL is in the address bar either way.
    }
  };

  const toggleTheme = () => {
    setDark((d) => {
      setChromeTheme(!d);
      return !d;
    });
  };

  return (
    <div className="cv-app cv-view" data-cv-density="comfortable">
      <header className="cv-bar" role="banner">
        <div className="cv-bar-zone left">
          <div className="cv-brand">
            <Link className="cv-brand-mark" href="/" aria-label="opencv">
              <img className="mark-light" src={assetPath("/brand/logo-mark.png")} alt="" />
              <img className="mark-dark" src={assetPath("/brand/logo-mark-inverted.png")} alt="" />
            </Link>
            <div className="cv-brand-name">
              open<b>cv</b>
            </div>
            {state.kind === "ready" && (
              <div className="cv-doc-name">
                <span className="slash">/</span>
                <b>{state.cv.data.personalInfo.fullName?.trim() || "Résumé"}</b>
              </div>
            )}
          </div>
        </div>

        <div className="cv-bar-zone center">
          {state.kind === "ready" && <span className="cv-view-badge">Read-only</span>}
        </div>

        <div className="cv-bar-zone right">
          <button
            className="cv-iconbtn cv-tip"
            data-tip={dark ? "Light" : "Dark"}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleTheme}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {state.kind === "ready" && (
            <>
              <button className="cv-btn" onClick={handleCopyLink}>
                {copied ? <Check size={15} /> : <Link2 size={15} />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button className="cv-btn" onClick={() => window.print()}>
                <Printer size={15} />
                Print
              </button>
              <button className="cv-btn cv-btn-primary" onClick={handleEditCopy}>
                <Pencil size={15} />
                Edit a copy
              </button>
            </>
          )}
        </div>
      </header>

      <main className="cv-desk" data-canvas="soft">
        <NoScriptNotice />
        {state.kind === "ready" ? (
          <div className="cv-paper-wrap">
            <div
              className="cv-view-paper"
              style={{ background: state.cv.theme.backgroundColor }}
            >
              <TemplatePreview
                asDocument
                layout={state.cv.layout}
                data={state.cv.data}
                theme={state.cv.theme}
              />
            </div>
          </div>
        ) : (
          <ViewMessage kind={state.kind} />
        )}
      </main>
    </div>
  );
}

/**
 * What this page says when it cannot run.
 *
 * A share link carries the résumé in the URL fragment, which the browser
 * never sends to the server, and the page decodes it client-side. So without
 * JavaScript there is genuinely nothing to show: the server was never told
 * which résumé was asked for, and could not have answered if it had been.
 *
 * That is the design working as intended — it is what keeps a résumé out of
 * access logs — but the failure mode is a blank page, which reads as a dead
 * link. This says what happened instead.
 *
 * It is also the only thing a non-JavaScript reader ever sees: a screening
 * bot, a link unfurler, or an agent told to fetch the URL. The last
 * paragraph is for them, and costs a human nothing — so it says where the
 * data actually is, given they are already holding it.
 */
function NoScriptNotice() {
  return (
    <noscript>
      {/* The bar's theme toggle needs JavaScript, and a control that does
          nothing is worse than no control. */}
      <style>{`.cv-view .cv-bar-zone.right { display: none; }`}</style>
      <div className="cv-view-msg cv-view-noscript">
        <h1>This résumé needs JavaScript</h1>
        <p>
          The whole document lives inside this link, after the <code>#</code> — nothing
          is stored on a server. Decoding it happens in your browser, so with
          scripts turned off there is nothing to display.
        </p>
        <p>
          Enable JavaScript for this page, or ask whoever sent the link for a PDF.
        </p>
        <p className="cv-view-noscript-machine">
          Reading this without a browser? The résumé is in the URL fragment as{" "}
          <code>#cv=z.&lt;base64url&gt;</code> — raw-deflated JSON holding a{" "}
          <a href="https://jsonresume.org/schema">JSON Resume</a>-compatible document.
          The fragment never reaches the server, so fetching this URL can never return
          the content; decode it from the link you already have.
        </p>
      </div>
    </noscript>
  );
}

function ViewMessage({ kind }: { kind: "loading" | "empty" | "broken" }) {
  if (kind === "loading") {
    // Deliberately quiet: decoding is a decompress and a JSON parse, so this
    // is a frame or two and a spinner would only flash.
    return <div className="cv-view-msg" aria-live="polite" />;
  }

  return (
    <div className="cv-view-msg">
      <h1>{kind === "empty" ? "Nothing to show" : "This link is broken"}</h1>
      <p>
        {kind === "empty"
          ? "A share link carries the whole résumé in the URL. This one arrived without it — if it was copied by hand, check that nothing after the # was cut off."
          : "The résumé in this link could not be read. Links are long, and most often the end has been clipped by whatever passed it along — ask for it again as a plain URL."}
      </p>
      <Link className="cv-btn cv-btn-primary" href="/">
        Build your own
      </Link>
    </div>
  );
}
