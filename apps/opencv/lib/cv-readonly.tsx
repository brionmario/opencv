"use client";

import React, { createContext, useContext } from "react";

/**
 * Read-only renders.
 *
 * The four templates are editors: every field is an inline Lexical editor and
 * every entry carries add/delete affordances. The share view needs the same
 * components — a shared CV that rendered through a second code path would
 * drift from what the author designed — but with none of the editing.
 *
 * This is a context rather than a prop because the alternative is threading
 * one flag through four templates and the hundred-odd field call sites inside
 * them. The primitives that own the editing behaviour (InlineEditor,
 * EditableCard, AddItemButton) read it directly instead.
 *
 * It is separate from the selection context, which governs whether a section
 * can be *picked* on the canvas. Read-only implies no selection, but a
 * selectable canvas with inert fields (the template gallery) is also valid.
 */
const Ctx = createContext(false);

export function ReadOnlyProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={true}>{children}</Ctx.Provider>;
}

export function useReadOnly(): boolean {
  return useContext(Ctx);
}
