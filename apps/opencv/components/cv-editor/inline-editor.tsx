"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListNode, ListItemNode, $isListNode, $isListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { HeadingNode } from "@lexical/rich-text";
import { $generateNodesFromDOM } from "@lexical/html";
import { $isLinkNode } from "@lexical/link";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isTextNode,
  $isElementNode,
  type EditorState,
  type LexicalEditor,
  type LexicalNode,
  type ElementNode,
} from "lexical";
import { FloatingToolbar } from "./floating-toolbar";
import { useReadOnly } from "@/lib/cv-readonly";
import { HtmlContent } from "@/lib/html-renderer";

function hasHtmlTags(str: string): boolean {
  return /<[^>]+>/.test(str);
}

function wrapInParagraph(html: string): string {
  const trimmed = html.trim();
  if (/^<(p|div|ul|ol|h[1-6])\b/i.test(trimmed)) return trimmed;
  return `<p>${html}</p>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Lexical's text format bitmask. */
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;

/** The marks inside a single block: emphasis, links, nothing structural. */
function serializeInline(nodes: LexicalNode[]): string {
  let html = "";
  for (const node of nodes) {
    if ($isTextNode(node)) {
      let text = escapeHtml(node.getTextContent());
      const fmt = node.getFormat();
      if (fmt & FORMAT_BOLD) text = `<strong>${text}</strong>`;
      if (fmt & FORMAT_ITALIC) text = `<em>${text}</em>`;
      if (fmt & FORMAT_UNDERLINE) text = `<u>${text}</u>`;
      if (fmt & FORMAT_STRIKETHROUGH) text = `<s>${text}</s>`;
      html += text;
    } else if ($isLinkNode(node)) {
      const href = node.getURL();
      const target = node.getTarget();
      const targetAttr = target ? ` target="${target}"` : "";
      html += `<a href="${escapeHtml(href)}"${targetAttr}>${serializeInline(node.getChildren())}</a>`;
    } else if ($isElementNode(node)) {
      html += serializeInline(node.getChildren());
    } else {
      html += escapeHtml(node.getTextContent());
    }
  }
  return html;
}

/**
 * An alignment worth writing down. Lexical reports "" for a block that was
 * never aligned and "left"/"start" for one explicitly set back to the
 * default, all three of which render identically, so only the three that
 * change anything are emitted.
 */
function alignAttr(node: ElementNode): string {
  const format = node.getFormatType();
  if (format === "center" || format === "right" || format === "justify") {
    return ` style="text-align:${format}"`;
  }
  return "";
}

/**
 * Block structure: paragraphs, bullet and numbered lists, and the alignment
 * on each.
 *
 * This used to flatten every element to its text, so a list the toolbar had
 * just inserted came back as its items run together into one line the moment
 * the field was saved. Blocks are written out properly now, and the
 * sanitizers on both the canvas and the export side allow exactly this
 * vocabulary (lib/rich-text.ts).
 */
function serializeBlocks(nodes: LexicalNode[]): string {
  let html = "";
  for (const node of nodes) {
    if ($isListNode(node)) {
      const tag = node.getListType() === "number" ? "ol" : "ul";
      let items = "";
      for (const item of node.getChildren()) {
        if (!$isListItemNode(item)) continue;
        // A nested list is a list inside a list item, so its own children
        // split into the item's text and the sub-list under it.
        const children = item.getChildren();
        const sublists = children.filter($isListNode);
        const inline = children.filter((child) => !$isListNode(child));
        items += `<li${alignAttr(item)}>${serializeInline(inline)}${serializeBlocks(sublists)}</li>`;
      }
      html += `<${tag}>${items}</${tag}>`;
    } else if ($isElementNode(node)) {
      html += `<p${alignAttr(node)}>${serializeInline(node.getChildren())}</p>`;
    } else {
      html += escapeHtml(node.getTextContent());
    }
  }
  return html;
}

function serializeToCleanHtml(nodes: LexicalNode[]): string {
  // Almost every field is one plain paragraph, and those keep being written
  // as bare inline HTML: it is the shape every document already saved on
  // someone's machine is in, and the templates place it inline. Wrappers
  // appear only once there is structure that needs them.
  if (nodes.length === 1 && $isElementNode(nodes[0]) && !$isListNode(nodes[0]) && !alignAttr(nodes[0])) {
    return serializeInline(nodes[0].getChildren());
  }
  return serializeBlocks(nodes);
}

/**
 * Puts back the alignment on list items.
 *
 * Lexical's paragraph importer reads `text-align` off the element it is
 * given; its list-item importer does not. Left alone, an aligned bullet
 * comes back unaligned, and because the next keystroke re-serializes what
 * the editor currently holds, the alignment is not just invisible, it is
 * erased from the document.
 *
 * The parsed DOM and the imported tree are the same document walked in the
 * same pre-order, so the nth <li> is the nth ListItemNode.
 */
function restoreListItemAlignment(dom: Document, root: ElementNode): void {
  const source = Array.from(dom.querySelectorAll("li"));
  if (source.length === 0) return;

  const imported: LexicalNode[] = [];
  const collect = (node: LexicalNode) => {
    if ($isListItemNode(node)) imported.push(node);
    if ($isElementNode(node)) node.getChildren().forEach(collect);
  };
  root.getChildren().forEach(collect);

  for (let i = 0; i < Math.min(source.length, imported.length); i++) {
    const align = source[i].style.textAlign;
    const item = imported[i];
    if (!$isListItemNode(item)) continue;
    if (align === "left" || align === "center" || align === "right" || align === "justify") {
      item.setFormat(align);
    }
  }
}

function initEditorWithHtml(editor: LexicalEditor, value: string) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(wrapInParagraph(value), "text/html");
  const nodes = $generateNodesFromDOM(editor, dom);
  const root = $getRoot();
  root.clear();
  nodes.forEach((node) => root.append(node));
  restoreListItemAlignment(dom, root);
}

function SetInitialValuePlugin({ value, richText }: { value: string; richText: boolean }) {
  const [editor] = useLexicalComposerContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    editor.update(() => {
      const root = $getRoot();
      if (richText && value && hasHtmlTags(value)) {
        initEditorWithHtml(editor, value);
      } else if (root.getTextContent() !== value && value) {
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(value));
        root.append(paragraph);
      }
    });
  }, [editor, value, richText]);

  return null;
}

function ExternalValuePlugin({
  value,
  lastInternalValueRef,
  richText,
}: {
  value: string;
  lastInternalValueRef: React.RefObject<string>;
  richText: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== lastInternalValueRef.current) {
      editor.update(() => {
        if (richText && value && hasHtmlTags(value)) {
          initEditorWithHtml(editor, value);
        } else {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(value));
          root.append(paragraph);
        }
      });
      lastInternalValueRef.current = value;
    }
  }, [editor, value, lastInternalValueRef, richText]);

  return null;
}

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  richText?: boolean;
  className?: string;
  multiline?: boolean;
  /**
   * Checks the field's value and returns a message to show when it looks
   * wrong, or null when it is fine. Advisory only: nothing is blocked, and
   * the message is editor furniture that never reaches the page.
   */
  validate?: (value: string) => string | null;
}

export function InlineEditor({
  value,
  onChange,
  placeholder = "",
  richText = false,
  className = "",
  multiline = false,
  validate,
}: InlineEditorProps) {
  const readOnly = useReadOnly();
  const lastInternalValueRef = useRef(value);
  // Not before the field has been left once: half a typed address is not a
  // mistake yet, and nagging from the first keystroke is noise.
  const [touched, setTouched] = useState(false);
  const warning = validate && touched && !readOnly ? validate(value) : null;

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      editorState.read(() => {
        if (richText) {
          const html = serializeToCleanHtml($getRoot().getChildren());
          lastInternalValueRef.current = html;
          onChange(html);
        } else {
          const text = $getRoot().getTextContent();
          lastInternalValueRef.current = text;
          onChange(text);
        }
      });
    },
    [onChange, richText]
  );

  // A read-only render skips Lexical entirely. Mounting an editor per field
  // just to forbid typing would ship the editor to every viewer of a shared
  // link and leave contentEditable regions they could type into, edits that
  // go nowhere, since the handlers are inert. Static markup is also what a
  // crawler and a screen reader want. The container/content classes are kept
  // so the metrics (the -mx-0.5 bleed especially) match the canvas exactly.
  if (readOnly) {
    return (
      <div className={`inline-editor-container relative ${multiline ? "block" : ""} ${className}`}>
        <div className="inline-editor-content rounded px-0.5 -mx-0.5">
          {richText ? <HtmlContent content={value} /> : value}
        </div>
      </div>
    );
  }

  const initialConfig = {
    namespace: "InlineEditor",
    theme: {
      paragraph: "inline-editor-paragraph",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
      },
      list: {
        ul: "list-disc list-inside space-y-1",
        ol: "list-decimal list-inside space-y-1",
        listitem: "text-sm",
      },
    },
    nodes: richText ? [ListNode, ListItemNode, LinkNode, HeadingNode] : [],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  const placeholderEl = placeholder ? (
    <div className="inline-editor-placeholder text-gray-400">
      {placeholder}
    </div>
  ) : null;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={`inline-editor-container relative ${multiline ? "block" : ""} ${className}`}
        data-invalid={warning ? "true" : undefined}
        onBlur={() => setTouched(true)}
      >
        {richText ? (
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`inline-editor-content outline-none focus:ring-1 focus:ring-blue-400/50 rounded px-0.5 -mx-0.5 transition-shadow ${
                  multiline ? "min-h-[1.5em]" : ""
                }`}
              />
            }
            placeholder={placeholderEl}
            ErrorBoundary={({ children }) => <>{children}</>}
          />
        ) : (
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={`inline-editor-content outline-none focus:ring-1 focus:ring-blue-400/50 rounded px-0.5 -mx-0.5 transition-shadow ${
                  multiline ? "min-h-[1.5em]" : ""
                }`}
              />
            }
            placeholder={placeholderEl}
            ErrorBoundary={({ children }) => <>{children}</>}
          />
        )}
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        {richText && <ListPlugin />}
        {richText && <LinkPlugin />}
        {richText && <FloatingToolbar />}
        <SetInitialValuePlugin value={value} richText={richText} />
        <ExternalValuePlugin value={value} lastInternalValueRef={lastInternalValueRef} richText={richText} />
        {warning ? (
          <span className="cv-field-warning print:hidden" role="alert">
            {warning}
          </span>
        ) : null}
      </div>
    </LexicalComposer>
  );
}
