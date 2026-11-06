/**
 * The one definition of what a rich-text field may contain.
 *
 * The canvas and the exporters each used to carry their own near-identical
 * copy of this sanitizer, which is the arrangement that lets the editor and
 * the PDF quietly disagree about a document. They now share this one, so a
 * tag allowed on screen is allowed in the file and vice versa.
 *
 * Fields hold HTML, written by the Lexical editor in components/cv-editor.
 * The vocabulary is deliberately small: inline emphasis, links, line breaks,
 * paragraphs, lists, and an alignment on a block. Everything else is escaped
 * and shows up as literal text rather than being silently dropped, so a
 * paste that brought markup along is visible instead of vanishing.
 */

/** Block alignments, matching Lexical's element format values. */
export type Alignment = "left" | "center" | "right" | "justify";

const ALIGNMENTS = new Set<string>(["left", "center", "right", "justify"]);

/** Inline marks, allowed anywhere. */
const INLINE_TAGS = ["strong", "em", "b", "i", "u", "s", "br", "sup", "sub", "a"];

/** Block containers. These may carry a text-align. */
const BLOCK_TAGS = ["p", "ul", "ol", "li"];

const ALLOWED_TAGS = new Set([...INLINE_TAGS, ...BLOCK_TAGS]);

/** Tags that may carry `style="text-align:…"`. */
const ALIGNABLE = new Set(BLOCK_TAGS);

export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** True when the value carries block structure, rather than a bare line. */
export function hasBlockMarkup(html: string): boolean {
  return /<(p|ul|ol|li)\b/i.test(html);
}

/**
 * Reads a text-align off a tag's style attribute, if it has a usable one.
 * Only the alignment is read: no other declaration survives, so a style
 * attribute can never be a vector for anything else.
 */
export function alignmentOf(tag: string): Alignment | null {
  const style = tag.match(/style=(["'])([^"']*)\1/i);
  if (!style) return null;
  const align = style[2].match(/text-align\s*:\s*([a-z]+)/i);
  if (!align) return null;
  const value = align[1].toLowerCase();
  return ALIGNMENTS.has(value) ? (value as Alignment) : null;
}

/** Markdown left over from before fields held HTML. */
function markdownToHtml(str: string): string {
  str = str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  str = str.replace(/__(.+?)__/g, "<strong>$1</strong>");
  str = str.replace(/([^*]|^)\*([^*]+?)\*([^*]|$)/g, "$1<em>$2</em>$3");
  str = str.replace(/([^_]|^)_([^_]+?)_([^_]|$)/g, "$1<em>$2</em>$3");
  return str;
}

export interface SanitizeOptions {
  /** Class to put on every surviving link, for templates that style them. */
  linkClass?: string;
}

/**
 * Returns HTML safe to hand to `dangerouslySetInnerHTML` or to write into an
 * exported file.
 *
 * Strips scripts, frames, inline event handlers and style blocks; keeps only
 * the tags above; drops every attribute except a vetted `href`/`target` on a
 * link and a `text-align` on a block. Anything not on the list is escaped.
 */
export function sanitizeRichText(input: string, options: SanitizeOptions = {}): string {
  if (!input) return "";

  let str = input;
  const hasMarkdown = /(\*\*|__|\*|_)/.test(str);
  if (hasMarkdown && !/<[^>]+>/.test(str)) str = markdownToHtml(str);

  if (!/<[^>]+>/.test(str)) return escapeHtml(str);

  let sanitized = str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/<\s*style[^>]*>[\s\S]*?<\/style>/gi, "");

  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

  sanitized = sanitized.replace(tagPattern, (match, rawName: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return escapeHtml(match);
    if (match.startsWith("</")) return `</${tag}>`;

    if (tag === "a") {
      const href = match.match(/href=(["'])([^"']*)\1/i);
      if (!href) return "";
      // Only protocols that cannot execute. javascript: and data: are the
      // reason this check exists.
      if (!/^(https?:\/\/|mailto:)/i.test(href[2])) return "";
      const target = match.match(/target=(["'])([^"']*)\1/i);
      const targetAttr = target ? ` target="${escapeHtml(target[2])}"` : "";
      const classAttr = options.linkClass ? ` class="${escapeHtml(options.linkClass)}"` : "";
      return `<a href="${escapeHtml(href[2])}"${targetAttr}${classAttr}>`;
    }

    if (ALIGNABLE.has(tag)) {
      const align = alignmentOf(match);
      return align ? `<${tag} style="text-align:${align}">` : `<${tag}>`;
    }

    return `<${tag}>`;
  });

  return sanitized;
}
