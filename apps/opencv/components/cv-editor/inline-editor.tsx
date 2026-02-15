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
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  type EditorState,
  type LexicalEditor,
} from "lexical";

function SetInitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    editor.update(() => {
      const root = $getRoot();
      if (root.getTextContent() !== value && value) {
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(value));
        root.append(paragraph);
      }
    });
  }, [editor, value]);

  return null;
}

function ExternalValuePlugin({
  value,
  lastInternalValue,
}: {
  value: string;
  lastInternalValue: React.MutableRefObject<string>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value !== lastInternalValue.current) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(value));
        root.append(paragraph);
      });
      lastInternalValue.current = value;
    }
  }, [editor, value, lastInternalValue]);

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
        const root = $getRoot();
        const text = root.getTextContent();
        lastInternalValue.current = text;
        onChange(text);
      });
    },
    [onChange]
  );

  const initialConfig = {
    namespace: "InlineEditor",
    theme: {
      paragraph: "inline-editor-paragraph",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
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
        <SetInitialValuePlugin value={value} />
        <ExternalValuePlugin value={value} lastInternalValue={lastInternalValue} />
      </div>
    </LexicalComposer>
  );
}
