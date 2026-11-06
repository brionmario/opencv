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
 * Each entry is the service's own new-chat page and nothing more. There is
 * no prefill: the prompt carries a share link, which carries the whole
 * résumé, and that runs to several KB. Services that accept a `?q=`
 * truncate it well before that, and a truncated share link is not a short
 * link, it is a broken one that decodes to nothing. The agent would then
 * review a résumé it never read, which is the one outcome worse than an
 * extra paste. So the prompt goes via the clipboard, every time, and the
 * button opens a tab to paste it into.
 *
 * Each carries its own mark, drawn in the service's colour, so the button
 * is recognisable before the label is read. The marks label a link to that
 * service and claim nothing beyond it.
 */
const SERVICES = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/", tint: "#0da37f", Mark: ChatGptMark },
  { id: "claude", name: "Claude", url: "https://claude.ai/new", tint: "#d97757", Mark: ClaudeMark },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app", tint: "#4285f4", Mark: GeminiMark },
  { id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/", tint: "#20b8cd", Mark: PerplexityMark },
] as const;

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

  /** Builds and copies. Returns false when nothing reached the clipboard. */
  const copyPrompt = async (): Promise<boolean> => {
    const prompt = await buildPrompt(targetRole.trim(), jobDescription.trim());
    await navigator.clipboard.writeText(prompt);
    return true;
  };

  const handleCopy = async () => {
    setBusy(true);
    try {
      await copyPrompt();
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
      await copyPrompt();
      // The copy is the part that must succeed; the tab is a convenience. If
      // a popup blocker eats it, the prompt is still on the clipboard and the
      // toast says so, so nothing is lost.
      window.open(service.url, "_blank", "noopener,noreferrer");
      onNotify(`Prompt copied. Paste it into ${service.name}.`);
    } catch {
      onNotify("Could not copy the prompt: clipboard access was refused");
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
        <span>Target role</span>
        <input
          type="text"
          value={targetRole}
          placeholder="Senior Backend Engineer"
          onChange={(e) => setTargetRole(e.target.value)}
        />
      </label>

      <label className="cv-ats-field">
        <span>Job description (optional)</span>
        <textarea
          rows={5}
          value={jobDescription}
          placeholder="Paste the posting. This is the part a static check cannot stand in for."
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </label>

      <div className="cv-ats-actions">
        <button
          type="button"
          className="cv-btn cv-btn-primary"
          onClick={handleCopy}
          disabled={busy}
        >
          <Clipboard size={14} />
          Copy prompt
        </button>
        <button type="button" className="cv-btn" onClick={togglePreview} disabled={busy}>
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
              disabled={busy}
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
          Each of these copies the prompt and opens a new chat for you to paste it into.
          The prompt carries the whole résumé, which is far longer than a URL will hold
          intact, so it travels on the clipboard rather than in the link.
        </p>
      </section>

      {shownPrompt && <pre className="cv-ats-preview">{shownPrompt}</pre>}
    </div>
  );
}
