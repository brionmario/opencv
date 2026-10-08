"use client";

import { Eye, EyeOff, ChevronUp, ChevronDown, Trash2, MousePointerSquareDashed } from "lucide-react";
import type { CVData, SectionMeta } from "@/lib/cv-builder-types";
import { SECTION_LABELS, type BuiltInSectionId } from "@/lib/cv-builder-types";
import { getEffectiveSectionOrder } from "@/lib/cv-sections";

export interface PropertiesPanelProps {
  data: CVData;
  selectedId: string | null;
  /** 2 for professional/modern (left/right columns), 1 for classic/minimal. */
  layoutColumns: 1 | 2;
  onToggleHidden: (id: string) => void;
  onMove: (id: string, direction: -1 | 1, mode: "flat" | "column") => void;
  onSetColumn: (id: string, column: "left" | "right") => void;
  onDeleteCustomSection: (id: string) => void;
}

function labelFor(id: string, data: CVData): string {
  return (
    SECTION_LABELS[id as BuiltInSectionId] ??
    data.customSections.find((s) => s.id === id)?.title ??
    "Untitled section"
  );
}

/** How many entries the section currently holds, so the panel can say something
 *  true about the selection rather than just naming it. */
function countFor(id: string, data: CVData): number | null {
  switch (id) {
    case "experience":   return data.experience.length;
    case "education":    return data.education.length;
    case "skills":       return data.skills.length;
    case "awards":       return data.awards.length;
    case "publications": return (data.publications ?? []).length;
    case "references":   return (data.references ?? []).length;
    case "socialLinks":  return (data.socialLinks ?? []).length;
    case "languages":    return (data.languages ?? []).length;
    case "summary":      return null;
    default:
      return data.customSections.find((s) => s.id === id)?.items.length ?? null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cv-prop-row">
      <span className="cv-prop-label">{label}</span>
      <div className="cv-prop-control">{children}</div>
    </div>
  );
}

export function PropertiesPanel({
  data,
  selectedId,
  layoutColumns,
  onToggleHidden,
  onMove,
  onSetColumn,
  onDeleteCustomSection,
}: PropertiesPanelProps) {
  const order = getEffectiveSectionOrder(data);
  const meta: SectionMeta | undefined = selectedId
    ? order.find((s) => s.id === selectedId)
    : undefined;

  if (!meta) {
    return (
      <div className="cv-prop-empty">
        <MousePointerSquareDashed size={20} />
        <p>Select a section on the page to edit its properties.</p>
      </div>
    );
  }

  const isCustom = data.customSections.some((s) => s.id === meta.id);
  const count = countFor(meta.id, data);

  // Movement is relative to the list the section actually sits in: its own
  // column for two-column templates, the whole flow for single-column ones.
  const mode = layoutColumns === 2 ? "column" : "flat";
  const siblings =
    mode === "column"
      ? order.filter((s) => s.column === meta.column)
      : order;
  const index = siblings.findIndex((s) => s.id === meta.id);

  return (
    <div className="cv-props">
      <div className="cv-prop-head">
        <b>{labelFor(meta.id, data)}</b>
        <span>{isCustom ? "custom section" : "section"}{count !== null ? ` · ${count} item${count === 1 ? "" : "s"}` : ""}</span>
      </div>

      <Field label="Visible">
        <button
          className="cv-btn cv-btn-sm"
          onClick={() => onToggleHidden(meta.id)}
          aria-pressed={!meta.hidden}
        >
          {meta.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {meta.hidden ? "Hidden" : "Shown"}
        </button>
      </Field>

      {layoutColumns === 2 && (
        <Field label="Column">
          <div className="cv-seg-sm" role="group" aria-label="Column">
            <button
              data-active={meta.column === "left" ? "true" : undefined}
              onClick={() => onSetColumn(meta.id, "left")}
            >
              Left
            </button>
            <button
              data-active={meta.column === "right" ? "true" : undefined}
              onClick={() => onSetColumn(meta.id, "right")}
            >
              Right
            </button>
          </div>
        </Field>
      )}

      <Field label="Order">
        <div className="cv-prop-order">
          <button
            className="cv-iconbtn"
            aria-label="Move up"
            disabled={index <= 0}
            onClick={() => onMove(meta.id, -1, mode)}
          >
            <ChevronUp size={15} />
          </button>
          <span className="cv-prop-index">
            {index + 1} / {siblings.length}
          </span>
          <button
            className="cv-iconbtn"
            aria-label="Move down"
            disabled={index < 0 || index >= siblings.length - 1}
            onClick={() => onMove(meta.id, 1, mode)}
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </Field>

      {isCustom && (
        <div className="cv-prop-danger">
          <button className="cv-btn cv-btn-sm" onClick={() => onDeleteCustomSection(meta.id)}>
            <Trash2 size={14} />
            Delete section
          </button>
        </div>
      )}
    </div>
  );
}
