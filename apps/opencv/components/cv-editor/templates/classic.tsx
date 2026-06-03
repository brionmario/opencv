"use client";

import { X as XIcon, Plus } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";
import { EditableCard, AddItemButton } from "../editable-card";
import { Icon } from "@/lib/icons";

interface ClassicWysiwygTemplateProps {
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

export function ClassicWysiwygTemplate({
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
}: ClassicWysiwygTemplateProps) {
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
    <div className="bg-white p-10 font-sans" style={{ width: "8.5in", minHeight: "11in" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header - Centered */}
        <div className="text-center mb-8 pb-8 border-b-2 border-gray-300">
          <h1 className="font-serif text-5xl font-bold text-gray-900 mb-2">
            <InlineEditor
              value={data.personalInfo.fullName}
              onChange={(v) => onUpdate("personalInfo.fullName", v)}
              placeholder="Your Name"
              className="font-serif text-5xl font-bold text-gray-900"
            />
          </h1>
          <div className="text-lg text-gray-700 mb-4">
            <InlineEditor
              value={data.personalInfo.jobTitle}
              onChange={(v) => onUpdate("personalInfo.jobTitle", v)}
              placeholder="Job Title"
              className="text-lg text-gray-700"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <InlineEditor
              value={data.personalInfo.email}
              onChange={(v) => onUpdate("personalInfo.email", v)}
              placeholder="Email"
              className="text-sm text-gray-600"
            />
            <span>&#8226;</span>
            <InlineEditor
              value={data.personalInfo.phone}
              onChange={(v) => onUpdate("personalInfo.phone", v)}
              placeholder="Phone"
              className="text-sm text-gray-600"
            />
            <span>&#8226;</span>
            <InlineEditor
              value={data.personalInfo.location}
              onChange={(v) => onUpdate("personalInfo.location", v)}
              placeholder="Location"
              className="text-sm text-gray-600"
            />
          </div>
        </div>

        {/* Profile */}
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">PROFILE</h2>
          <InlineEditor
            value={data.personalInfo.summary}
            onChange={(v) => onUpdate("personalInfo.summary", v)}
            placeholder="Professional summary..."
            richText
            multiline
            className="text-gray-700 leading-relaxed"
          />
        </div>

        {/* Experience */}
        <div className="mb-8">
          <div className="mb-4 pb-2 border-b-2 border-gray-300">
            <h2 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-wide">PROFESSIONAL EXPERIENCE</h2>
          </div>
          <div className="space-y-3">
            {data.experience.map((exp) => (
              <EditableCard key={exp.id} onDelete={() => onDeleteExperience(exp.id)}>
                <div className="flex justify-between items-baseline mb-1 pr-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900">
                    <InlineEditor
                      value={exp.jobTitle}
                      onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                      placeholder="Job Title"
                      className="font-serif text-lg font-bold text-gray-900"
                    />
                  </h3>
                  <div className="text-xs text-gray-600 flex gap-1 items-center shrink-0">
                    <InlineEditor
                      value={exp.startDate}
                      onChange={(v) => onUpdate(`experience.${exp.id}.startDate`, v)}
                      placeholder="Start"
                      className="text-xs text-gray-600"
                    />
                    <span>-</span>
                    <InlineEditor
                      value={exp.endDate || (exp.currentlyWorking ? "Present" : "")}
                      onChange={(v) => onUpdate(`experience.${exp.id}.endDate`, v)}
                      placeholder="End"
                      className="text-xs text-gray-600"
                    />
                  </div>
                </div>
                <div className="text-gray-700 font-semibold mb-1">
                  <InlineEditor
                    value={exp.company}
                    onChange={(v) => onUpdate(`experience.${exp.id}.company`, v)}
                    placeholder="Company"
                    className="text-gray-700 font-semibold"
                  />
                </div>
                {exp.description && (
                  <div className="text-gray-700 text-sm mb-2">
                    <InlineEditor
                      value={exp.description}
                      onChange={(v) => onUpdate(`experience.${exp.id}.description`, v)}
                      placeholder="Description..."
                      className="text-gray-700 text-sm"
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
                        className="text-red-400 opacity-0 group-hover/highlight:opacity-100 transition-opacity print:hidden"
                      >
                        <XIcon size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleHighlightAdd(exp.id, exp.highlights)}
                  className="flex items-center gap-1 text-xs text-blue-500 mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity print:hidden"
                >
                  <Plus size={12} /> Add highlight
                </button>
              </EditableCard>
            ))}
          </div>
          <AddItemButton onAdd={onAddExperience} label="experience" />
        </div>

        {/* Education */}
        <div className="mb-8">
          <div className="mb-4 pb-2 border-b-2 border-gray-300">
            <h2 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-wide">EDUCATION</h2>
          </div>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <EditableCard key={edu.id} onDelete={() => onDeleteEducation(edu.id)}>
                <div className="flex justify-between items-baseline mb-1 pr-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900">
                    <InlineEditor
                      value={edu.degree}
                      onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                      placeholder="Degree"
                      className="font-serif text-lg font-bold text-gray-900"
                    />
                  </h3>
                  <div className="text-xs text-gray-600 flex gap-1 items-center shrink-0">
                    <InlineEditor
                      value={edu.startDate}
                      onChange={(v) => onUpdate(`education.${edu.id}.startDate`, v)}
                      placeholder="Start"
                      className="text-xs text-gray-600"
                    />
                    <span>-</span>
                    <InlineEditor
                      value={edu.endDate}
                      onChange={(v) => onUpdate(`education.${edu.id}.endDate`, v)}
                      placeholder="End"
                      className="text-xs text-gray-600"
                    />
                  </div>
                </div>
                <div className="text-gray-700 font-semibold">
                  <InlineEditor
                    value={edu.institution}
                    onChange={(v) => onUpdate(`education.${edu.id}.institution`, v)}
                    placeholder="Institution"
                    className="text-gray-700 font-semibold"
                  />
                </div>
              </EditableCard>
            ))}
          </div>
          <AddItemButton onAdd={onAddEducation} label="education" />
        </div>

