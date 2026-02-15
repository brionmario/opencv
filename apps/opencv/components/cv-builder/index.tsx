"use client";

import { useState, useEffect } from "react";
import { useCVData } from "@/hooks/use-cv-data";
import { exportToJSON, exportToMarkdown, exportToHTML, exportToPDF } from "@/lib/export-handler";
import { LinkedInImport } from "./linkedin-import";
import { VersionHistory } from "./version-history";
import { TemplatePicker } from "@/components/cv-editor/template-picker";
import { ProfessionalTemplate } from "@/components/cv-editor/templates/professional";
import { ModernWysiwygTemplate } from "@/components/cv-editor/templates/modern";
import { ClassicWysiwygTemplate } from "@/components/cv-editor/templates/classic";
import { MinimalWysiwygTemplate } from "@/components/cv-editor/templates/minimal";
import { Download, FileJson, FileText, FileCode, Linkedin, Clock, X, RotateCcw } from "lucide-react";
import type { CVVersion } from "@/lib/cv-versioning";
import type { StarterTemplate } from "@/lib/starter-templates";

type LayoutType = "professional" | "modern" | "classic" | "minimal";

export function CVBuilder() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("professional");
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data,
    updatePersonalInfo,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addSkill,
    deleteSkill,
    addAward,
    deleteAward,
    addPublication,
    deletePublication,
    addSocialLink,
    deleteSocialLink,
    addLanguage,
    deleteLanguage,
    updateField,
    resetData,
    importData,
    versions,
    createSavepoint,
    restoreSavepoint,
    removeSavepoint,
    updateSavepointLabel,
  } = useCVData();

  // Check if user has saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem("cvBuilderData");
    const savedLayout = localStorage.getItem("cvBuilderLayout");
    if (saved) {
      setIsInitialized(true);
      if (savedLayout) {
        setSelectedLayout(savedLayout as LayoutType);
      }
    } else {
      setShowTemplatePicker(true);
    }
    setIsInitialized(true);
  }, []);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem("cvBuilderLayout", selectedLayout);
  }, [selectedLayout]);

  const handleTemplateSelect = (template: StarterTemplate) => {
    importData(template.data);
    setSelectedLayout(template.defaultLayout);
    setShowTemplatePicker(false);
  };

  const handleExportHTML = () => {
    const html = document.getElementById("cv-preview")?.innerHTML;
    if (html) {
      exportToHTML(html, data, `${data.personalInfo.fullName.replace(/\s+/g, "_")}_CV.html`);
    }
  };

  const handleExportJSON = () => {
    exportToJSON(data, `${data.personalInfo.fullName.replace(/\s+/g, "_")}_CV.json`);
  };

  const handleExportMarkdown = () => {
    exportToMarkdown(data, `${data.personalInfo.fullName.replace(/\s+/g, "_")}_CV.md`);
  };

  const handleExportPDF = () => {
    const html = document.getElementById("cv-preview")?.innerHTML;
    if (html) {
      exportToPDF(html, data, `${data.personalInfo.fullName.replace(/\s+/g, "_")}_CV.pdf`);
    }
  };

  const handleLinkedInImport = (linkedInData: any) => {
    importData({
      ...data,
      personalInfo: { ...data.personalInfo, ...linkedInData.personalInfo },
      experience: [...data.experience, ...(linkedInData.experience || [])],
      education: [...data.education, ...(linkedInData.education || [])],
      skills: [...data.skills, ...(linkedInData.skills || [])],
    });
  };

  const handleExportVersion = (version: CVVersion) => {
    exportToJSON(version.data, `${data.personalInfo.fullName.replace(/\s+/g, "_")}_CV_${version.label.replace(/\s+/g, "_")}.json`);
  };

  const handleNewCV = () => {
    resetData();
    setShowTemplatePicker(true);
  };

  const handlePhotoUpload = (dataUrl: string) => {
    updatePersonalInfo({ avatar: dataUrl });
  };

  const layouts = [
    { id: "professional" as const, name: "Professional" },
    { id: "modern" as const, name: "Modern" },
    { id: "classic" as const, name: "Classic" },
    { id: "minimal" as const, name: "Minimal" },
  ];

  // Common template props
  const templateProps = {
    data,
    onUpdate: updateField,
    onAddExperience: () =>
      addExperience({
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        currentlyWorking: false,
        location: "",
        description: "",
        highlights: [],
      }),
    onDeleteExperience: deleteExperience,
    onAddEducation: () =>
      addEducation({
        degree: "",
        institution: "",
        field: "",
        startDate: "",
        endDate: "",
        description: "",
      }),
    onDeleteEducation: deleteEducation,
    onAddSkill: () => addSkill({ name: "" }),
    onDeleteSkill: deleteSkill,
    onAddAward: () => addAward({ title: "", issuer: "", date: "" }),
    onDeleteAward: deleteAward,
    onAddPublication: () => addPublication({ title: "", publisher: "", date: "" }),
    onDeletePublication: deletePublication,
    onAddSocialLink: () => addSocialLink({ platform: "", url: "" }),
    onDeleteSocialLink: deleteSocialLink,
    onAddLanguage: () => addLanguage({ name: "Language", proficiency: 3 }),
    onDeleteLanguage: deleteLanguage,
    onPhotoUpload: handlePhotoUpload,
  };

  if (showTemplatePicker) {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  if (!isInitialized) {
    return null;
  }

  const renderTemplate = () => {
    switch (selectedLayout) {
      case "professional":
        return <ProfessionalTemplate {...templateProps} />;
      case "modern":
        return <ModernWysiwygTemplate {...templateProps} />;
      case "classic":
        return <ClassicWysiwygTemplate {...templateProps} />;
      case "minimal":
        return <MinimalWysiwygTemplate {...templateProps} />;
      default:
        return <ProfessionalTemplate {...templateProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Top Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[9in] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {/* Layout Switcher */}
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedLayout === layout.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {layout.name}
              </button>
            ))}
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => setShowLinkedInImport(true)}
              className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              <Linkedin size={14} />
              Import
            </button>
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              <Clock size={14} />
              History ({versions.length})
            </button>
            <button
              onClick={handleNewCV}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <RotateCcw size={14} />
              New
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportHTML}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <FileCode size={14} />
              HTML
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <FileJson size={14} />
              JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              <FileText size={14} />
              MD
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* WYSIWYG Editor Area */}
      <div className="py-8 px-4">
        <div
          id="cv-preview"
          className="bg-white shadow-xl mx-auto"
          style={{ maxWidth: "8.5in", minHeight: "11in" }}
        >
          {renderTemplate()}
        </div>
      </div>

      {/* LinkedIn Import Modal */}
      <LinkedInImport
        isOpen={showLinkedInImport}
        onClose={() => setShowLinkedInImport(false)}
        onImport={handleLinkedInImport}
      />

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="fixed inset-0 z-[60] bg-black/50">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-serif text-lg font-bold">Version History</h2>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <VersionHistory
                versions={versions}
                onRestore={restoreSavepoint}
                onDelete={removeSavepoint}
                onRename={updateSavepointLabel}
                onExport={handleExportVersion}
              />
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => createSavepoint(`Manual save - ${new Date().toLocaleString()}`)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
