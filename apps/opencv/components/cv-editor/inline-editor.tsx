"use client";

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListNode, ListItemNode } from "@lexical/list";
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
} from "lexical";
import { FloatingToolbar } from "./floating-toolbar";

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

function serializeToCleanHtml(nodes: LexicalNode[]): string {
  let html = "";
  for (const node of nodes) {
    if ($isTextNode(node)) {
      let text = escapeHtml(node.getTextContent());
      const fmt = node.getFormat();
      if (fmt & 1) text = `<strong>${text}</strong>`;
      if (fmt & 2) text = `<em>${text}</em>`;
      if (fmt & 8) text = `<u>${text}</u>`;
      html += text;
    } else if ($isLinkNode(node)) {
      const href = node.getURL();
      const target = node.getTarget();
      const inner = serializeToCleanHtml(node.getChildren());
      const targetAttr = target ? ` target="${target}"` : "";
      html += `<a href="${escapeHtml(href)}"${targetAttr}>${inner}</a>`;
    } else if ($isElementNode(node)) {
      html += serializeToCleanHtml(node.getChildren());
    } else {
      html += escapeHtml(node.getTextContent());
    }
  }
  return html;
}

function initEditorWithHtml(editor: LexicalEditor, value: string) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(wrapInParagraph(value), "text/html");
  const nodes = $generateNodesFromDOM(editor, dom);
  const root = $getRoot();
  root.clear();
  nodes.forEach((node) => root.append(node));
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
  lastInternalValue,
  richText,
}: {
  value: string;
  lastInternalValue: React.RefObject<string>;
  richText: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== lastInternalValue.current) {
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
      lastInternalValue.current = value;
    }
  }, [editor, value, lastInternalValue, richText]);

  return null;
}

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  richText?: boolean;
  className?: string;
  multiline?: boolean;
}

export function InlineEditor({
  value,
  onChange,
  placeholder = "",
  richText = false,
  className = "",
  multiline = false,
}: InlineEditorProps) {
  const lastInternalValue = useRef(value);

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      editorState.read(() => {
        if (richText) {
          const html = serializeToCleanHtml($getRoot().getChildren());
          lastInternalValue.current = html;
          onChange(html);
        } else {
          const text = $getRoot().getTextContent();
          lastInternalValue.current = text;
          onChange(text);
        }
      });
    },
    [onChange, richText]
  );

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
      <div className={`inline-editor-container relative ${multiline ? "block" : ""} ${className}`}>
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
        {richText && <FloatingToolbar />}
        <SetInitialValuePlugin value={value} richText={richText} />
        <ExternalValuePlugin value={value} lastInternalValue={lastInternalValue} richText={richText} />
      </div>
    </LexicalComposer>
  );
}
