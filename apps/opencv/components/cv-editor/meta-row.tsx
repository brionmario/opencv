"use client";

import React from "react";
import { useReadOnly } from "@/lib/cv-readonly";

interface MetaRowProps {
  /** The field values this row exists to show. */
  values: (string | undefined | null)[];
  className?: string;
  children: React.ReactNode;
}

/**
 * One meta line: an icon and the field(s) it labels.
 *
 * On the canvas the row always renders, because an empty field is how the
 * author gets a placeholder to type a date or a location into. A read-only
 * render has no such need, so a row with nothing in it drops out entirely
 * rather than leaving a bare icon on a shared CV. That also keeps the share
 * view in step with the PDF export, which has always skipped empty meta.
 */
export function MetaRow({ values, className = "", children }: MetaRowProps) {
  const readOnly = useReadOnly();
  const empty = !values.some((v) => typeof v === "string" && v.trim() !== "");
  if (readOnly && empty) return null;
  return <span className={className}>{children}</span>;
}

/**
 * Whether a separator between two fields should be drawn: never on a
 * read-only render with nothing on one side of it.
 */
export function useSeparator(): (left: string | undefined, right: string | undefined) => boolean {
  const readOnly = useReadOnly();
  return (left, right) => (readOnly ? Boolean(left?.trim() && right?.trim()) : Boolean(right?.trim()));
}
