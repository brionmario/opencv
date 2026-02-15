"use client";

import { Plus, Trash2, Upload, X as XIcon } from "lucide-react";
import type { CVData } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";
import { Icon, getSocialIconName } from "@/lib/icons";

interface ProfessionalTemplateProps {
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
      title={`Add ${label}`}
    >
      <Plus size={14} />
      Add
    </button>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
      title="Remove"
    >
      <Trash2 size={12} />
    </button>
  );
}


export function ProfessionalTemplate({
  data,
  onUpdate,
  onAddExperience,
  onDeleteExperience,
  onAddEducation,
  onDeleteEducation,
  onAddSkill,
  onDeleteSkill,
  onAddAward,
  onDeleteAward,
  onAddPublication,
  onDeletePublication,
  onAddSocialLink,
  onDeleteSocialLink,
  onAddLanguage,
  onDeleteLanguage,
  onPhotoUpload,
}: ProfessionalTemplateProps) {
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
    <div className="bg-white font-sans text-gray-800" style={{ width: "8.5in", minHeight: "11in" }}>
      {/* Header */}
      <div className="px-10 pt-8 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              <InlineEditor
                value={data.personalInfo.fullName}
                onChange={(v) => onUpdate("personalInfo.fullName", v)}
                placeholder="Your Name"
                className="text-4xl font-bold text-gray-900 tracking-tight"
              />
            </h1>
            <div className="text-lg text-pink-600 font-semibold mt-1">
              <InlineEditor
                value={data.personalInfo.jobTitle}
                onChange={(v) => onUpdate("personalInfo.jobTitle", v)}
                placeholder="Job Title"
                className="text-lg text-pink-600 font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Icon name="phone" className="text-pink-600" />
                <InlineEditor
                  value={data.personalInfo.phone}
                  onChange={(v) => onUpdate("personalInfo.phone", v)}
                  placeholder="+1 555-123-4567"
                  className="text-sm text-gray-600"
                />
              </span>
              <span className="flex items-center gap-1">
                <Icon name="email" className="text-pink-600" />
                <InlineEditor
                  value={data.personalInfo.email}
                  onChange={(v) => onUpdate("personalInfo.email", v)}
                  placeholder="email@example.com"
                  className="text-sm text-gray-600"
                />
              </span>
              <span className="flex items-center gap-1">
                <Icon name="link" className="text-pink-600" />
                <InlineEditor
                  value={data.personalInfo.website}
                  onChange={(v) => onUpdate("personalInfo.website", v)}
                  placeholder="www.example.com"
                  className="text-sm text-gray-600"
                />
              </span>
              <span className="flex items-center gap-1">
                <Icon name="location" className="text-pink-600" />
                <InlineEditor
                  value={data.personalInfo.location}
                  onChange={(v) => onUpdate("personalInfo.location", v)}
                  placeholder="City, Country"
                  className="text-sm text-gray-600"
                />
              </span>
            </div>
          </div>

          {/* Photo */}
          <div className="ml-6 flex-shrink-0">
            {data.personalInfo.avatar ? (
              <div className="relative group">
                <img
                  src={data.personalInfo.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  onClick={() => onUpdate("personalInfo.avatar", undefined)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-pink-400 transition-colors print:hidden">
                <Upload size={20} className="text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        onPhotoUpload(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex px-10 pb-8 gap-8">
        {/* Left Column - 60% */}
        <div className="w-[58%] space-y-6">
          {/* Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b-2 border-pink-600">
              Summary
            </h2>
            <InlineEditor
              value={data.personalInfo.summary}
              onChange={(v) => onUpdate("personalInfo.summary", v)}
              placeholder="Brief professional summary..."
              richText
              multiline
              className="text-sm text-gray-700 leading-relaxed"
            />
          </div>

          {/* Experience */}
          <div className="group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Experience
              </h2>
              <SectionActions onAdd={onAddExperience} label="experience" />
            </div>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="group/item relative">
                  <div className="absolute -left-5 top-0">
                    <DeleteButton onDelete={() => onDeleteExperience(exp.id)} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">
                      <InlineEditor
                        value={exp.jobTitle}
                        onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                        placeholder="Job Title"
                        className="font-bold text-gray-900"
                      />
                    </h3>
                  </div>
                  <div className="text-pink-600 font-semibold text-sm">
                    <InlineEditor
                      value={exp.company}
                      onChange={(v) => onUpdate(`experience.${exp.id}.company`, v)}
                      placeholder="Company Name"
                      className="text-pink-600 font-semibold text-sm"
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Icon name="calendar" className="text-gray-400" />
                      <InlineEditor
                        value={exp.startDate}
                        onChange={(v) => onUpdate(`experience.${exp.id}.startDate`, v)}
                        placeholder="Start Date"
                        className="text-xs text-gray-500"
                      />
                      <span>-</span>
                      <InlineEditor
                        value={exp.endDate || (exp.currentlyWorking ? "Present" : "")}
                        onChange={(v) => onUpdate(`experience.${exp.id}.endDate`, v)}
                        placeholder="End Date"
                        className="text-xs text-gray-500"
                      />
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="location" className="text-gray-400" />
                      <InlineEditor
                        value={exp.location}
                        onChange={(v) => onUpdate(`experience.${exp.id}.location`, v)}
                        placeholder="Location"
                        className="text-xs text-gray-500"
                      />
                    </span>
                  </div>
                  {exp.description && (
                    <div className="text-sm text-gray-700 mt-1">
                      <InlineEditor
                        value={exp.description}
                        onChange={(v) => onUpdate(`experience.${exp.id}.description`, v)}
                        placeholder="Description..."
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                  {/* Highlights */}
                  <ul className="mt-2 space-y-1">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 group/highlight">
                        <span className="text-gray-400 mt-0.5 text-xs">&#8226;</span>
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
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover/highlight:opacity-100 transition-opacity print:hidden mt-0.5"
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
        </div>

        {/* Right Column - 40% */}
        <div className="w-[42%] space-y-6">
          {/* Skills */}
          <div className="group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Skills
              </h2>
              <SectionActions onAdd={onAddSkill} label="skill" />
            </div>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="group/skill inline-flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-800 text-xs px-3 py-1.5 rounded"
                >
                  <InlineEditor
                    value={skill.name}
                    onChange={(v) => onUpdate(`skills.${skill.id}.name`, v)}
                    placeholder="Skill"
                    className="text-xs text-gray-800"
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

          {/* Education */}
          <div className="group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Education
              </h2>
              <SectionActions onAdd={onAddEducation} label="education" />
            </div>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="group/item relative">
                  <div className="absolute -left-5 top-0">
                    <DeleteButton onDelete={() => onDeleteEducation(edu.id)} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    <InlineEditor
                      value={edu.degree}
                      onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                      placeholder="Degree"
                      className="font-bold text-gray-900 text-sm"
                    />
                  </h3>
                  <div className="text-pink-600 font-medium text-sm">
                    <InlineEditor
                      value={edu.institution}
                      onChange={(v) => onUpdate(`education.${edu.id}.institution`, v)}
                      placeholder="Institution"
                      className="text-pink-600 font-medium text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Icon name="calendar" className="text-gray-400" />
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
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Achievements */}
          <div className="group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Key Achievements
              </h2>
              <SectionActions onAdd={onAddAward} label="achievement" />
            </div>
            <div className="space-y-3">
              {data.awards.map((award) => (
                <div key={award.id} className="group/item relative flex gap-2">
                  <Icon name="award" className="text-pink-600 mt-0.5" size={16} />
                  <div className="flex-1">
                    <div className="absolute -left-5 top-0">
                      <DeleteButton onDelete={() => onDeleteAward(award.id)} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      <InlineEditor
                        value={award.title}
                        onChange={(v) => onUpdate(`awards.${award.id}.title`, v)}
                        placeholder="Achievement Title"
                        className="font-bold text-gray-900 text-sm"
                      />
                    </h4>
                    <div className="text-xs text-gray-600">
                      <InlineEditor
                        value={award.description || ""}
                        onChange={(v) => onUpdate(`awards.${award.id}.description`, v)}
                        placeholder="Description..."
                        className="text-xs text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publications */}
          {data.publications && data.publications.length > 0 && (
            <div className="group">
              <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                  Publications
                </h2>
                <SectionActions onAdd={onAddPublication} label="publication" />
              </div>
              <div className="space-y-3">
                {data.publications.map((pub) => (
                  <div key={pub.id} className="group/item relative flex gap-2">
                    <Icon name="book" className="text-pink-600 mt-0.5" size={16} />
                    <div className="flex-1">
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
                        {" • "}
                        <InlineEditor
                          value={pub.date}
                          onChange={(v) => onUpdate(`publications.${pub.id}.date`, v)}
                          placeholder="Date"
                          className="text-xs text-gray-600"
                        />
                      </div>
                      {pub.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          <InlineEditor
                            value={pub.description}
                            onChange={(v) => onUpdate(`publications.${pub.id}.description`, v)}
                            placeholder="Description..."
                            className="text-xs text-gray-600"
                          />
                        </div>
                      )}
                      {pub.link && (
                        <div className="text-xs text-blue-600 mt-1">
                          <InlineEditor
                            value={pub.link}
                            onChange={(v) => onUpdate(`publications.${pub.id}.link`, v)}
                            placeholder="Link..."
                            className="text-xs text-blue-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Find Me Online */}
          {data.socialLinks && data.socialLinks.length > 0 && (
            <div className="group">
              <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                  Find Me Online
                </h2>
                <SectionActions onAdd={onAddSocialLink} label="link" />
              </div>
              <div className="space-y-2">
                {data.socialLinks.map((link) => (
                  <div key={link.id} className="group/item flex items-center gap-2">
                    <Icon name={getSocialIconName(link.platform)} className="text-gray-600" size={16} />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-xs">
                        <InlineEditor
                          value={link.platform}
                          onChange={(v) => onUpdate(`socialLinks.${link.id}.platform`, v)}
                          placeholder="Platform"
                          className="font-bold text-gray-900 text-xs"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <InlineEditor
                          value={link.url}
                          onChange={(v) => onUpdate(`socialLinks.${link.id}.url`, v)}
                          placeholder="https://..."
                          className="text-xs text-gray-500"
                        />
                      </div>
                    </div>
                    <DeleteButton onDelete={() => onDeleteSocialLink(link.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          <div className="group">
            <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Languages
              </h2>
              <SectionActions onAdd={onAddLanguage} label="language" />
            </div>
            <div className="space-y-2">
              {data.languages.map((lang) => (
                <div key={lang.name} className="group/item flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{lang.name}</p>
                    <p className="text-xs text-gray-500">
                      {["Beginner", "Elementary", "Intermediate", "Proficient", "Fluent"][lang.proficiency - 1]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <button
                            key={i}
                            onClick={() => onUpdate(`languages.${lang.name}.proficiency`, (i + 1) as 1 | 2 | 3 | 4 | 5)}
                            className={`w-3.5 h-3.5 rounded-full transition-colors ${
                              i < lang.proficiency ? "bg-blue-600" : "bg-gray-300"
                            } hover:bg-blue-400 print:pointer-events-none`}
                          />
                        ))}
                    </div>
                    <DeleteButton onDelete={() => onDeleteLanguage(lang.name)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
