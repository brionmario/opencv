"use client";

import { Plus, Trash2, X as XIcon } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";

interface MinimalWysiwygTemplateProps {
  data: CVData;
  onUpdate: (path: string, value: any) => void;
  onAddExperience: () => void;
  onDeleteExperience: (id: string) => void;
  onAddEducation: () => void;
  onDeleteEducation: (id: string) => void;
  onAddSkill: () => void;
  onDeleteSkill: (id: string) => void;
  onAddAward: () => void;
  onDeleteAward: (id: string) => void;
  onAddSocialLink: () => void;
  onDeleteSocialLink: (id: string) => void;
  onAddLanguage: () => void;
  onDeleteLanguage: (name: string) => void;
  onPhotoUpload: (dataUrl: string) => void;
}

function SectionActions({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
    >
      <Plus size={14} /> Add
    </button>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
    >
      <Trash2 size={12} />
    </button>
  );
}

export function MinimalWysiwygTemplate({
  data,
  onUpdate,
  onAddExperience,
  onDeleteExperience,
  onAddEducation,
  onDeleteEducation,
  onAddSkill,
  onDeleteSkill,
  onAddLanguage,
  onDeleteLanguage,
}: MinimalWysiwygTemplateProps) {
  return (
    <div className="bg-gray-50 p-8 font-sans" style={{ width: "8.5in", minHeight: "11in" }}>
      <div className="max-w-3xl mx-auto bg-white p-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            <InlineEditor
              value={data.personalInfo.fullName}
              onChange={(v) => onUpdate("personalInfo.fullName", v)}
              placeholder="Your Name"
              className="font-serif text-3xl font-bold text-gray-900"
            />
          </h1>
          <div className="text-gray-600 mt-2">
            <InlineEditor
              value={data.personalInfo.jobTitle}
              onChange={(v) => onUpdate("personalInfo.jobTitle", v)}
              placeholder="Job Title"
              className="text-gray-600"
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500 mt-4">
            <InlineEditor
              value={data.personalInfo.email}
              onChange={(v) => onUpdate("personalInfo.email", v)}
              placeholder="Email"
              className="text-xs text-gray-500"
            />
            <InlineEditor
              value={data.personalInfo.phone}
              onChange={(v) => onUpdate("personalInfo.phone", v)}
              placeholder="Phone"
              className="text-xs text-gray-500"
            />
            <InlineEditor
              value={data.personalInfo.location}
              onChange={(v) => onUpdate("personalInfo.location", v)}
              placeholder="Location"
              className="text-xs text-gray-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mb-12 pb-6 border-b border-gray-300">
          <InlineEditor
            value={data.personalInfo.summary}
            onChange={(v) => onUpdate("personalInfo.summary", v)}
            placeholder="Professional summary..."
            richText
            multiline
            className="text-sm text-gray-700 leading-relaxed"
          />
        </div>

        {/* Experience */}
        <div className="mb-12 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Experience</h2>
            <SectionActions onAdd={onAddExperience} />
          </div>
          <div className="space-y-8">
            {data.experience.map((exp) => (
              <div key={exp.id} className="group/item relative">
                <div className="absolute -left-5 top-0">
                  <DeleteButton onDelete={() => onDeleteExperience(exp.id)} />
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-serif font-bold text-gray-900 text-sm">
                    <InlineEditor
                      value={exp.jobTitle}
                      onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                      placeholder="Job Title"
                      className="font-serif font-bold text-gray-900 text-sm"
                    />
                  </h3>
                  <div className="text-xs text-gray-500 flex gap-1 items-center flex-shrink-0">
                    <InlineEditor
                      value={exp.startDate}
                      onChange={(v) => onUpdate(`experience.${exp.id}.startDate`, v)}
                      placeholder="Start"
                      className="text-xs text-gray-500"
                    />
                    <span>-</span>
                    <InlineEditor
                      value={exp.endDate || (exp.currentlyWorking ? "now" : "")}
                      onChange={(v) => onUpdate(`experience.${exp.id}.endDate`, v)}
                      placeholder="End"
                      className="text-xs text-gray-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  <InlineEditor
                    value={exp.company}
                    onChange={(v) => onUpdate(`experience.${exp.id}.company`, v)}
                    placeholder="Company"
                    className="text-xs text-gray-600"
                  />
                </div>
                {exp.description && (
                  <div className="text-xs text-gray-700 leading-relaxed">
                    <InlineEditor
                      value={exp.description}
                      onChange={(v) => onUpdate(`experience.${exp.id}.description`, v)}
                      placeholder="Description..."
                      className="text-xs text-gray-700 leading-relaxed"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-12 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Education</h2>
            <SectionActions onAdd={onAddEducation} />
          </div>
          <div className="space-y-6">
            {data.education.map((edu) => (
              <div key={edu.id} className="group/item relative">
                <div className="absolute -left-5 top-0">
                  <DeleteButton onDelete={() => onDeleteEducation(edu.id)} />
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-serif font-bold text-gray-900 text-sm">
                    <InlineEditor
                      value={edu.degree}
                      onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                      placeholder="Degree"
                      className="font-serif font-bold text-gray-900 text-sm"
                    />
                  </h3>
                  <div className="text-xs text-gray-500 flex gap-1 items-center flex-shrink-0">
                    <InlineEditor
                      value={edu.startDate}
                      onChange={(v) => onUpdate(`education.${edu.id}.startDate`, v)}
                      placeholder="Start"
                      className="text-xs text-gray-500"
                    />
                    <span>-</span>
                    <InlineEditor
                      value={edu.endDate}
                      onChange={(v) => onUpdate(`education.${edu.id}.endDate`, v)}
                      placeholder="End"
                      className="text-xs text-gray-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <InlineEditor
                    value={edu.institution}
                    onChange={(v) => onUpdate(`education.${edu.id}.institution`, v)}
                    placeholder="Institution"
                    className="text-xs text-gray-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-12 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Skills</h2>
            <SectionActions onAdd={onAddSkill} />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="group/skill inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
              >
                <InlineEditor
                  value={skill.name}
                  onChange={(v) => onUpdate(`skills.${skill.id}.name`, v)}
                  placeholder="Skill"
                  className="text-xs text-gray-700"
                />
                <button
                  onClick={() => onDeleteSkill(skill.id)}
                  className="text-red-400 opacity-0 group-hover/skill:opacity-100 transition-opacity print:hidden"
                >
                  <XIcon size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Languages</h2>
              <SectionActions onAdd={onAddLanguage} />
            </div>
            <div className="flex gap-6">
              {data.languages.map((lang) => (
                <div key={lang.name} className="group/item flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-900">{lang.name}</p>
                  <DeleteButton onDelete={() => onDeleteLanguage(lang.name)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
