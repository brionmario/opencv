"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
} from "lucide-react";

export function FloatingToolbar() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const isCollapsed = selection.isCollapsed();
      if (!isCollapsed) {
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const range = nativeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({
            top: rect.top - 45 + window.scrollY,
            left: rect.left + rect.width / 2,
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
      }, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [editor, updateToolbar]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center gap-0.5 bg-gray-900 text-white rounded-lg shadow-xl px-1.5 py-1 -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isBold ? "bg-gray-700 text-blue-400" : ""}`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isItalic ? "bg-gray-700 text-blue-400" : ""}`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isUnderline ? "bg-gray-700 text-blue-400" : ""}`}
        title="Underline (Ctrl+U)"
      >
        <Underline size={14} />
      </button>
      <button
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isStrikethrough ? "bg-gray-700 text-blue-400" : ""}`}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>
      <div className="w-px h-4 bg-gray-600 mx-0.5" />
      <button
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
        title="Bullet List"
      >
        <List size={14} />
      </button>
      <button
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </button>
    </div>
  );
}
