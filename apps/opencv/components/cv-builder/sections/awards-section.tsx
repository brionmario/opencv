"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { AwardEntry } from "@/lib/cv-builder-types";

interface AwardsSectionProps {
  awards: AwardEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<AwardEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function AwardsSection({
  awards,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: AwardsSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Awards</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {awards.map((award) => (
            <div key={award.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Award Title"
                  value={award.title}
                  onChange={(e) => onUpdate(award.id, { title: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(award.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Issuing Organization"
                value={award.issuer}
                onChange={(e) => onUpdate(award.id, { issuer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={award.date}
                onChange={(e) => onUpdate(award.id, { date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={award.description || ""}
                onChange={(e) => onUpdate(award.id, { description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} /> Add Award
          </button>
        </div>
      )}
    </div>
  );
}
