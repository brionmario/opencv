"use client";

import { useState } from "react";
import { Clipboard, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  ChatGptMark,
  ClaudeMark,
  GeminiMark,
  PerplexityMark,
} from "@/components/cv-builder/brand-marks";

export interface AskAiPanelProps {
  /** Mints the prompt, which needs a share link and so has to be async. */
  buildPrompt: (targetRole: string, jobDescription: string) => Promise<string>;
  /** Reported through the app's toasts rather than inside the panel. */
  onNotify: (message: string) => void;
}

/**
 * Where to send the prompt.
 *
 * `prefill` puts the prompt straight into the composer, so the usual case is
 * one click and the question is already asked. Gemini has no such parameter,
 * so it opens plain.
 *
 * Every path copies to the clipboard first regardless. A prefilled URL is a
 * request like any other, and a request line has a length limit: the prompt
 * carries a share link, the link carries the whole résumé, and a document
 * with a photo in it can push the URL past what a server will accept. When
 * that happens the service is opened plain rather than handed a URL that
 * would 414, and the prompt is already on the clipboard either way. The one
 * outcome worth engineering against is a link that arrives clipped, because
 * a clipped share link decodes to nothing and the agent would then review a
 * résumé it never read while sounding just as sure as if it had.
 *
 * Each carries its own mark, drawn in the service's colour, so the button is
 * recognisable before the label is read. The marks label a link to that
 * service and claim nothing beyond it.
 */
const SERVICES = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    prefill: (p: string) => `https://chatgpt.com/?prompt=${encodeURIComponent(p)}`,
    tint: "#0da37f",
    Mark: ChatGptMark,
  },
  {
    id: "claude",
    name: "Claude",
    url: "https://claude.ai/new",
    prefill: (p: string) => `https://claude.ai/new?q=${encodeURIComponent(p)}`,
    tint: "#d97757",
    Mark: ClaudeMark,
  },
  {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com/app",
    prefill: null,
    tint: "#4285f4",
    Mark: GeminiMark,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    url: "https://www.perplexity.ai/",
    prefill: (p: string) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`,
    tint: "#20b8cd",
    Mark: PerplexityMark,
  },
] as const;

/**
 * The longest URL worth sending.
 *
 * Measured rather than guessed: a filled résumé with no photo and a typical
 * posting comes to a 7.7K prompt and a 9.9K URL, most of which is the share
 * link. An 8K cap, which is where a bare nginx stops reading a request line,
 * would therefore refuse to prefill in the ordinary case, which defeats the
 * point. 16K sits inside the 32K a URL is allowed through the CDNs these
 * services run behind, and still catches the case worth catching: a résumé
 * with a photo embedded, where the link alone runs past 50K.
 *
 * Over the cap the tab opens empty and the prompt is on the clipboard, so
 * the cost of being wrong in either direction is one paste.
 */
const URL_LIMIT = 16000;

export function AskAiPanel({ buildPrompt, onNotify }: AskAiPanelProps) {
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  // A built prompt is a snapshot: it embeds the document itself. Rather than
  // let one sit on screen after the résumé moves under it, the snapshot
  // remembers which buildPrompt it came from and stops being shown once that
  // is no longer the current one.
  const [preview, setPreview] = useState<{
    from: AskAiPanelProps["buildPrompt"];
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const shownPrompt = preview && preview.from === buildPrompt ? preview.text : null;

  // Nothing is sendable until there is a role and a posting to send it
  // against. The static check already covers the document on its own; what
  // this panel adds is the comparison, and a review with nothing to compare
  // to is the generic résumé advice that is already all over the internet.
  const ready = targetRole.trim() !== "" && jobDescription.trim() !== "";
  const blocked = busy || !ready;

  const handleCopy = async () => {
    setBusy(true);
    try {
      const prompt = await buildPrompt(targetRole.trim(), jobDescription.trim());
      await navigator.clipboard.writeText(prompt);
      onNotify("Review prompt copied, résumé link included");
    } catch {
      onNotify("Could not copy the prompt: clipboard access was refused");
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async (service: (typeof SERVICES)[number]) => {
    setBusy(true);
    try {
      const prompt = await buildPrompt(targetRole.trim(), jobDescription.trim());

      // Best effort, and never a reason not to open the tab: a refused
      // clipboard should not cost the user the prefill as well.
      let copied = true;
      try {
        await navigator.clipboard.writeText(prompt);
      } catch {
        copied = false;
      }

      const prefilled = service.prefill?.(prompt);
      const sendable = prefilled && prefilled.length <= URL_LIMIT ? prefilled : null;
      window.open(sendable ?? service.url, "_blank", "noopener,noreferrer");

      onNotify(
        sendable
          ? `Asked in ${service.name}.`
          : copied
            ? `Prompt copied. Paste it into ${service.name}.`
            : `Opened ${service.name}, but the prompt could not be copied. Use Copy prompt and paste it.`
      );
    } catch {
      onNotify(`Could not build the prompt for ${service.name}`);
    } finally {
      setBusy(false);
    }
  };

  const togglePreview = async () => {
    if (shownPrompt) {
      setPreview(null);
      return;
    }
    setBusy(true);
    try {
      setPreview({
        from: buildPrompt,
        text: await buildPrompt(targetRole.trim(), jobDescription.trim()),
      });
    } catch {
      onNotify("Could not build the prompt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cv-ask">
      <p className="cv-ask-note">
        A static check reads the document. It cannot read the job you are applying for.
        This writes the prompt for that, with a read-only link to this résumé inside it:
        the link <i>is</i> the document, so an agent reads the real thing rather than a
        description of it. Nothing to upload.
      </p>

      <label className="cv-ats-field">
        <span>Target role<i aria-hidden="true">required</i></span>
        <input
          type="text"
          value={targetRole}
          placeholder="Senior Backend Engineer"
          onChange={(e) => setTargetRole(e.target.value)}
        />
      </label>

      <label className="cv-ats-field">
        <span>Job description<i aria-hidden="true">required</i></span>
        <textarea
          rows={5}
          value={jobDescription}
          placeholder="Paste the posting. This is the part a static check cannot stand in for."
          required
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </label>

      {!ready && (
        <p className="cv-ask-gate">
          Add the role and paste the posting to enable the buttons below.
        </p>
      )}

      <div className="cv-ats-actions">
        <button
          type="button"
          className="cv-btn cv-btn-primary"
          onClick={handleCopy}
          disabled={blocked}
        >
          <Clipboard size={14} />
          Copy prompt
        </button>
        <button type="button" className="cv-btn" onClick={togglePreview} disabled={blocked}>
          {shownPrompt ? <EyeOff size={14} /> : <Eye size={14} />}
          {shownPrompt ? "Hide" : "Preview"}
        </button>
      </div>

      <section className="cv-ask-services">
        <h4>Open in</h4>
        <div className="cv-ask-grid">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              type="button"
              className="cv-ask-service"
              onClick={() => handleOpen(service)}
              disabled={blocked}
            >
              <span className="cv-ask-mark" style={{ color: service.tint }}>
                <service.Mark size={15} />
              </span>
              {service.name}
              <ExternalLink size={12} />
            </button>
          ))}
        </div>
        <p className="cv-ask-hint">
          Each opens a new chat with the prompt already asked, and copies it as well.
          Gemini has no way to prefill a chat, and a résumé carrying a photo can outgrow
          what a URL will hold; in either case the tab opens empty and the prompt is on
          your clipboard.
        </p>
      </section>

      {shownPrompt && <pre className="cv-ats-preview">{shownPrompt}</pre>}
    </div>
  );
}
