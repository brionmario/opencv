"use client";

import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { SECTION_LABELS, BUILT_IN_SECTION_IDS } from "@/lib/cv-builder-types";
import { getEffectiveSectionOrder } from "@/lib/cv-sections";

export interface SectionPickerProps {
  data: CVData;
  onAddBuiltIn: (id: string) => void;
  onAddCustom: (title: string) => void;
  onClose: () => void;
}

/** A one-line description per section, so the cards say what you get.
 *  Keyed loosely: entries for section types that are not registered yet are
 *  simply unused, and the grid itself is driven by BUILT_IN_SECTION_IDS so it
 *  only ever offers sections the templates can actually render. */
const BLURBS: Record<string, string> = {
  summary: "A short opening paragraph about you.",
  experience: "Roles, dates and what you achieved in each.",
  education: "Degrees, schools and results.",
  skills: "A compact grid of tools and competencies.",
  awards: "Recognitions, prizes and standout results.",
  publications: "Papers and articles, with links.",
  references: "Named referees with contact details.",
  socialLinks: "Profiles and portfolio links.",
  languages: "Languages with a proficiency rating.",
  projects: "Personal or professional projects.",
  certifications: "Credentials and the bodies that issued them.",
  volunteering: "Unpaid work and community roles.",
  strengths: "Short, punchy statements of what you bring.",
  interests: "A human touch, kept brief.",
};

/** A tiny abstract rendering of each section's shape on the page. */
function Thumb({ id }: { id: string }) {
  const bars = (() => {
    switch (id) {
      case "skills":      return "chips";
      case "languages":   return "rated";
      case "strengths":
      case "interests":   return "chips";
      case "summary":     return "para";
      default:            return "entries";
    }
  })();

  return (
    <span className="cv-pick-thumb" aria-hidden="true">
      <span className="cv-pick-thumb-head" />
      {bars === "para" && (
        <>
          <span className="cv-pick-line" style={{ width: "100%" }} />
          <span className="cv-pick-line" style={{ width: "92%" }} />
          <span className="cv-pick-line" style={{ width: "70%" }} />
        </>
      )}
      {bars === "chips" && (
        <span className="cv-pick-chips">
          {[34, 26, 30, 22, 38, 24].map((w, i) => (
            <span key={i} style={{ width: w }} />
          ))}
        </span>
      )}
      {bars === "rated" && (
        <>
          {[0, 1].map((i) => (
            <span key={i} className="cv-pick-rated">
              <span className="cv-pick-line" style={{ width: "44%" }} />
              <span className="cv-pick-dots">{[0, 1, 2, 3, 4].map((d) => <i key={d} data-on={d < 3 - i ? "true" : undefined} />)}</span>
            </span>
          ))}
        </>
      )}
      {bars === "entries" && (
        <>
          {[0, 1].map((i) => (
            <span key={i} className="cv-pick-entry">
              <span className="cv-pick-line strong" style={{ width: "58%" }} />
              <span className="cv-pick-line accent" style={{ width: "38%" }} />
              <span className="cv-pick-line" style={{ width: "88%" }} />
            </span>
          ))}
        </>
      )}
    </span>
  );
}

export function SectionPicker({ data, onAddBuiltIn, onAddCustom, onClose }: SectionPickerProps) {
  const [customTitle, setCustomTitle] = useState("");
  const order = getEffectiveSectionOrder(data);
  const onPage = new Set(order.filter((s) => !s.hidden).map((s) => s.id));

  // Every built-in type the templates can render. One that is already on the
  // page stays listed and is marked "on résumé" rather than disappearing, so
  // the catalogue is stable and you can see what exists.
  const builtIns = BUILT_IN_SECTION_IDS.filter((id) => SECTION_LABELS[id]);

  return (
    <div className="cv-modal-scrim" role="dialog" aria-modal="true" aria-label="Add a section" onClick={onClose}>
      <div className="cv-modal cv-pick" onClick={(e) => e.stopPropagation()}>
        <div className="cv-modal-hd">
          <h2>Add a section</h2>
          <p>Click a section to put it on your résumé. You can move it anywhere afterwards.</p>
          <button className="cv-iconbtn cv-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="cv-modal-body">
          <div className="cv-pick-grid">
            {builtIns.map((id) => {
              const used = onPage.has(id);
              return (
                <button
                  key={id}
                  className="cv-pick-card"
                  data-used={used ? "true" : undefined}
                  onClick={() => { if (!used) { onAddBuiltIn(id); onClose(); } }}
                  disabled={used}
                  title={used ? "Already on your résumé" : `Add ${SECTION_LABELS[id]}`}
                >
                  <Thumb id={id} />
                  <span className="cv-pick-meta">
                    <b>{SECTION_LABELS[id]}</b>
                    <span>{BLURBS[id] ?? "A section on your résumé."}</span>
                  </span>
                  <span className="cv-pick-state">
                    {used ? <><Check size={12} /> on résumé</> : <><Plus size={12} /> add</>}
                  </span>
                </button>
              );
            })}

            {/* Custom sections are created rather than toggled, so this card
                carries its own name field. */}
            <div className="cv-pick-card cv-pick-custom">
              <Thumb id="custom" />
              <span className="cv-pick-meta">
                <b>Custom section</b>
                <span>Anything else — name it yourself.</span>
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = customTitle.trim();
                  if (!t) return;
                  onAddCustom(t);
                  onClose();
                }}
              >
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Section name"
                  aria-label="Custom section name"
                />
                <button className="cv-btn cv-btn-sm cv-btn-primary" type="submit" disabled={!customTitle.trim()}>
                  <Plus size={13} />
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
