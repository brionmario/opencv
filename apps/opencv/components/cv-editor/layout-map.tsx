"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Lock, Eye, EyeOff, Plus } from "lucide-react";
import type { CVData, SectionMeta } from "@/lib/cv-builder-types";
import { SECTION_LABELS, type BuiltInSectionId } from "@/lib/cv-builder-types";
import { getEffectiveSectionOrder } from "@/lib/cv-sections";

type Column = "left" | "right";

export interface LayoutMapProps {
  data: CVData;
  layoutColumns: 1 | 2;
  /** Rendered height of each section on the real canvas, in px, keyed by id. */
  heights: Record<string, number>;
  /** Height of one page on the canvas, in px — for the page-break lines. */
  pageHeightPx: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPlace: (id: string, column: Column, beforeId: string | null) => void;
  onToggleHidden: (id: string) => void;
  onAddSection: () => void;
}

function labelFor(id: string, data: CVData): string {
  return (
    SECTION_LABELS[id as BuiltInSectionId] ??
    data.customSections.find((s) => s.id === id)?.title ??
    "Untitled"
  );
}

/** Where a drag would drop: a column, and the box it would sit above. */
interface Drop {
  column: Column;
  beforeId: string | null;
}

export function LayoutMap({
  data,
  layoutColumns,
  heights,
  pageHeightPx,
  selectedId,
  onSelect,
  onPlace,
  onToggleHidden,
  onAddSection,
}: LayoutMapProps) {
  const order = getEffectiveSectionOrder(data);
  const visible = order.filter((s) => !s.hidden);
  const hidden = order.filter((s) => s.hidden);

  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const colRefs = useRef<Record<Column, HTMLDivElement | null>>({ left: null, right: null });

  // One column when the template has one; otherwise split by the section's
  // own column. A single-column template still stores a column per section,
  // so read everything as "left" to avoid losing entries.
  const columns: Column[] = layoutColumns === 2 ? ["left", "right"] : ["left"];
  const inColumn = useCallback(
    (col: Column): SectionMeta[] =>
      layoutColumns === 1 ? visible : visible.filter((s) => s.column === col),
    [layoutColumns, visible]
  );

  // Boxes are sized by what the page actually renders, so the map can't
  // disagree with the document. Falls back to an even split before the first
  // measurement lands.
  const scale = useMemo(() => {
    const measured = visible.reduce((sum, s) => sum + (heights[s.id] ?? 0), 0);
    if (!measured) return 0;
    const tallestColumn = Math.max(
      ...columns.map((c) => inColumn(c).reduce((sum, s) => sum + (heights[s.id] ?? 0), 0)),
      1
    );
    // Fit the tallest column into a comfortable map height.
    return Math.min(0.34, 360 / tallestColumn);
  }, [visible, heights, columns, inColumn]);

  const boxHeight = (id: string) => {
    const h = heights[id];
    if (!h || !scale) return 34;
    return Math.max(22, h * scale);
  };

  // ── Dragging ──────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    // Left button only; let the eye toggle and other controls handle their own.
    if (e.button !== 0) return;
    // Capture keeps the drag alive if the pointer leaves the box; it throws
    // for a pointer id the element never saw, which must not kill the drag.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDragId(id);
    onSelect(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    let found: Drop | null = null;

    for (const col of columns) {
      const el = colRefs.current[col];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // Generous horizontal band so a slightly-off drag still reads as intent.
      if (e.clientX < r.left - 12 || e.clientX > r.right + 12) continue;

      const boxes = [...el.querySelectorAll<HTMLElement>("[data-box-id]")].filter(
        (b) => b.dataset.boxId !== dragId
      );
      let beforeId: string | null = null;
      for (const b of boxes) {
        const br = b.getBoundingClientRect();
        if (e.clientY < br.top + br.height / 2) {
          beforeId = b.dataset.boxId ?? null;
          break;
        }
      }
      found = { column: col, beforeId };
      break;
    }
    setDrop(found);
  };

  const endDrag = () => {
    if (dragId && drop) onPlace(dragId, drop.column, drop.beforeId);
    setDragId(null);
    setDrop(null);
  };

  // ── Page-break lines ──────────────────────────────────────────────────────
  const mapPageHeight = pageHeightPx * scale;
  const tallestPx = Math.max(
    ...columns.map((c) => inColumn(c).reduce((sum, s) => sum + boxHeight(s.id) + 6, 0)),
    1
  );
  const breaks =
    mapPageHeight > 24
      ? Array.from({ length: Math.max(0, Math.ceil(tallestPx / mapPageHeight) - 1) }, (_, i) => (i + 1) * mapPageHeight)
      : [];

  return (
    <div className="cv-map" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <p className="cv-map-hint">Drag a block to move it between columns or reorder it.</p>

      <div className="cv-map-page">
        {/* The header is part of every template and isn't placeable. */}
        <div className="cv-map-header">
          <Lock size={11} />
          Header
        </div>

        <div className="cv-map-cols" data-single={layoutColumns === 1 ? "true" : undefined}>
          {columns.map((col) => (
            <div
              key={col}
              className="cv-map-col"
              data-col={col}
              ref={(el) => { colRefs.current[col] = el; }}
            >
              {inColumn(col).map((s) => (
                <div key={s.id} className="cv-map-slot">
                  {drop && drop.column === col && drop.beforeId === s.id && (
                    <div className="cv-map-drop" aria-hidden="true" />
                  )}
                  <div
                    data-box-id={s.id}
                    className="cv-map-box"
                    style={{ height: boxHeight(s.id) }}
                    data-selected={selectedId === s.id ? "true" : undefined}
                    data-dragging={dragId === s.id ? "true" : undefined}
                    onPointerDown={(e) => onPointerDown(e, s.id)}
                    onClick={() => onSelect(s.id)}
                    title={labelFor(s.id, data)}
                  >
                    <span className="cv-map-box-label">{labelFor(s.id, data)}</span>
                    <button
                      className="cv-map-box-eye"
                      aria-label={`Hide ${labelFor(s.id, data)}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleHidden(s.id); }}
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {/* Tail target, so a block can be dropped below the last one. */}
              {drop && drop.column === col && drop.beforeId === null && (
                <div className="cv-map-drop" aria-hidden="true" />
              )}
              <div className="cv-map-tail" />
            </div>
          ))}

          {breaks.map((top, i) => (
            <div key={i} className="cv-map-break" style={{ top }}>
              <span>page {i + 2}</span>
            </div>
          ))}
        </div>
      </div>

      {hidden.length > 0 && (
        <div className="cv-map-hidden">
          <span className="cv-map-hidden-label">Hidden</span>
          <ul>
            {hidden.map((s) => (
              <li key={s.id}>
                <button onClick={() => onToggleHidden(s.id)} title={`Show ${labelFor(s.id, data)}`}>
                  <EyeOff size={12} />
                  {labelFor(s.id, data)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="cv-btn cv-map-add" onClick={onAddSection}>
        <Plus size={14} />
        Add section
      </button>
    </div>
  );
}
