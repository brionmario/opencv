'use client';

import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

/**
 * useState with undo and redo.
 *
 * Drop-in for the single piece of state the editor mutates, so every existing
 * caller keeps the `setState(next)` / `setState(prev => next)` shape it
 * already uses and gains history for free. Nothing has to remember to record
 * anything: if a change went through `set`, it can be undone.
 */

/**
 * Edits closer together than this are treated as one step, so a sentence
 * typed into a field undoes as a sentence and not a character at a time.
 * Long enough to swallow a burst of keystrokes, short enough that a pause
 * and then a deliberate delete stay separate steps.
 */
const COALESCE_MS = 600;

/**
 * How many past states to keep. Entries share structure with each other
 * (an edit to one section leaves every other section's objects untouched),
 * so the real cost of a step is the slice that changed, not a whole CV.
 */
const LIMIT = 100;

export interface HistoryState<T> {
  value: T;
  set: Dispatch<SetStateAction<T>>;
  /** Replaces the value and drops the history, for loading a document. */
  replace: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface Stacks<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistoryState<T>(initial: T): HistoryState<T> {
  const [stacks, setStacks] = useState<Stacks<T>>({ past: [], present: initial, future: [] });

  // When the previous step was recorded. A burst of edits inside the coalesce
  // window updates `present` without pushing, which merges them into the one
  // step already on the stack.
  const lastEditRef = useRef(0);

  const set = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    const now = Date.now();
    const coalesce = now - lastEditRef.current < COALESCE_MS;
    lastEditRef.current = now;

    setStacks((prev) => {
      const next =
        typeof update === "function" ? (update as (p: T) => T)(prev.present) : update;

      // A mutator that returns the same object did nothing worth recording.
      // Several of them short-circuit this way, and without this each one
      // would cost an undo press that appears to do nothing.
      if (Object.is(next, prev.present)) return prev;

      if (coalesce && prev.past.length > 0) {
        return { past: prev.past, present: next, future: [] };
      }

      const past = [...prev.past, prev.present];
      return {
        past: past.length > LIMIT ? past.slice(past.length - LIMIT) : past,
        present: next,
        future: [],
      };
    });
  }, []);

  const replace = useCallback((next: T) => {
    lastEditRef.current = 0;
    setStacks({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    // Break the coalesce window, so the edit after an undo starts its own
    // step instead of merging into the one just restored.
    lastEditRef.current = 0;
    setStacks((prev) => {
      if (prev.past.length === 0) return prev;
      const present = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    lastEditRef.current = 0;
    setStacks((prev) => {
      if (prev.future.length === 0) return prev;
      return {
        past: [...prev.past, prev.present],
        present: prev.future[0],
        future: prev.future.slice(1),
      };
    });
  }, []);

  return useMemo(
    () => ({
      value: stacks.present,
      set,
      replace,
      undo,
      redo,
      canUndo: stacks.past.length > 0,
      canRedo: stacks.future.length > 0,
    }),
    [stacks, set, replace, undo, redo],
  );
}
