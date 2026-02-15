"use client";

import { ChevronDown, Plus, Trash2, X as XIcon } from "lucide-react";
import type { VolunteeringEntry, StrengthEntry, InterestEntry, PublicationEntry } from "@/lib/cv-builder-types";

interface VolunteeringSectionProps {
  volunteering: VolunteeringEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<VolunteeringEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function VolunteeringSection({
  volunteering,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: VolunteeringSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Volunteering</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {volunteering.map((vol) => (
            <div key={vol.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Volunteer Role"
                  value={vol.role}
                  onChange={(e) => onUpdate(vol.id, { role: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(vol.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Organization"
                value={vol.organization}
                onChange={(e) => onUpdate(vol.id, { organization: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Location (optional)"
                value={vol.location || ""}
                onChange={(e) => onUpdate(vol.id, { location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={vol.startDate}
                  onChange={(e) => onUpdate(vol.id, { startDate: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={vol.endDate}
                  onChange={(e) => onUpdate(vol.id, { endDate: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                placeholder="Description"
                value={vol.description}
                onChange={(e) => onUpdate(vol.id, { description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} /> Add Volunteering
          </button>
        </div>
      )}
    </div>
  );
}

interface StrengthsSectionProps {
  strengths: StrengthEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<StrengthEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function StrengthsSection({
  strengths,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: StrengthsSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Strengths</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {strengths.map((strength) => (
            <div key={strength.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Strength Title"
                  value={strength.title}
                  onChange={(e) => onUpdate(strength.id, { title: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(strength.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <textarea
                placeholder="Description"
                value={strength.description}
                onChange={(e) => onUpdate(strength.id, { description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} /> Add Strength
          </button>
        </div>
      )}
    </div>
  );
}

interface InterestsSectionProps {
  interests: InterestEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<InterestEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function InterestsSection({
  interests,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: InterestsSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Interests</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <div
                key={interest.id}
                className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {interest.name}
                <button
                  onClick={() => onDelete(interest.id)}
                  className="hover:text-green-900"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add an interest..."
              id="interest-input"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const input = e.currentTarget;
                  if (input.value.trim()) {
                    onAdd();
                    input.value = "";
                  }
                }
              }}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const input = document.getElementById("interest-input") as HTMLInputElement;
                if (input?.value.trim()) {
                  onAdd();
                  input.value = "";
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PublicationsSectionProps {
  publications: PublicationEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<PublicationEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function PublicationsSection({
  publications,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: PublicationsSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Publications</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {publications.map((pub) => (
            <div key={pub.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Publication Title"
                  value={pub.title}
                  onChange={(e) => onUpdate(pub.id, { title: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(pub.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Publisher"
                value={pub.publisher}
                onChange={(e) => onUpdate(pub.id, { publisher: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={pub.date}
                onChange={(e) => onUpdate(pub.id, { date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Publication Link (optional)"
                value={pub.link || ""}
                onChange={(e) => onUpdate(pub.id, { link: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={pub.description || ""}
                onChange={(e) => onUpdate(pub.id, { description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} /> Add Publication
          </button>
        </div>
      )}
    </div>
  );
}
