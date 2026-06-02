'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import type { CVData, ExperienceEntry, EducationEntry, SkillEntry, ProjectEntry, CertificationEntry, AwardEntry, ReferenceEntry, VolunteeringEntry, StrengthEntry, InterestEntry, PublicationEntry, SocialLinkEntry } from "@/lib/cv-builder-types";
import { saveVersion, loadVersionHistory, restoreVersion, deleteVersion, renameVersion, type CVVersion } from "@/lib/cv-versioning";

function encodeDataForUrl(data: CVData): string {
  try {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(binary);
  } catch {
    return '';
  }
}

function decodeDataFromUrl(encoded: string): CVData | null {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as CVData;
  } catch {
    return null;
  }
}

function setUrlParam(key: string, value: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url.toString());
}

function removeUrlParam(key: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  window.history.replaceState(null, '', url.toString());
}

const DEFAULT_CV_DATA: CVData = {
  personalInfo: {
    fullName: "Your Name",
    jobTitle: "Your Job Title",
    email: "email@example.com",
    phone: "+1 (555) 123-4567",
    location: "City, Country",
    website: "www.example.com",
    summary: "Brief professional summary goes here",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  awards: [],
  references: [],
  volunteering: [],
  strengths: [],
  interests: [],
  publications: [],
  languages: [],
  socialLinks: [],
};

export function useCVData() {
  const [data, setData] = useState<CVData>(DEFAULT_CV_DATA);
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const isFirstSaveRef = useRef(true);

  // Load from URL (priority) or localStorage on mount
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get('data');
    if (urlParam) {
      const decoded = decodeDataFromUrl(urlParam);
      if (decoded) {
        setData(decoded);
        const history = loadVersionHistory();
        setVersions(history.versions);
        return;
      }
    }

    const saved = localStorage.getItem("cvBuilderData");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load CV data:", err);
      }
    }

    // Load version history
    const history = loadVersionHistory();
    setVersions(history.versions);
  }, []);

  // Save to localStorage and URL whenever data changes
  useEffect(() => {
    // Skip the first render to avoid overwriting URL before the load effect reads it
    if (isFirstSaveRef.current) {
      isFirstSaveRef.current = false;
      return;
    }

    localStorage.setItem("cvBuilderData", JSON.stringify(data));

    const encoded = encodeDataForUrl(data);
    if (encoded) {
      setUrlParam('data', encoded);
    }

    // Auto-save version every 30 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveVersion(data, `Auto-save - ${new Date().toLocaleTimeString()}`);
      setVersions(loadVersionHistory().versions);
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [data]);

  const updatePersonalInfo = useCallback((info: Partial<CVData["personalInfo"]>) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info },
    }));
  }, []);

  const addExperience = useCallback((entry: Omit<ExperienceEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...entry, id: Date.now().toString() }],
    }));
  }, []);

  const updateExperience = useCallback((id: string, updates: Partial<ExperienceEntry>) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    }));
  }, []);

  const deleteExperience = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  }, []);

  const addEducation = useCallback((entry: Omit<EducationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      education: [...prev.education, { ...entry, id: Date.now().toString() }],
    }));
  }, []);

  const updateEducation = useCallback((id: string, updates: Partial<EducationEntry>) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
    }));
  }, []);

  const deleteEducation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  const addSkill = useCallback((skill: Omit<SkillEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      skills: [...prev.skills, { ...skill, id: Date.now().toString() }],
    }));
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<SkillEntry>) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) => (skill.id === id ? { ...skill, ...updates } : skill)),
    }));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  }, []);

  const addProject = useCallback((project: Omit<ProjectEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, { ...project, id: Date.now().toString() }],
    }));
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<ProjectEntry>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj)),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  }, []);

  const addCertification = useCallback((cert: Omit<CertificationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { ...cert, id: Date.now().toString() }],
    }));
  }, []);

  const updateCertification = useCallback((id: string, updates: Partial<CertificationEntry>) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) => (cert.id === id ? { ...cert, ...updates } : cert)),
    }));
  }, []);

  const deleteCertification = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  }, []);

  const addLanguage = useCallback((lang: { name: string; proficiency: 1 | 2 | 3 | 4 | 5 }) => {
    setData((prev) => ({
      ...prev,
      languages: [...prev.languages, lang],
    }));
  }, []);

  const updateLanguage = useCallback((name: string, proficiency: 1 | 2 | 3 | 4 | 5) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.map((lang) => (lang.name === name ? { ...lang, proficiency } : lang)),
    }));
  }, []);

  const deleteLanguage = useCallback((name: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang.name !== name),
    }));
  }, []);

  const resetData = useCallback(() => {
    setData(DEFAULT_CV_DATA);
    localStorage.removeItem("cvBuilderData");
    removeUrlParam('data');
  }, []);

  const importData = useCallback((importedData: CVData) => {
    setData(importedData);
  }, []);

  const createSavepoint = useCallback((label?: string) => {
    const version = saveVersion(data, label);
    setVersions(loadVersionHistory().versions);
    return version;
  }, [data]);

  const restoreSavepoint = useCallback((versionId: string) => {
    const restoredData = restoreVersion(versionId);
    if (restoredData) {
      setData(restoredData);
      localStorage.setItem("cvBuilderData", JSON.stringify(restoredData));
    }
  }, []);

  const removeSavepoint = useCallback((versionId: string) => {
    deleteVersion(versionId);
    setVersions(loadVersionHistory().versions);
  }, []);

  const updateSavepointLabel = useCallback((versionId: string, newLabel: string) => {
    renameVersion(versionId, newLabel);
    setVersions(loadVersionHistory().versions);
  }, []);

  const addAward = useCallback((award: Omit<AwardEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      awards: [...prev.awards, { ...award, id: Date.now().toString() }],
    }));
  }, []);

  const updateAward = useCallback((id: string, updates: Partial<AwardEntry>) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.map((award) => (award.id === id ? { ...award, ...updates } : award)),
    }));
  }, []);

  const deleteAward = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.filter((award) => award.id !== id),
    }));
  }, []);

  const addReference = useCallback((ref: Omit<ReferenceEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      references: [...prev.references, { ...ref, id: Date.now().toString() }],
    }));
  }, []);

  const updateReference = useCallback((id: string, updates: Partial<ReferenceEntry>) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.map((ref) => (ref.id === id ? { ...ref, ...updates } : ref)),
    }));
  }, []);

  const deleteReference = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.filter((ref) => ref.id !== id),
    }));
  }, []);

  const addVolunteering = useCallback((vol: Omit<VolunteeringEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      volunteering: [...prev.volunteering, { ...vol, id: Date.now().toString() }],
    }));
  }, []);

  const updateVolunteering = useCallback((id: string, updates: Partial<VolunteeringEntry>) => {
    setData((prev) => ({
      ...prev,
      volunteering: prev.volunteering.map((vol) => (vol.id === id ? { ...vol, ...updates } : vol)),
    }));
  }, []);

  const deleteVolunteering = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      volunteering: prev.volunteering.filter((vol) => vol.id !== id),
    }));
  }, []);

  const addStrength = useCallback((strength: Omit<StrengthEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      strengths: [...prev.strengths, { ...strength, id: Date.now().toString() }],
    }));
  }, []);

  const updateStrength = useCallback((id: string, updates: Partial<StrengthEntry>) => {
    setData((prev) => ({
      ...prev,
      strengths: prev.strengths.map((strength) => (strength.id === id ? { ...strength, ...updates } : strength)),
    }));
  }, []);

  const deleteStrength = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      strengths: prev.strengths.filter((strength) => strength.id !== id),
    }));
  }, []);

  const addInterest = useCallback((interest: Omit<InterestEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      interests: [...prev.interests, { ...interest, id: Date.now().toString() }],
    }));
  }, []);

  const updateInterest = useCallback((id: string, updates: Partial<InterestEntry>) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.map((interest) => (interest.id === id ? { ...interest, ...updates } : interest)),
    }));
  }, []);

  const deleteInterest = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.filter((interest) => interest.id !== id),
    }));
  }, []);

  const addPublication = useCallback((pub: Omit<PublicationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      publications: [...prev.publications, { ...pub, id: Date.now().toString() }],
    }));
  }, []);

  const updatePublication = useCallback((id: string, updates: Partial<PublicationEntry>) => {
    setData((prev) => ({
      ...prev,
      publications: prev.publications.map((pub) => (pub.id === id ? { ...pub, ...updates } : pub)),
    }));
  }, []);

  const deletePublication = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      publications: prev.publications.filter((pub) => pub.id !== id),
    }));
  }, []);

  const addSocialLink = useCallback((link: Omit<SocialLinkEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { ...link, id: Date.now().toString() }],
    }));
  }, []);

  const updateSocialLink = useCallback((id: string, updates: Partial<SocialLinkEntry>) => {
    setData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).map((link) => (link.id === id ? { ...link, ...updates } : link)),
    }));
  }, []);

  const deleteSocialLink = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((link) => link.id !== id),
    }));
  }, []);

  // Generic path-based update for WYSIWYG inline editing
  const updateField = useCallback((path: string, value: any) => {
    setData((prev) => {
      const newData = { ...prev };
      const parts = path.split(".");

      if (parts[0] === "personalInfo" && parts.length === 2) {
        newData.personalInfo = { ...newData.personalInfo, [parts[1]]: value };
      } else if (parts.length === 3) {
        const collection = parts[0] as keyof CVData;
        const id = parts[1];
        const field = parts[2];

        if (collection === "languages") {
          // Languages use name as key
          newData.languages = newData.languages.map((lang) =>
            lang.name === id ? { ...lang, [field]: value } : lang
          );
        } else if (Array.isArray(newData[collection])) {
          (newData as any)[collection] = (newData[collection] as any[]).map((item: any) =>
            item.id === id ? { ...item, [field]: value } : item
          );
        }
      }

      return newData;
    });
  }, []);

  return {
    data,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    addSkill,
    updateSkill,
    deleteSkill,
    addProject,
    updateProject,
    deleteProject,
    addCertification,
    updateCertification,
    deleteCertification,
    addAward,
    updateAward,
    deleteAward,
    addReference,
    updateReference,
    deleteReference,
    addVolunteering,
    updateVolunteering,
    deleteVolunteering,
    addStrength,
    updateStrength,
    deleteStrength,
    addInterest,
    updateInterest,
    deleteInterest,
    addPublication,
    updatePublication,
    deletePublication,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    addSocialLink,
    updateSocialLink,
    deleteSocialLink,
    updateField,
    resetData,
    importData,
    versions,
    createSavepoint,
    restoreSavepoint,
    removeSavepoint,
    updateSavepointLabel,
  };
}
