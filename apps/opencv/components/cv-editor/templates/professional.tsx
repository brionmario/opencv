"use client";

import { useState } from "react";
import { Upload, X as XIcon, Plus } from "lucide-react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";
import { EditableCard, AddItemButton } from "../editable-card";
import { Icon, resolveSocialLinkIcon, ICON_PICKER_OPTIONS } from "@/lib/icons";

interface ProfessionalTemplateProps {
  data: CVData;
  theme?: CVTheme;
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

export function ProfessionalTemplate({
  data,
  theme: themeProp,
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
  const theme = themeProp ?? DEFAULT_THEME;
  const [iconPickerOpenId, setIconPickerOpenId] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState("");
  const handleHighlightAdd = (expId: string, highlights: string[]) => {
    onUpdate(`experience.${expId}.highlights`, [...highlights, ""]);
  };

  const handleHighlightUpdate = (expId: string, highlights: string[], idx: number, value: string) => {
    if (value.includes("\n")) {
      // Enter on last char — split at newline into separate bullets
      const lines = value.split("\n").map((l) => l.trim()).filter((l) => l !== "");
      const updated = [...highlights];
      updated.splice(idx, 1, ...(lines.length ? lines : [""]));
      onUpdate(`experience.${expId}.highlights`, updated);
    } else {
      const updated = [...highlights];
      updated[idx] = value;
      onUpdate(`experience.${expId}.highlights`, updated);
    }
  };

  const handleHighlightDelete = (expId: string, highlights: string[], idx: number) => {
    onUpdate(`experience.${expId}.highlights`, highlights.filter((_, i) => i !== idx));
  };

  return (
    <div
      data-cv-professional=""
      className="font-sans text-gray-800"
      style={{
        width: "8.5in",
        minHeight: "11in",
        fontFamily: theme.fontFace,
        color: theme.bodyColor,
        backgroundColor: theme.backgroundColor,
        fontSize: `${theme.bodyFontSize}px`,
        fontWeight: theme.bodyWeight,
      }}
    >
      <style>{`
        [data-cv-professional] h1 { font-size: ${theme.nameFontSize}px !important; font-weight: ${theme.nameWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-professional] h2 { font-size: ${theme.sectionFontSize}px !important; font-weight: ${theme.headingWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-professional] h3, [data-cv-professional] h4 { color: ${theme.headingColor} !important; }
        [data-cv-professional] .text-pink-600 { color: ${theme.primaryColor} !important; }
        [data-cv-professional] .border-pink-600 { border-color: ${theme.primaryColor} !important; }
        [data-cv-professional] .bg-blue-600 { background-color: ${theme.primaryColor} !important; }
        [data-cv-professional] .text-blue-600 { color: ${theme.primaryColor} !important; }
        [data-cv-professional] .text-blue-500 { color: ${theme.primaryColor} !important; }
      `}</style>
      {/* Header */}
      <div className="px-10 pt-8 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight">
              <InlineEditor
                value={data.personalInfo.fullName}
                onChange={(v) => onUpdate("personalInfo.fullName", v)}
                placeholder="Your Name"
                className="text-4xl font-bold tracking-tight"
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
          <div className="ml-6 shrink-0">
            {data.personalInfo.avatar ? (
              <div className="relative group/photo">
                <img
                  src={data.personalInfo.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  onClick={() => onUpdate("personalInfo.avatar", undefined)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity print:hidden"
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
          <div className="relative group/section">
            <div className="mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Experience</h2>
            </div>
            <div className="space-y-3 mt-3">
              {data.experience.map((exp) => (
                <EditableCard key={exp.id} onDelete={() => onDeleteExperience(exp.id)}>
                  <div className="flex justify-between items-start pr-4">
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
                        richText
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                  <ul className="mt-2 space-y-1">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 group/highlight">
                        <span className="text-gray-400 mt-0.5 text-xs">&#8226;</span>
                        <div className="flex-1 text-sm text-gray-700">
                          <InlineEditor
                            value={highlight}
                            onChange={(v) => handleHighlightUpdate(exp.id, exp.highlights, idx, v)}
                            placeholder="Highlight..."
                            richText
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
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity print:hidden"
                  >
                    <Plus size={12} /> Add highlight
                  </button>
                </EditableCard>
              ))}
            </div>
            <AddItemButton onAdd={onAddExperience} label="experience" />
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="w-[42%] space-y-6">
          {/* Skills */}
          <div className="relative group/section">
            <div className="mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
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
            <AddItemButton onAdd={onAddSkill} label="skill" />
          </div>

          {/* Education */}
          <div className="relative group/section">
            <div className="mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Education</h2>
            </div>
            <div className="space-y-3 mt-2">
              {data.education.map((edu) => (
                <EditableCard key={edu.id} onDelete={() => onDeleteEducation(edu.id)}>
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
                </EditableCard>
              ))}
            </div>
            <AddItemButton onAdd={onAddEducation} label="education" />
          </div>

          {/* Key Achievements */}
          <div className="relative group/section">
            <div className="mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Key Achievements</h2>
            </div>
            <div className="space-y-3 mt-2">
              {data.awards.map((award) => (
                <EditableCard key={award.id} onDelete={() => onDeleteAward(award.id)}>
                  <div className="flex gap-2">
                    <Icon name="award" className="text-pink-600 mt-0.5 shrink-0" size={16} />
                    <div className="flex-1">
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
                </EditableCard>
              ))}
            </div>
            <AddItemButton onAdd={onAddAward} label="achievement" />
          </div>

          {/* Publications */}
          {data.publications && data.publications.length > 0 && (
            <div className="relative group/section">
              <div className="mb-2 pb-1 border-b-2 border-pink-600">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Publications</h2>
              </div>
              <div className="space-y-3 mt-2">
                {data.publications.map((pub) => (
                  <EditableCard key={pub.id} onDelete={() => onDeletePublication(pub.id)}>
                    <div className="flex gap-2">
                      <Icon name="link" className="text-pink-600 mt-0.5 shrink-0" size={16} />
                      <div className="flex-1">
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
                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                          <Icon name="link" size={10} className="text-gray-400 shrink-0" />
                          <InlineEditor
                            value={pub.link || ""}
                            onChange={(v) => onUpdate(`publications.${pub.id}.link`, v)}
                            placeholder="Add URL..."
                            className="text-xs text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </EditableCard>
                ))}
              </div>
              <AddItemButton onAdd={onAddPublication} label="publication" />
            </div>
          )}

          {/* Find Me Online */}
          {data.socialLinks && data.socialLinks.length > 0 && (
            <div className="relative group/section">
              <div className="mb-2 pb-1 border-b-2 border-pink-600">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Find Me Online</h2>
              </div>
              <div className="space-y-2 mt-2">
                {data.socialLinks.map((link) => {
                  const resolved = resolveSocialLinkIcon(link.icon, link.platform);
                  return (
                    <EditableCard key={link.id} onDelete={() => onDeleteSocialLink(link.id)}>
                      <div className="flex items-center gap-2">
                        {/* Icon — click to open picker */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => {
                              setCustomIconUrl("");
                              setIconPickerOpenId(iconPickerOpenId === link.id ? null : link.id);
                            }}
                            title="Change icon"
                            className="p-1 rounded hover:bg-gray-100 transition-colors print:hidden"
                          >
                            {resolved.type === "url" ? (
                              <img src={resolved.url} className="w-4 h-4 object-contain" alt="" />
                            ) : (
                              <Icon name={resolved.name} className="text-gray-600" size={16} />
                            )}
                          </button>
                          {iconPickerOpenId === link.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-56 print:hidden">
                              <p className="text-xs text-gray-500 mb-2 font-medium">Choose icon</p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {ICON_PICKER_OPTIONS.map(({ key, label }) => (
                                  <button
                                    key={key}
                                    title={label}
                                    onClick={() => {
                                      onUpdate(`socialLinks.${link.id}.icon`, key);
                                      setIconPickerOpenId(null);
                                    }}
                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors border ${
                                      (link.icon || "") === key ? "border-blue-400 bg-blue-50" : "border-transparent"
                                    }`}
                                  >
                                    <Icon name={key} size={16} className="text-gray-700" />
                                  </button>
                                ))}
                              </div>
                              <div className="border-t border-gray-100 pt-2">
                                <p className="text-xs text-gray-500 mb-1">Custom image URL</p>
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={customIconUrl}
                                  onChange={(e) => setCustomIconUrl(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && customIconUrl.startsWith("http")) {
                                      onUpdate(`socialLinks.${link.id}.icon`, customIconUrl);
                                      setIconPickerOpenId(null);
                                    }
                                    if (e.key === "Escape") setIconPickerOpenId(null);
                                  }}
                                  className="w-full text-xs px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>
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
                      </div>
                    </EditableCard>
                  );
                })}
              </div>
              <AddItemButton onAdd={onAddSocialLink} label="link" />
            </div>
          )}

          {/* Languages */}
          <div className="relative group/section">
            <div className="mb-2 pb-1 border-b-2 border-pink-600">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Languages</h2>
            </div>
            <div className="space-y-2 mt-2">
              {data.languages.map((lang, langIdx) => (
                <div key={langIdx} className="group/lang flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      <InlineEditor
                        value={lang.name}
                        onChange={(v) => onUpdate(`languages.${lang.name}.name`, v)}
                        placeholder="Language"
                        className="font-bold text-gray-900 text-sm"
                      />
                    </div>
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
                            onClick={() =>
                              onUpdate(`languages.${lang.name}.proficiency`, (i + 1) as 1 | 2 | 3 | 4 | 5)
                            }
                            className={`w-3.5 h-3.5 rounded-full transition-colors ${
                              i < lang.proficiency ? "bg-blue-600" : "bg-gray-300"
                            } hover:bg-blue-400 print:pointer-events-none`}
                          />
                        ))}
                    </div>
                    <button
                      onClick={() => onDeleteLanguage(lang.name)}
                      className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover/lang:opacity-100 transition-opacity print:hidden"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <AddItemButton onAdd={onAddLanguage} label="language" />
          </div>
        </div>
      </div>
    </div>
  );
}