        {/* Skills */}
        <div className="mb-8">
          <div className="mb-4 pb-2 border-b-2 border-gray-300">
            <h2 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-wide">SKILLS</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill.id}
                className="group/skill inline-flex items-center gap-1 bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
              >
                <InlineEditor
                  value={skill.name}
                  onChange={(v) => onUpdate(`skills.${skill.id}.name`, v)}
                  placeholder="Skill"
                  className="text-xs text-gray-800"
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
          <AddItemButton onAdd={onAddSkill} label="skill" />
        </div>

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 pb-2 border-b-2 border-gray-300">
              <h2 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-wide">LANGUAGES</h2>
            </div>
            <div className="flex flex-wrap gap-6">
              {data.languages.map((lang, langIdx) => (
                <div key={langIdx} className="group/lang flex items-center gap-2">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      <InlineEditor
                        value={lang.name}
                        onChange={(v) => onUpdate(`languages.${lang.name}.name`, v)}
                        placeholder="Language"
                        className="font-semibold text-gray-900 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {["Beginner", "Intermediate", "Advanced", "Expert", "Fluent"][lang.proficiency - 1]}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteLanguage(lang.name)}
                    className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover/lang:opacity-100 transition-opacity print:hidden"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
            <AddItemButton onAdd={onAddLanguage} label="language" />
          </div>
        )}

        {/* Publications */}
        {data.publications && data.publications.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 pb-2 border-b-2 border-gray-300">
              <h2 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-wide">PUBLICATIONS</h2>
            </div>
            <div className="space-y-3">
              {data.publications.map((pub) => (
                <EditableCard key={pub.id} onDelete={() => onDeletePublication(pub.id)}>
                  <h3 className="font-serif text-lg font-bold text-gray-900">
                    <InlineEditor
                      value={pub.title}
                      onChange={(v) => onUpdate(`publications.${pub.id}.title`, v)}
                      placeholder="Publication Title"
                      className="font-serif text-lg font-bold text-gray-900"
                    />
                  </h3>
                  <div className="text-gray-700 font-semibold mb-1">
                    <InlineEditor
                      value={pub.publisher}
                      onChange={(v) => onUpdate(`publications.${pub.id}.publisher`, v)}
                      placeholder="Publisher"
                      className="text-gray-700 font-semibold"
                    />
                    {" • "}
                    <InlineEditor
                      value={pub.date}
                      onChange={(v) => onUpdate(`publications.${pub.id}.date`, v)}
                      placeholder="Date"
                      className="text-gray-700 font-semibold"
                    />
                  </div>
                  {pub.description && (
                    <div className="text-gray-700 text-sm">
                      <InlineEditor
                        value={pub.description}
                        onChange={(v) => onUpdate(`publications.${pub.id}.description`, v)}
                        placeholder="Description..."
                        className="text-gray-700 text-sm"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <Icon name="link" size={10} className="text-gray-400 shrink-0" />
                    <InlineEditor
                      value={pub.link || ""}
                      onChange={(v) => onUpdate(`publications.${pub.id}.link`, v)}
                      placeholder="Add URL..."
                      className="text-xs text-blue-600"
                    />
                  </div>
                </EditableCard>
              ))}
            </div>
            <AddItemButton onAdd={onAddPublication} label="publication" />
          </div>
        )}
      </div>
    </div>
  );
}
