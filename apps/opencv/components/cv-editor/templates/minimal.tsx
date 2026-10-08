"use client";

import { useState } from "react";
import { X as XIcon } from "lucide-react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import { DEFAULT_THEME } from "@/lib/cv-builder-types";
import { InlineEditor } from "../inline-editor";
import { EditableCard, AddItemButton } from "../editable-card";
import { CustomSectionBlock } from "../custom-section-block";
import { Icon, resolveSocialLinkIcon, ICON_PICKER_OPTIONS } from "@/lib/icons";
import { sectionsFlat } from "@/lib/cv-sections";

interface MinimalWysiwygTemplateProps {
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

export function MinimalWysiwygTemplate({
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
  onDeleteCustomSection,
  onUpdateCustomSectionTitle,
  onAddCustomSectionItem,
  onUpdateCustomSectionItem,
  onDeleteCustomSectionItem,
}: MinimalWysiwygTemplateProps) {
  const theme = themeProp ?? DEFAULT_THEME;
  const [iconPickerOpenId, setIconPickerOpenId] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState("");

  /* ── Section registry — one renderer per section id. Order/visibility is
     driven entirely by sectionsFlat(); this map only knows how to draw each
     section. ── */
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    summary: () => (
      <div key="summary" className="mb-12 pb-6 border-b border-gray-300">
        <InlineEditor
          value={data.personalInfo.summary}
          onChange={(v) => onUpdate("personalInfo.summary", v)}
          placeholder="Professional summary..."
          richText
          multiline
          className="text-sm text-gray-700 leading-relaxed"
        />
      </div>
    ),

    experience: () => (
      <div key="experience" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Experience</h2>
        </div>
        <div className="space-y-3">
          {data.experience.map((exp) => (
            <EditableCard key={exp.id} onDelete={() => onDeleteExperience(exp.id)}>
              <div className="flex justify-between items-baseline mb-1 pr-4">
                <h3 className="font-serif font-bold text-gray-900 text-sm">
                  <InlineEditor
                    value={exp.jobTitle}
                    onChange={(v) => onUpdate(`experience.${exp.id}.jobTitle`, v)}
                    placeholder="Job Title"
                    className="font-serif font-bold text-gray-900 text-sm"
                  />
                </h3>
                <div className="text-xs text-gray-500 flex gap-1 items-center shrink-0">
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
            </EditableCard>
          ))}
        </div>
        <AddItemButton onAdd={onAddExperience} label="experience" />
      </div>
    ),

    education: () => (
      <div key="education" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Education</h2>
        </div>
        <div className="space-y-3">
          {data.education.map((edu) => (
            <EditableCard key={edu.id} onDelete={() => onDeleteEducation(edu.id)}>
              <div className="flex justify-between items-baseline mb-1 pr-4">
                <h3 className="font-serif font-bold text-gray-900 text-sm">
                  <InlineEditor
                    value={edu.degree}
                    onChange={(v) => onUpdate(`education.${edu.id}.degree`, v)}
                    placeholder="Degree"
                    className="font-serif font-bold text-gray-900 text-sm"
                  />
                </h3>
                <div className="text-xs text-gray-500 flex gap-1 items-center shrink-0">
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
            </EditableCard>
          ))}
        </div>
        <AddItemButton onAdd={onAddEducation} label="education" />
      </div>
    ),

    skills: () => (
      <div key="skills" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Skills</h2>
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
        <AddItemButton onAdd={onAddSkill} label="skill" />
      </div>
    ),

    awards: () => (
      <div key="awards" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Key Achievements</h2>
        </div>
        <div className="space-y-3">
          {data.awards.map((award) => (
            <EditableCard key={award.id} onDelete={() => onDeleteAward(award.id)}>
              <div className="flex gap-2">
                <Icon name="award" className="text-gray-400 mt-0.5 shrink-0" size={14} />
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-gray-900 text-sm">
                    <InlineEditor
                      value={award.title}
                      onChange={(v) => onUpdate(`awards.${award.id}.title`, v)}
                      placeholder="Achievement Title"
                      className="font-serif font-bold text-gray-900 text-sm"
                    />
                  </h3>
                  <div className="text-xs text-gray-700 leading-relaxed">
                    <InlineEditor
                      value={award.description || ""}
                      onChange={(v) => onUpdate(`awards.${award.id}.description`, v)}
                      placeholder="Description..."
                      className="text-xs text-gray-700 leading-relaxed"
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
      <div key="publications" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Publications</h2>
        </div>
        <div className="space-y-3">
          {data.publications.map((pub) => (
            <EditableCard key={pub.id} onDelete={() => onDeletePublication(pub.id)}>
              <h3 className="font-serif font-bold text-gray-900 text-sm">
                <InlineEditor
                  value={pub.title}
                  onChange={(v) => onUpdate(`publications.${pub.id}.title`, v)}
                  placeholder="Publication Title"
                  className="font-serif font-bold text-gray-900 text-sm"
                />
              </h3>
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
                <div className="text-xs text-gray-700 mt-1 leading-relaxed">
                  <InlineEditor
                    value={pub.description}
                    onChange={(v) => onUpdate(`publications.${pub.id}.description`, v)}
                    placeholder="Description..."
                    className="text-xs text-gray-700 leading-relaxed"
                  />
                </div>
              )}
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
      </div>
    ),

    references: () => (
      <div key="references" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">References</h2>
        </div>
        <div className="space-y-3">
          {data.references.map((ref) => (
            <EditableCard key={ref.id} onDelete={() => onDeleteReference(ref.id)}>
              <h3 className="font-serif font-bold text-gray-900 text-sm">
                <InlineEditor
                  value={ref.name}
                  onChange={(v) => onUpdate(`references.${ref.id}.name`, v)}
                  placeholder="Full Name"
                  className="font-serif font-bold text-gray-900 text-sm"
                />
              </h3>
              <div className="text-xs text-gray-600">
                <InlineEditor
                  value={ref.title}
                  onChange={(v) => onUpdate(`references.${ref.id}.title`, v)}
                  placeholder="Designation"
                  className="text-xs text-gray-600"
                />
              </div>
              <div className="text-xs text-gray-500">
                <InlineEditor
                  value={ref.company}
                  onChange={(v) => onUpdate(`references.${ref.id}.company`, v)}
                  placeholder="Company / Organization"
                  className="text-xs text-gray-500"
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
      <div key="socialLinks" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Find Me Online</h2>
        </div>
        <div className="space-y-2">
          {(data.socialLinks || []).map((link) => {
            const resolved = resolveSocialLinkIcon(link.icon, link.platform);
            return (
              <EditableCard key={link.id} onDelete={() => onDeleteSocialLink(link.id)}>
                <div className="flex items-center gap-2">
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
                        <img src={resolved.url} className="w-3.5 h-3.5 object-contain" alt="" />
                      ) : (
                        <Icon name={resolved.name} className="text-gray-500" size={14} />
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
                                (link.icon || "") === key ? "border-gray-400 bg-gray-50" : "border-transparent"
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
                            className="w-full text-xs px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
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
    ),

    languages: () => (
      <div key="languages" className="mb-12">
        <div className="mb-6">
          <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest">Languages</h2>
        </div>
        <div className="flex gap-6">
          {data.languages.map((lang, langIdx) => (
            <div key={langIdx} className="group/lang flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-900">
                <InlineEditor
                  value={lang.name}
                  onChange={(v) => onUpdate(`languages.${lang.name}.name`, v)}
                  placeholder="Language"
                  className="text-xs font-semibold text-gray-900"
                />
              </div>
              <button
                onClick={() => onDeleteLanguage(lang.name)}
                className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover/lang:opacity-100 transition-opacity print:hidden"
              >
                <XIcon size={10} />
              </button>
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
        wrapClassName="mb-12"
        headingWrapClassName="mb-6"
        headingClassName="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest"
        itemListClassName="space-y-3"
        titleClassName="font-serif font-bold text-gray-900 text-sm"
        subtitleClassName="text-xs text-gray-600 mb-2"
        metaClassName="text-xs text-gray-500"
        descClassName="text-xs text-gray-700 leading-relaxed"
        onUpdateTitle={(title) => onUpdateCustomSectionTitle(id, title)}
        onAddItem={() => onAddCustomSectionItem(id)}
        onUpdateItem={(itemId, field, value) => onUpdateCustomSectionItem(id, itemId, field, value)}
        onDeleteItem={(itemId) => onDeleteCustomSectionItem(id, itemId)}
        onDeleteSection={() => onDeleteCustomSection(id)}
      />
    );
  };

  return (
    <div
      data-cv-minimal=""
      className="p-8 font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: theme.fontFace,
        color: theme.bodyColor,
        backgroundColor: `${theme.backgroundColor}e0`,
        fontSize: `${theme.bodyFontSize}px`,
        fontWeight: theme.bodyWeight,
      }}
    >
      <style>{`
        [data-cv-minimal] h1 { font-size: ${theme.nameFontSize}px !important; font-weight: ${theme.nameWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-minimal] h2 { font-size: ${theme.sectionFontSize}px !important; font-weight: ${theme.headingWeight} !important; color: ${theme.headingColor} !important; }
        [data-cv-minimal] h3 { color: ${theme.headingColor} !important; }
        [data-cv-minimal] .text-blue-600 { color: ${theme.primaryColor} !important; }
        [data-cv-minimal] .text-gray-900 { color: ${theme.headingColor} !important; }
      `}</style>
      <div className="max-w-3xl mx-auto p-12" style={{ backgroundColor: theme.backgroundColor }}>
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

        {sectionsFlat(data).map((s) => renderSection(s.id))}
      </div>
    </div>
  );
}
