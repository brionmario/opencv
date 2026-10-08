"use client";

import { useState } from "react";
import { Trash2, X as XIcon, Plus } from "lucide-react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";
import { EditableCard, AddItemButton } from "../editable-card";
import { CustomSectionBlock } from "../custom-section-block";
import { Icon, resolveSocialLinkIcon, ICON_PICKER_OPTIONS } from "@/lib/icons";
import { sectionsForColumn } from "@/lib/cv-sections";

interface ModernWysiwygTemplateProps {
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
  onAddReference: () => void;
  onDeleteReference: (id: string) => void;
  onAddSocialLink: () => void;
  onDeleteSocialLink: (id: string) => void;
  onAddLanguage: () => void;
  onDeleteLanguage: (name: string) => void;
  onPhotoUpload: (dataUrl: string) => void;
  onDeleteCustomSection: (sectionId: string) => void;
  onUpdateCustomSectionTitle: (sectionId: string, title: string) => void;
  onAddCustomSectionItem: (sectionId: string) => void;
  onUpdateCustomSectionItem: (sectionId: string, itemId: string, field: "title" | "subtitle" | "meta" | "description", value: string) => void;
  onDeleteCustomSectionItem: (sectionId: string, itemId: string) => void;
}

export function ModernWysiwygTemplate({
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
  onAddLanguage,
  onDeleteLanguage,
  onAddPublication,
  onDeletePublication,
  onAddReference,
  onDeleteReference,
  onAddSocialLink,
  onDeleteSocialLink,
  onPhotoUpload,
  onDeleteCustomSection,
  onUpdateCustomSectionTitle,
  onAddCustomSectionItem,
  onUpdateCustomSectionItem,
  onDeleteCustomSectionItem,
}: ModernWysiwygTemplateProps) {
  const theme = themeProp ?? DEFAULT_THEME;
  const [iconPickerOpenId, setIconPickerOpenId] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState("");
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

  /* ── Section registry — one renderer per section id, reused by both
     columns. Order/visibility/column placement is driven entirely by
     sectionsForColumn(); this map only knows how to draw each section. ── */
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    summary: () => (
      <div key="summary" className="mb-8 pb-8 border-b border-gray-200">
        <InlineEditor
          value={data.personalInfo.summary}
          onChange={(v) => onUpdate("personalInfo.summary", v)}
          placeholder="Professional summary..."
          richText
          multiline
          className="text-gray-700 leading-relaxed"
        />
      </div>
    ),

    experience: () => (
      <div key="experience">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-2xl font-bold text-gray-900">EXPERIENCE</h2>
        </div>
        <div className="space-y-3">
          {data.experience.map((exp) => (
            <EditableCard key={exp.id} onDelete={() => onDeleteExperience(exp.id)}>
              <div className="flex justify-between items-start mb-1 pr-4">
                <h3 className="font-serif text-lg font-bold text-gray-900">
                  <InlineEditor
                    value={exp.jobTitle}
                    onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                    placeholder="Job Title"
                    className="font-serif text-lg font-bold text-gray-900"
                  />
                </h3>
                <div className="text-sm text-gray-600 flex gap-1 items-center shrink-0">
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
                        richText
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
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity print:hidden"
              >
                <Plus size={12} /> Add highlight
              </button>
            </EditableCard>
          ))}
        </div>
        <AddItemButton onAdd={onAddExperience} label="experience" />
      </div>
    ),

    education: () => (
      <div key="education">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-2xl font-bold text-gray-900">EDUCATION</h2>
        </div>
        <div className="space-y-3">
          {data.education.map((edu) => (
            <EditableCard key={edu.id} onDelete={() => onDeleteEducation(edu.id)}>
              <div className="flex justify-between items-start mb-1 pr-4">
                <h3 className="font-serif font-bold text-gray-900">
                  <InlineEditor
                    value={edu.degree}
                    onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                    placeholder="Degree"
                    className="font-serif font-bold text-gray-900"
                  />
                </h3>
                <div className="text-sm text-gray-600 flex gap-1 items-center shrink-0">
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
            </EditableCard>
          ))}
        </div>
        <AddItemButton onAdd={onAddEducation} label="education" />
      </div>
    ),

    skills: () => (
      <div key="skills">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-lg font-bold text-gray-900">SKILLS</h2>
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
        <AddItemButton onAdd={onAddSkill} label="skill" />
      </div>
    ),

    awards: () => (
      <div key="awards">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-lg font-bold text-gray-900">KEY ACHIEVEMENTS</h2>
        </div>
        <div className="space-y-3">
          {data.awards.map((award) => (
            <EditableCard key={award.id} onDelete={() => onDeleteAward(award.id)}>
              <div className="flex gap-2">
                <Icon name="award" className="text-blue-600 mt-0.5 shrink-0" size={16} />
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-gray-900 text-sm">
                    <InlineEditor
                      value={award.title}
                      onChange={(v) => onUpdate(`awards.${award.id}.title`, v)}
                      placeholder="Achievement Title"
                      className="font-serif font-bold text-gray-900 text-sm"
                    />
                  </h4>
                  <div className="text-xs text-gray-600 mt-0.5">
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
    ),

    publications: () => (
      <div key="publications">
        {data.publications && data.publications.length > 0 && (
          <>
            <div className="mb-4 pb-2 border-b-2 border-gray-900">
              <h2 className="font-serif text-lg font-bold text-gray-900">PUBLICATIONS</h2>
            </div>
            <div className="space-y-3">
              {data.publications.map((pub) => (
                <EditableCard key={pub.id} onDelete={() => onDeletePublication(pub.id)}>
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
                  <div className="flex items-center gap-1 text-xs mt-1">
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
          </>
        )}
      </div>
    ),

    references: () => (
      <div key="references">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-lg font-bold text-gray-900">REFERENCES</h2>
        </div>
        <div className="space-y-3">
          {data.references.map((ref) => (
            <EditableCard key={ref.id} onDelete={() => onDeleteReference(ref.id)}>
              <h4 className="font-serif font-bold text-gray-900 text-sm">
                <InlineEditor
                  value={ref.name}
                  onChange={(v) => onUpdate(`references.${ref.id}.name`, v)}
                  placeholder="Full Name"
                  className="font-serif font-bold text-gray-900 text-sm"
                />
              </h4>
              <div className="text-blue-600 font-medium text-sm">
                <InlineEditor
                  value={ref.title}
                  onChange={(v) => onUpdate(`references.${ref.id}.title`, v)}
                  placeholder="Designation"
                  className="text-blue-600 font-medium text-sm"
                />
              </div>
              <div className="text-xs text-gray-600">
                <InlineEditor
                  value={ref.company}
                  onChange={(v) => onUpdate(`references.${ref.id}.company`, v)}
                  placeholder="Company / Organization"
                  className="text-xs text-gray-600"
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                <InlineEditor
                  value={ref.phone || ""}
                  onChange={(v) => onUpdate(`references.${ref.id}.phone`, v)}
                  placeholder="Contact Number"
                  className="text-xs text-gray-500"
                />
                <InlineEditor
                  value={ref.email || ""}
                  onChange={(v) => onUpdate(`references.${ref.id}.email`, v)}
                  placeholder="Email Address"
                  className="text-xs text-gray-500"
                />
              </div>
            </EditableCard>
          ))}
        </div>
        <AddItemButton onAdd={onAddReference} label="reference" />
      </div>
    ),

    socialLinks: () => (
      <div key="socialLinks">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-lg font-bold text-gray-900">FIND ME ONLINE</h2>
        </div>
        <div className="space-y-2">
          {(data.socialLinks || []).map((link) => {
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
                      className="p-1 rounded hover:bg-blue-50 transition-colors print:hidden"
                    >
                      {resolved.type === "url" ? (
                        <img src={resolved.url} className="w-4 h-4 object-contain" alt="" />
                      ) : (
                        <Icon name={resolved.name} className="text-blue-600" size={16} />
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
                              className={`p-1.5 rounded hover:bg-blue-50 transition-colors border ${
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
                    <div className="font-serif font-bold text-gray-900 text-xs">
                      <InlineEditor
                        value={link.platform}
                        onChange={(v) => onUpdate(`socialLinks.${link.id}.platform`, v)}
                        placeholder="Platform"
                        className="font-serif font-bold text-gray-900 text-xs"
                      />
                    </div>
                    <div className="text-xs text-blue-600">
                      <InlineEditor
                        value={link.url}
                        onChange={(v) => onUpdate(`socialLinks.${link.id}.url`, v)}
                        placeholder="https://..."
                        className="text-xs text-blue-600"
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
    ),

    languages: () => (
      <div key="languages">
        <div className="mb-4 pb-2 border-b-2 border-gray-900">
          <h2 className="font-serif text-lg font-bold text-gray-900">LANGUAGES</h2>
        </div>
        <div className="space-y-2">
          {data.languages.map((lang, langIdx) => (
            <div key={langIdx} className="group/lang">
              <div className="font-medium text-gray-900 text-sm mb-1">
                <InlineEditor
                  value={lang.name}
                  onChange={(v) => onUpdate(`languages.${lang.name}.name`, v)}
                  placeholder="Language"
                  className="font-medium text-gray-900 text-sm"
                />
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
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          i < lang.proficiency ? "bg-blue-600" : "bg-gray-300"
                        } hover:bg-blue-400`}
                      />
                    ))}
                </div>
                <button
                  onClick={() => onDeleteLanguage(lang.name)}
                  className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover/lang:opacity-100 transition-opacity print:hidden"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <AddItemButton onAdd={onAddLanguage} label="language" />
      </div>
    ),
  };

  const renderSection = (id: string): React.ReactNode => {
    const builtIn = sectionRenderers[id];
    if (builtIn) return builtIn();

    const custom = data.customSections.find((s) => s.id === id);
    if (!custom) return null;
    return (
      <CustomSectionBlock
        key={id}
        section={custom}
        onUpdateTitle={(title) => onUpdateCustomSectionTitle(id, title)}
        onAddItem={() => onAddCustomSectionItem(id)}
        onUpdateItem={(itemId, field, value) => onUpdateCustomSectionItem(id, itemId, field, value)}
        onDeleteItem={(itemId) => onDeleteCustomSectionItem(id, itemId)}
        onDeleteSection={() => onDeleteCustomSection(id)}
        headingWrapClassName="mb-4 pb-2 border-b-2 border-gray-900"
        headingClassName="font-serif text-lg font-bold text-gray-900"
        itemListClassName="space-y-3"
        titleClassName="font-serif font-bold text-gray-900 text-sm"
        subtitleClassName="text-blue-600 font-medium text-sm"
        metaClassName="text-xs text-gray-500 mt-0.5"
        descClassName="text-xs text-gray-600 mt-1"
      />
    );
  };

  return (
    <div
      data-cv-modern=""
      className="p-12 font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: theme.fontFace,
        color: theme.bodyColor,
        backgroundColor: theme.backgroundColor,
        fontSize: `${theme.bodyFontSize}px`,
        fontWeight: theme.bodyWeight,
      }}
    >
      <style>{`
        [data-cv-modern] h1 { font-size: ${theme.nameFontSize}px !important; font-weight: ${theme.nameWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-modern] h2 { font-size: ${theme.sectionFontSize}px !important; font-weight: ${theme.headingWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-modern] h3, [data-cv-modern] h4 { color: ${theme.headingColor} !important; }
        [data-cv-modern] .text-blue-600 { color: ${theme.primaryColor} !important; }
        [data-cv-modern] .text-blue-800 { color: ${theme.primaryColor} !important; }
        [data-cv-modern] .bg-blue-50 { background-color: ${theme.primaryColor}18 !important; }
        [data-cv-modern] .bg-blue-600 { background-color: ${theme.primaryColor} !important; }
        [data-cv-modern] .hover\\:bg-blue-400:hover { background-color: ${theme.primaryColor}99 !important; }
        [data-cv-modern] .border-gray-900 { border-color: ${theme.headingColor} !important; }
        [data-cv-modern] .text-gray-900 { color: ${theme.headingColor} !important; }
      `}</style>
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

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {sectionsForColumn(data, "left").map((s) => renderSection(s.id))}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {sectionsForColumn(data, "right").map((s) => renderSection(s.id))}
          </div>
        </div>
      </div>
    </div>
  );
}
