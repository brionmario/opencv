"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Eye,
  EyeOff,
  XCircle,
} from "lucide-react";
import type { AtsCheck, AtsGroup, AtsReport, AtsSeverity } from "@/lib/cv-ats";
import { ATS_GROUP_LABELS, atsVerdict, bySeverity } from "@/lib/cv-ats";

export interface AtsPanelProps {
  report: AtsReport;
  /** Selects the section a finding is about, so the page scrolls to it. */
  onSelectSection: (id: string) => void;
  /** Mints the prompt, which needs a share link and so has to be async. */
  buildPrompt: (targetRole: string, jobDescription: string) => Promise<string>;
  /** Reported through the app's toasts rather than inside the panel. */
  onNotify: (message: string) => void;
}

const VERDICT_LABEL = {
  strong: "Reads cleanly",
  fair: "Some risk",
  weak: "Likely to be misread",
} as const;

const GROUPS: AtsGroup[] = ["contact", "structure", "content", "formatting"];

function SeverityIcon({ severity }: { severity: AtsSeverity }) {
  if (severity === "fail") return <XCircle size={14} />;
  if (severity === "warn") return <AlertTriangle size={14} />;
  return <Check size={14} />;
}

/** The ring. A number alone reads as a grade; the arc reads as a gauge. */
function ScoreDial({ score }: { score: number }) {
  const verdict = atsVerdict(score);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="cv-ats-dial" data-verdict={verdict}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={r} className="cv-ats-dial-track" />
        <circle
          cx="36"
          cy="36"
          r={r}
          className="cv-ats-dial-arc"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
        />
      </svg>
      <b>{score}</b>
    </div>
  );
}

function Finding({
  check,
  onSelectSection,
}: {
  check: AtsCheck;
  onSelectSection: (id: string) => void;
}) {
  const clickable = Boolean(check.sectionId);
  return (
    <li className="cv-ats-row" data-severity={check.severity}>
      <span className="cv-ats-row-ic" aria-hidden="true">
        <SeverityIcon severity={check.severity} />
      </span>
      <div className="cv-ats-row-txt">
        <p className="cv-ats-row-hd">
          {clickable ? (
            <button
              type="button"
              className="cv-ats-row-jump"
              onClick={() => onSelectSection(check.sectionId as string)}
            >
              {check.label}
              <ChevronRight size={12} />
            </button>
          ) : (
            <b>{check.label}</b>
          )}
        </p>
        <p className="cv-ats-row-detail">{check.detail}</p>
        {check.fix && <p className="cv-ats-row-fix">{check.fix}</p>}
      </div>
    </li>
  );
}

export function AtsPanel({ report, onSelectSection, buildPrompt, onNotify }: AtsPanelProps) {
  const [showPassing, setShowPassing] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  // A built prompt is a snapshot: it embeds the document itself. Rather than
  // let one sit on screen after the résumé moves under it, the snapshot
  // remembers which buildPrompt it came from and stops being shown once that
  // is no longer the current one.
  const [preview, setPreview] = useState<{ from: AtsPanelProps["buildPrompt"]; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const shownPrompt = preview && preview.from === buildPrompt ? preview.text : null;

  const flagged = bySeverity(report.checks).filter((c) => c.severity !== "pass");
  const passing = report.checks.filter((c) => c.severity === "pass");
  const verdict = atsVerdict(report.score);

  const copyPrompt = async () => {
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

  const togglePreview = async () => {
    if (shownPrompt) {
      setPreview(null);
      return;
    }
    setBusy(true);
    try {
      setPreview({ from: buildPrompt, text: await buildPrompt(targetRole.trim(), jobDescription.trim()) });
    } catch {
      onNotify("Could not build the prompt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cv-ats">
      <div className="cv-ats-head">
        <ScoreDial score={report.score} />
        <div className="cv-ats-head-txt">
          <b data-verdict={verdict}>{VERDICT_LABEL[verdict]}</b>
          <span>
            {report.counts.fail} failing · {report.counts.warn} warnings ·{" "}
            {report.counts.pass} passing
          </span>
        </div>
      </div>

      <p className="cv-ats-note">
        A static check of the document: headings, dates, keywords, columns. It cannot see
        the job you are applying for, so the score is a readability floor, not a verdict.
      </p>

      {flagged.length === 0 ? (
        <div className="cv-ats-clear">
          <Check size={16} />
          <p>Every mechanical check passes. What is left is substance, and that is what the prompt below is for.</p>
        </div>
      ) : (
        GROUPS.map((group) => {
          const inGroup = flagged.filter((c) => c.group === group);
          if (inGroup.length === 0) return null;
          return (
            <section key={group} className="cv-ats-group">
              <h4>{ATS_GROUP_LABELS[group]}</h4>
              <ul>
                {inGroup.map((check) => (
                  <Finding key={check.id} check={check} onSelectSection={onSelectSection} />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {passing.length > 0 && (
        <section className="cv-ats-group">
          <button
            type="button"
            className="cv-ats-disclose"
            onClick={() => setShowPassing((v) => !v)}
            aria-expanded={showPassing}
          >
            {showPassing ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {passing.length} passing
          </button>
          {showPassing && (
            <ul>
              {passing.map((check) => (
                <Finding key={check.id} check={check} onSelectSection={onSelectSection} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Handoff ───────────────────────────────────────────────────────── */}
      <section className="cv-ats-handoff">
        <h4>Have an agent check the rest</h4>
        <p>
          The prompt below carries a read-only link to this résumé. The link <i>is</i> the
          document, so an agent with the opencv MCP server reads it with one call, and an
          agent with a browser just opens it. Nothing to upload.
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
            rows={4}
            value={jobDescription}
            placeholder="Paste the posting. This is the part a static check cannot stand in for."
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </label>

        <div className="cv-ats-actions">
          <button
            type="button"
            className="cv-btn cv-btn-primary"
            onClick={copyPrompt}
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

        {shownPrompt && <pre className="cv-ats-preview">{shownPrompt}</pre>}
      </section>
    </div>
  );
}
