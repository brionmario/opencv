"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { AddItemButton } from "../../cv-editor/editable-card";
import type { ReferenceEntry } from "@/lib/cv-builder-types";

interface ReferencesSectionProps {
  references: ReferenceEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<ReferenceEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function ReferencesSection({
  references,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: ReferencesSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">References</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {references.map((ref) => (
            <div key={ref.id} className="p-4 border border-gray-200 rounded-lg space-y-3 hover:border-teal-400 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Reference Name"
                  value={ref.name}
                  onChange={(e) => onUpdate(ref.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(ref.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={ref.title}
                  onChange={(e) => onUpdate(ref.id, { title: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={ref.company}
                  onChange={(e) => onUpdate(ref.id, { company: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={ref.email || ""}
                  onChange={(e) => onUpdate(ref.id, { email: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={ref.phone || ""}
                  onChange={(e) => onUpdate(ref.id, { phone: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
          <AddItemButton onAdd={onAdd} label="reference" />
        </div>
      )}
    </div>
  );
}
