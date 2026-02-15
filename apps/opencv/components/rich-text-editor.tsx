'use client';

import { useRef, useState } from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="flex gap-1 p-2 border-b bg-gray-50 flex-wrap">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('bold');
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('italic');
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('underline');
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('insertUnorderedList');
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        className="w-full px-3 py-2 min-h-24 outline-none focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
