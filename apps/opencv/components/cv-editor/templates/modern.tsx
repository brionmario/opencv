"use client";

import { Plus, Trash2, Upload, X as XIcon } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";

interface ModernWysiwygTemplateProps {
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
  onAddPublication: () => void;
  onDeletePublication: (id: string) => void;
  onAddSocialLink: () => void;
  onDeleteSocialLink: (id: string) => void;
  onAddLanguage: () => void;
  onDeleteLanguage: (name: string) => void;
  onPhotoUpload: (dataUrl: string) => void;
}

function SectionActions({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
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

export function ModernWysiwygTemplate({
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
  onAddPublication,
  onDeletePublication,
  onPhotoUpload,
}: ModernWysiwygTemplateProps) {
  const handleHighlightAdd = (expId: string, highlights: string[]) => {
    onUpdate(`experience.${expId}.highlights`, [...highlights, ""]);
  };

  const handleHighlightUpdate = (expId: string, highlights: string[], idx: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[idx] = value;
    onUpdate(`experience.${expId}.highlights`, newHighlights);
  };

  const handleHighlightDelete = (expId: string, highlights: string[], idx: number) => {
    onUpdate(`experience.${expId}.highlights`, highlights.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white p-12 font-sans" style={{ width: "8.5in", minHeight: "11in" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">
            <InlineEditor
              value={data.personalInfo.fullName}
              onChange={(v) => onUpdate("personalInfo.fullName", v)}
              placeholder="Your Name"
              className="font-serif text-4xl font-bold text-gray-900"
            />
          </h1>
          <div className="text-xl text-blue-600 font-medium mb-4">
            <InlineEditor
              value={data.personalInfo.jobTitle}
              onChange={(v) => onUpdate("personalInfo.jobTitle", v)}
              placeholder="Job Title"
              className="text-xl text-blue-600 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <InlineEditor
              value={data.personalInfo.email}
              onChange={(v) => onUpdate("personalInfo.email", v)}
              placeholder="email@example.com"
              className="text-sm text-gray-600"
            />
            <InlineEditor
              value={data.personalInfo.phone}
              onChange={(v) => onUpdate("personalInfo.phone", v)}
              placeholder="Phone"
              className="text-sm text-gray-600"
            />
            <InlineEditor
              value={data.personalInfo.location}
              onChange={(v) => onUpdate("personalInfo.location", v)}
              placeholder="Location"
              className="text-sm text-gray-600"
            />
            <InlineEditor
              value={data.personalInfo.website}
              onChange={(v) => onUpdate("personalInfo.website", v)}
              placeholder="Website"
              className="text-sm text-blue-600"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <InlineEditor
            value={data.personalInfo.summary}
            onChange={(v) => onUpdate("personalInfo.summary", v)}
            placeholder="Professional summary..."
            richText
            multiline
            className="text-gray-700 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Experience */}
            <div className="group">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-900">
                <h2 className="font-serif text-2xl font-bold text-gray-900">EXPERIENCE</h2>
                <SectionActions onAdd={onAddExperience} label="experience" />
              </div>
              <div className="space-y-6">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="group/item relative">
                    <div className="absolute -left-5 top-0">
                      <DeleteButton onDelete={() => onDeleteExperience(exp.id)} />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-serif text-lg font-bold text-gray-900">
                        <InlineEditor
                          value={exp.jobTitle}
                          onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                          placeholder="Job Title"
                          className="font-serif text-lg font-bold text-gray-900"
                        />
                      </h3>
                      <div className="text-sm text-gray-600 flex gap-1 items-center flex-shrink-0">
                        <InlineEditor
                          value={exp.startDate}
                          onChange={(v) => onUpdate(`experience.${exp.id}.startDate`, v)}
                          placeholder="Start"
                          className="text-sm text-gray-600"
                        />
                        <span>-</span>
                        <InlineEditor
                          value={exp.endDate || (exp.currentlyWorking ? "Present" : "")}
                          onChange={(v) => onUpdate(`experience.${exp.id}.endDate`, v)}
                          placeholder="End"
                          className="text-sm text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="text-blue-600 font-medium mb-2">
                      <InlineEditor
                        value={exp.company}
                        onChange={(v) => onUpdate(`experience.${exp.id}.company`, v)}
                        placeholder="Company"
                        className="text-blue-600 font-medium"
                      />
                    </div>
                    {exp.description && (
                      <div className="text-gray-700 mb-2">
                        <InlineEditor
                          value={exp.description}
                          onChange={(v) => onUpdate(`experience.${exp.id}.description`, v)}
                          placeholder="Description..."
                          className="text-gray-700"
                        />
                      </div>
                    )}
                    <ul className="space-y-1">
                      {exp.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 group/highlight">
                          <span className="text-gray-400 mt-0.5">&#8226;</span>
                          <div className="flex-1 text-sm text-gray-700">
                            <InlineEditor
                              value={highlight}
                              onChange={(v) => handleHighlightUpdate(exp.id, exp.highlights, idx, v)}
                              placeholder="Highlight..."
                              className="text-sm text-gray-700"
                            />
                          </div>
                          <button
                            onClick={() => handleHighlightDelete(exp.id, exp.highlights, idx)}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover/highlight:opacity-100 transition-opacity print:hidden"
                          >
                            <XIcon size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleHighlightAdd(exp.id, exp.highlights)}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 opacity-0 group-hover/item:opacity-100 transition-opacity print:hidden"
                    >
                      <Plus size={12} /> Add highlight
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="group">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-900">
                <h2 className="font-serif text-2xl font-bold text-gray-900">EDUCATION</h2>
                <SectionActions onAdd={onAddEducation} label="education" />
              </div>
              <div className="space-y-4">
                {data.education.map((edu) => (
                  <div key={edu.id} className="group/item relative">
                    <div className="absolute -left-5 top-0">
                      <DeleteButton onDelete={() => onDeleteEducation(edu.id)} />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-serif font-bold text-gray-900">
                        <InlineEditor
                          value={edu.degree}
                          onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                          placeholder="Degree"
                          className="font-serif font-bold text-gray-900"
                        />
                      </h3>
                      <div className="text-sm text-gray-600 flex gap-1 items-center flex-shrink-0">
                        <InlineEditor
                          value={edu.startDate}
                          onChange={(v) => onUpdate(`education.${edu.id}.startDate`, v)}
                          placeholder="Start"
                          className="text-sm text-gray-600"
                        />
                        <span>-</span>
                        <InlineEditor
                          value={edu.endDate}
                          onChange={(v) => onUpdate(`education.${edu.id}.endDate`, v)}
                          placeholder="End"
                          className="text-sm text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="text-blue-600 font-medium">
                      <InlineEditor
                        value={edu.institution}
                        onChange={(v) => onUpdate(`education.${edu.id}.institution`, v)}
                        placeholder="Institution"
                        className="text-blue-600 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Skills */}
            <div className="group">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-900">
                <h2 className="font-serif text-lg font-bold text-gray-900">SKILLS</h2>
                <SectionActions onAdd={onAddSkill} label="skill" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="group/skill inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    <InlineEditor
                      value={skill.name}
                      onChange={(v) => onUpdate(`skills.${skill.id}.name`, v)}
                      placeholder="Skill"
                      className="text-xs text-blue-800"
                    />
                    <button
                      onClick={() => onDeleteSkill(skill.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover/skill:opacity-100 transition-opacity print:hidden"
                    >
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="group">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-900">
                <h2 className="font-serif text-lg font-bold text-gray-900">LANGUAGES</h2>
                <SectionActions onAdd={onAddLanguage} label="language" />
              </div>
              <div className="space-y-2">
                {data.languages.map((lang) => (
                  <div key={lang.name} className="group/item">
                    <p className="font-medium text-gray-900 text-sm mb-1">{lang.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <button
                              key={i}
                              onClick={() => onUpdate(`languages.${lang.name}.proficiency`, (i + 1) as 1 | 2 | 3 | 4 | 5)}
                              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                i < lang.proficiency ? "bg-blue-600" : "bg-gray-300"
                              } hover:bg-blue-400`}
                            />
                          ))}
                      </div>
                      <DeleteButton onDelete={() => onDeleteLanguage(lang.name)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publications */}
            {data.publications && data.publications.length > 0 && (
              <div className="group">
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-900">
                  <h2 className="font-serif text-lg font-bold text-gray-900">PUBLICATIONS</h2>
                  <SectionActions onAdd={onAddPublication} label="publication" />
                </div>
                <div className="space-y-3">
                  {data.publications.map((pub) => (
                    <div key={pub.id} className="group/item relative text-sm">
                      <div className="absolute -left-5 top-0">
                        <DeleteButton onDelete={() => onDeletePublication(pub.id)} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        <InlineEditor
                          value={pub.title}
                          onChange={(v) => onUpdate(`publications.${pub.id}.title`, v)}
                          placeholder="Publication Title"
                          className="font-bold text-gray-900 text-sm"
                        />
                      </h4>
                      <div className="text-xs text-gray-600">
                        <InlineEditor
                          value={pub.publisher}
                          onChange={(v) => onUpdate(`publications.${pub.id}.publisher`, v)}
                          placeholder="Publisher"
                          className="text-xs text-gray-600"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <InlineEditor
                          value={pub.date}
                          onChange={(v) => onUpdate(`publications.${pub.id}.date`, v)}
                          placeholder="Date"
                          className="text-xs text-gray-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
