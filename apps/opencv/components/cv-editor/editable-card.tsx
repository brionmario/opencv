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
      className={`relative group/card rounded-sm hover:ring-1 hover:ring-teal-400 ring-offset-0 print:ring-0 ${className}`}
      style={{ breakInside: "avoid" }}
    >
      {children}
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover/card:opacity-100 transition-opacity print:hidden z-10"
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
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover/section:opacity-100 transition-opacity print:hidden z-10">
      <button
        onClick={onAdd}
        title={label ? `Add ${label}` : "Add item"}
        className="w-7 h-7 rounded-full border-2 border-teal-500 text-teal-500 flex items-center justify-center bg-white hover:bg-teal-50 shadow-sm transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
