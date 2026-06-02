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
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  type EditorState,
  type LexicalEditor,
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

function stripParagraphWrapper(html: string): string {
  // Strip single wrapping <p> to keep inline HTML format
  const match = html.match(/^<p[^>]*>([\s\S]*?)<\/p>$/);
  if (match) return match[1].trim();
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
  lastInternalValue: React.MutableRefObject<string>;
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
    (editorState: EditorState, editor: LexicalEditor) => {
      if (richText) {
        const html = editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null));
        const inlineHtml = stripParagraphWrapper(html);
        lastInternalValue.current = inlineHtml;
        onChange(inlineHtml);
      } else {
        editorState.read(() => {
          const root = $getRoot();
          const text = root.getTextContent();
          lastInternalValue.current = text;
          onChange(text);
        });
      }
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

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`inline-editor-container relative ${className}`}>
        {richText ? (
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`inline-editor-content outline-none focus:ring-1 focus:ring-blue-400/50 rounded px-0.5 -mx-0.5 transition-shadow ${
                  multiline ? "min-h-[1.5em]" : ""
                }`}
              />
            }
            placeholder={
              placeholder ? (
                <div className="inline-editor-placeholder absolute top-0 left-0 text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              ) : null
            }
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
            placeholder={
              placeholder ? (
                <div className="inline-editor-placeholder absolute top-0 left-0 text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              ) : null
            }
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
