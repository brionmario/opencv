"use client";

import { useState } from "react";
import { X, ListOrdered, Eye, EyeOff, ChevronUp, ChevronDown, ArrowLeftRight, Trash2, Plus } from "lucide-react";
import type { CVData, SectionMeta } from "@/lib/cv-builder-types";
import { SECTION_LABELS, type BuiltInSectionId } from "@/lib/cv-builder-types";
import { getEffectiveSectionOrder } from "@/lib/cv-sections";

export interface SectionsPanelProps {
  data: CVData;
  /** 2 for professional/modern (left/right columns), 1 for classic/minimal (single flow). */
  layoutColumns: 1 | 2;
  onToggleHidden: (id: string) => void;
  onMove: (id: string, direction: -1 | 1, mode: "flat" | "column") => void;
  onSetColumn: (id: string, column: "left" | "right") => void;
  onAddCustomSection: (title: string) => void;
  onDeleteCustomSection: (id: string) => void;
  onClose: () => void;
}

function labelFor(id: string, data: CVData): string {
  const builtIn = SECTION_LABELS[id as BuiltInSectionId];
  if (builtIn) return builtIn;
  return data.customSections.find((s) => s.id === id)?.title || "Untitled section";
}

function isCustom(id: string, data: CVData): boolean {
  return data.customSections.some((s) => s.id === id);
}

function Row({
  meta,
  data,
  layoutColumns,
  isFirst,
  isLast,
  onToggleHidden,
  onMove,
  onSetColumn,
  onDelete,
}: {
  meta: SectionMeta;
  data: CVData;
  layoutColumns: 1 | 2;
  isFirst: boolean;
  isLast: boolean;
  onToggleHidden: () => void;
  onMove: (direction: -1 | 1) => void;
  onSetColumn: () => void;
  onDelete: (() => void) | null;
}) {
  const label = labelFor(meta.id, data);
  return (
    <div
      className="cv-section-row"
      data-hidden={meta.hidden ? "true" : undefined}
    >
      <div className="cv-section-row-order">
        <button
          className="cv-iconbtn"
          disabled={isFirst}
          aria-label="Move up"
          onClick={() => onMove(-1)}
        >
          <ChevronUp size={12} />
        </button>
        <button
          className="cv-iconbtn"
          disabled={isLast}
          aria-label="Move down"
          onClick={() => onMove(1)}
        >
          <ChevronDown size={12} />
        </button>
      </div>

      <span className="cv-section-row-label">{label}</span>

      {layoutColumns === 2 && (
        <button
          className="cv-iconbtn cv-tip"
          data-tip={meta.column === "left" ? "Move to right column" : "Move to left column"}
          aria-label="Switch column"
          onClick={onSetColumn}
        >
          <ArrowLeftRight size={14} />
        </button>
      )}

      <button
        className="cv-iconbtn cv-tip"
        data-tip={meta.hidden ? "Show section" : "Hide section"}
        aria-label={meta.hidden ? "Show section" : "Hide section"}
        onClick={onToggleHidden}
      >
        {meta.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>

      {onDelete && (
        <button
          className="cv-iconbtn cv-tip"
          data-tip="Delete section"
          aria-label="Delete section"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function SectionsPanel({
  data,
  layoutColumns,
  onToggleHidden,
  onMove,
  onSetColumn,
  onAddCustomSection,
  onDeleteCustomSection,
  onClose,
}: SectionsPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const order = getEffectiveSectionOrder(data);
  const left = order.filter((s) => s.column === "left");
  const right = order.filter((s) => s.column === "right");

  const commitAdd = () => {
    const title = newTitle.trim();
    if (title) onAddCustomSection(title);
    setNewTitle("");
    setAdding(false);
  };

  const renderList = (items: SectionMeta[], mode: "flat" | "column") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((meta, i) => (
        <Row
          key={meta.id}
          meta={meta}
          data={data}
          layoutColumns={layoutColumns}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          onToggleHidden={() => onToggleHidden(meta.id)}
          onMove={(direction) => onMove(meta.id, direction, mode)}
          onSetColumn={() => onSetColumn(meta.id, meta.column === "left" ? "right" : "left")}
          onDelete={isCustom(meta.id, data) ? () => onDeleteCustomSection(meta.id) : null}
        />
      ))}
    </div>
  );

  return (
    <aside className="cv-drawer" role="dialog" aria-label="Sections">
      <div className="cv-drawer-hd">
        <div className="cv-drawer-badge">
          <ListOrdered size={19} />
        </div>
        <div className="cv-drawer-hd-txt">
          <h3>Sections</h3>
          <p>Show, hide, reorder, or add your own sections.</p>
        </div>
        <button className="cv-iconbtn" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="cv-drawer-body">
        {layoutColumns === 2 ? (
          <>
            <div className="cv-field-group">
              <span className="cv-fg-label">Left column</span>
              {renderList(left, "column")}
            </div>
            <div className="cv-field-group">
              <span className="cv-fg-label">Right column</span>
              {renderList(right, "column")}
            </div>
          </>
        ) : (
          <div className="cv-field-group" style={{ marginBottom: 0 }}>
            <span className="cv-fg-label">Sections</span>
            {renderList(order, "flat")}
          </div>
        )}

        <div className="cv-field-group" style={{ marginBottom: 0 }}>
          {adding ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitAdd();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                onBlur={commitAdd}
                placeholder="Section name, e.g. Volunteering"
                style={{
                  flex: 1, fontSize: 13, border: "1px solid var(--cv-border-2)",
                  borderRadius: 8, padding: "7px 10px", background: "var(--cv-surface-2)",
                  color: "var(--cv-text)", fontFamily: "var(--cv-font-ui)", outline: "none",
                }}
              />
            </div>
          ) : (
            <button
              className="cv-btn"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setAdding(true)}
            >
              <Plus size={15} />
              Add custom section
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
