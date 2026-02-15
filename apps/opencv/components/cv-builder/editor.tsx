"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2, Upload, X as XIcon } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { AISuggestions } from "./ai-suggestions";

interface EditorProps {
  data: CVData;
  onPersonalInfoChange: (updates: Partial<CVData["personalInfo"]>) => void;
  onAddExperience: () => void;
  onUpdateExperience: (id: string, updates: any) => void;
  onDeleteExperience: (id: string) => void;
  onAddEducation: () => void;
  onUpdateEducation: (id: string, updates: any) => void;
  onDeleteEducation: (id: string) => void;
  onAddSkill: () => void;
  onUpdateSkill: (id: string, updates: any) => void;
  onDeleteSkill: (id: string) => void;
}

export function CVEditor({ data, onPersonalInfoChange, ...handlers }: EditorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    experience: true,
    education: false,
    skills: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="h-screen overflow-y-auto bg-white p-6 space-y-6">
      {/* Personal Information */}
      <div className="border rounded-lg">
        <button
          onClick={() => toggleSection("personal")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h2 className="font-serif text-lg font-bold">Personal Information</h2>
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSections.personal ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSections.personal && (
          <div className="p-4 border-t space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {data.personalInfo.avatar ? (
                  <>
                    <img src={data.personalInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    <button
                      onClick={() => onPersonalInfoChange({ avatar: undefined })}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <XIcon size={14} />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full justify-center hover:bg-gray-100 transition-colors">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-500 text-center px-2">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            onPersonalInfoChange({ avatar: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Profile Photo</p>
                <p className="text-gray-500">JPG, PNG, or GIF (max 5MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={data.personalInfo.fullName}
                onChange={(e) => onPersonalInfoChange({ fullName: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={data.personalInfo.jobTitle}
                onChange={(e) => onPersonalInfoChange({ jobTitle: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={data.personalInfo.email}
                onChange={(e) => onPersonalInfoChange({ email: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={data.personalInfo.phone}
                onChange={(e) => onPersonalInfoChange({ phone: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Location"
                value={data.personalInfo.location}
                onChange={(e) => onPersonalInfoChange({ location: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Website"
                value={data.personalInfo.website}
                onChange={(e) => onPersonalInfoChange({ website: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <textarea
                placeholder="Professional Summary"
                value={data.personalInfo.summary}
                onChange={(e) => onPersonalInfoChange({ summary: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <AISuggestions
                type="summary"
                context={{
                  jobTitle: data.personalInfo.jobTitle,
                  yearsExperience: data.experience.length,
                  skills: data.skills.slice(0, 5).map((s) => s.name),
                }}
                onSelect={(suggestion) => onPersonalInfoChange({ summary: suggestion })}
                placeholder="✨ AI suggestions"
              />
            </div>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="border rounded-lg">
        <button
          onClick={() => toggleSection("experience")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h2 className="font-serif text-lg font-bold">
            Experience ({data.experience.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlers.onAddExperience();
              }}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <Plus size={20} className="text-blue-600" />
            </button>
            <ChevronDown
              size={20}
              className={`transition-transform ${expandedSections.experience ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {expandedSections.experience && (
          <div className="p-4 border-t space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif font-bold">{exp.jobTitle || "Job Title"}</h3>
                  <button
                    onClick={() => handlers.onDeleteExperience(exp.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.jobTitle}
                  onChange={(e) => handlers.onUpdateExperience(exp.id, { jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { company: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { location: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="month"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { startDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="month"
                    placeholder="End Date"
                    disabled={exp.currentlyWorking}
                    value={exp.endDate}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { endDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.currentlyWorking}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { currentlyWorking: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Currently Working</span>
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    placeholder="Job Description"
                    value={exp.description}
                    onChange={(e) => handlers.onUpdateExperience(exp.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <AISuggestions
                    type="jobDescription"
                    context={{
                      jobTitle: exp.jobTitle,
                      company: exp.company,
                    }}
                    onSelect={(suggestion) =>
                      handlers.onUpdateExperience(exp.id, {
                        description: exp.description ? `${exp.description}\n${suggestion}` : suggestion,
                      })
                    }
                    placeholder="✨ AI suggestions"
                  />
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Highlights (What you did)</label>
                    <button
                      onClick={() => {
                        const newHighlights = [...exp.highlights, ""];
                        handlers.onUpdateExperience(exp.id, { highlights: newHighlights });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Highlight
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exp.highlights.map((highlight, hIdx) => (
                      <div key={hIdx} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Highlight ${hIdx + 1}`}
                          value={highlight}
                          onChange={(e) => {
                            const newHighlights = [...exp.highlights];
                            newHighlights[hIdx] = e.target.value;
                            handlers.onUpdateExperience(exp.id, { highlights: newHighlights });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          onClick={() => {
                            const newHighlights = exp.highlights.filter((_, i) => i !== hIdx);
                            handlers.onUpdateExperience(exp.id, { highlights: newHighlights });
                          }}
                          className="p-2 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="border rounded-lg">
        <button
          onClick={() => toggleSection("education")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h2 className="font-serif text-lg font-bold">
            Education ({data.education.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlers.onAddEducation();
              }}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <Plus size={20} className="text-blue-600" />
            </button>
            <ChevronDown
              size={20}
              className={`transition-transform ${expandedSections.education ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {expandedSections.education && (
          <div className="p-4 border-t space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif font-bold">{edu.degree || "Degree"}</h3>
                  <button
                    onClick={() => handlers.onDeleteEducation(edu.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => handlers.onUpdateEducation(edu.id, { degree: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => handlers.onUpdateEducation(edu.id, { institution: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Field of Study"
                  value={edu.field}
                  onChange={(e) => handlers.onUpdateEducation(edu.id, { field: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="month"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) => handlers.onUpdateEducation(edu.id, { startDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="month"
                    placeholder="End Date"
                    value={edu.endDate}
                    onChange={(e) => handlers.onUpdateEducation(edu.id, { endDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="border rounded-lg">
        <button
          onClick={() => toggleSection("skills")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <h2 className="font-serif text-lg font-bold">
            Skills ({data.skills.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlers.onAddSkill();
              }}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <Plus size={20} className="text-blue-600" />
            </button>
            <ChevronDown
              size={20}
              className={`transition-transform ${expandedSections.skills ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {expandedSections.skills && (
          <div className="p-4 border-t space-y-4">
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  {skill.name}
                  <button
                    onClick={() => handlers.onDeleteSkill(skill.id)}
                    className="hover:text-blue-900"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a skill..."
                id="skill-input"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      handlers.onAddSkill();
                      input.value = "";
                    }
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  handlers.onAddSkill();
                  const input = document.getElementById("skill-input") as HTMLInputElement;
                  input.value = "";
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
