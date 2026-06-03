"use client";

import { Trash2, Plus } from "lucide-react";
import type { ReactNode } from "react";

interface EditableCardProps {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
}

export function EditableCard({ children, onDelete, className = "" }: EditableCardProps) {
  return (
    <div
      className={`relative border border-gray-200 rounded-lg p-4 hover:border-teal-400 transition-colors group/card print:border-transparent ${className}`}
    >
      {children}
      <button
        onClick={onDelete}
        className="absolute -top-2.5 -right-2.5 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover/card:opacity-100 transition-opacity print:hidden"
        title="Remove"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

interface AddItemButtonProps {
  onAdd: () => void;
  label?: string;
}

export function AddItemButton({ onAdd, label }: AddItemButtonProps) {
  return (
    <div className="flex justify-center mt-2 print:hidden">
      <button
        onClick={onAdd}
        title={label ? `Add ${label}` : "Add item"}
        className="w-7 h-7 rounded-full border-2 border-teal-500 text-teal-500 flex items-center justify-center hover:bg-teal-50 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
