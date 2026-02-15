"use client";

import { ChevronDown, Plus, Trash2, X as XIcon } from "lucide-react";
import type { ProjectEntry } from "@/lib/cv-builder-types";

interface ProjectsSectionProps {
  projects: ProjectEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<ProjectEntry>) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function ProjectsSection({
  projects,
  onAdd,
  onUpdate,
  onDelete,
  expanded,
  onToggle,
}: ProjectsSectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <h2 className="font-serif text-lg font-bold">Projects</h2>
        <ChevronDown
          size={20}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-start gap-3">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => onUpdate(project.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  onClick={() => onDelete(project.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <textarea
                placeholder="Project Description"
                value={project.description}
                onChange={(e) => onUpdate(project.id, { description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Project Link (optional)"
                value={project.link}
                onChange={(e) => onUpdate(project.id, { link: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={project.startDate}
                  onChange={(e) => onUpdate(project.id, { startDate: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={project.endDate}
                  onChange={(e) => onUpdate(project.id, { endDate: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Technologies</label>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tech}
                      <button
                        onClick={() => {
                          const newTechs = project.technologies.filter((_, i) => i !== idx);
                          onUpdate(project.id, { technologies: newTechs });
                        }}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add technology..."
                    id={`tech-${project.id}`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          onUpdate(project.id, {
                            technologies: [...project.technologies, input.value],
                          });
                          input.value = "";
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} /> Add Project
          </button>
        </div>
      )}
    </div>
  );
}
