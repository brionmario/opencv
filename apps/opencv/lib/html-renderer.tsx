/**
 * HTML Rendering Utilities for CV Templates
 *
 * Provides safe HTML rendering for CV content with support for
 * both HTML tags and markdown syntax (for backward compatibility).
 *
 * The rules themselves live in lib/rich-text.ts, shared with the exporters
 * so the canvas and the file can never disagree about what a field holds.
 */

import { sanitizeRichText, hasBlockMarkup } from "@/lib/rich-text";

/** Links on the canvas carry the template's own styling. */
const LINK_CLASS = "text-pink-600 hover:text-pink-700 underline";

/**
 * Sanitizes and prepares HTML content for safe rendering.
 * Supports both HTML tags and markdown syntax.
 */
export function sanitizeHtml(str: string): string {
  return sanitizeRichText(str, { linkClass: LINK_CLASS });
}

/**
 * React component that safely renders HTML content
 * Use this for displaying CV content that may contain HTML formatting
 */
export function HtmlContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const sanitized = sanitizeHtml(content);

  // A paragraph or list cannot live inside a span. Most fields hold a single
  // bare line and stay inline, where the templates place them; only one that
  // actually carries blocks gets a block container to sit in.
  const Tag = hasBlockMarkup(sanitized) ? "div" : "span";

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * Hook to get sanitized HTML string
 * Useful when you need the HTML string directly
 */
export function useSanitizedHtml(content: string): string {
  return sanitizeHtml(content);
}
