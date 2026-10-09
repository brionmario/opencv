"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { Settings2 } from "lucide-react";

/**
 * Canvas selection.
 *
 * The builder treats each rendered section as a selectable object so the
 * Properties dock can act on whatever the user clicked, the way a layer
 * panel follows the canvas selection in an image editor.
 *
 * Selection lives in the shell rather than in the templates: templates only
 * wrap each section in a <SectionFrame>, which tags the node with
 * `data-cv-section` and reports clicks. That keeps all four templates free of
 * selection logic, and keeps the exporters — which render from data, not from
 * this tree — completely unaffected.
 */

interface SelectionCtx {
  selectedId: string | null;
  select: (id: string | null) => void;
  /** Opens the Layout dock focused on a section, from the page itself. */
  openLayout?: (id: string) => void;
  /** False inside read-only renders (the template gallery preview). */
  enabled: boolean;
}

const Ctx = createContext<SelectionCtx>({
  selectedId: null,
  select: () => {},
  enabled: false,
});

export function SelectionProvider({
  selectedId,
  onSelect,
  onOpenLayout,
  enabled = true,
  children,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenLayout?: (id: string) => void;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo<SelectionCtx>(
    () => ({ selectedId, select: onSelect, openLayout: onOpenLayout, enabled }),
    [selectedId, onSelect, onOpenLayout, enabled]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelection() {
  return useContext(Ctx);
}

/**
 * Wraps one rendered section on the canvas.
 *
 * Clicks select the section, but only when they did not land on something
 * already interactive — the inline editors, add/delete buttons and icon
 * pickers inside a section must keep working on the first click, so a click
 * that originated in one of those is left alone.
 */
export function SectionFrame({ id, children }: { id: string; children: React.ReactNode }) {
  const { selectedId, select, openLayout, enabled } = useSelection();

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [contenteditable='true']")) return;
      e.stopPropagation();
      select(id);
    },
    [enabled, id, select]
  );

  if (!enabled) return <>{children}</>;

  return (
    <div
      className="cv-section-frame"
      data-cv-section={id}
      data-selected={selectedId === id ? "true" : undefined}
      onClick={onClick}
    >
      {children}
      {openLayout ? (
        <button
          type="button"
          className="cv-section-cog print:hidden"
          title="Layout"
          aria-label="Open layout for this section"
          onClick={(e) => { e.stopPropagation(); select(id); openLayout(id); }}
        >
          <Settings2 size={13} />
        </button>
      ) : null}
    </div>
  );
}
