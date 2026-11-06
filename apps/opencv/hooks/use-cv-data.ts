'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import type { CVData, ExperienceEntry, EducationEntry, SkillEntry, ProjectEntry, CertificationEntry, AwardEntry, ReferenceEntry, VolunteeringEntry, StrengthEntry, InterestEntry, PublicationEntry, SocialLinkEntry, CustomSection, CustomSectionItem, FieldValue } from "@/lib/cv-builder-types";
import { getEffectiveSectionOrder } from "@/lib/cv-sections";
import { saveVersion, loadVersionHistory, restoreVersion, deleteVersion, renameVersion, type CVVersion } from "@/lib/cv-versioning";
import { starterTemplates } from "@/lib/starter-templates";
import { decodeLegacyQuery, LEGACY_QUERY_KEY } from "@/lib/cv-share";
import { useHistoryState } from "@/hooks/use-history-state";

/**
 * Fills in customSections/sectionOrder for data that predates the section
 * system, or that arrived from an external source (URL, localStorage,
 * restored version) that may be missing them or carrying a partial order.
 */
function normalizeCVData(raw: CVData): CVData {
  const data: CVData = { ...raw, customSections: raw.customSections ?? [] };
  data.sectionOrder = getEffectiveSectionOrder(data);
  // Languages predate having ids and were addressed by name, so documents
  // saved before that get one here, by position, which is the only thing
  // that distinguishes two entries sharing a name.
  data.languages = (data.languages ?? []).map((lang, i) =>
    lang.id ? lang : { ...lang, id: `lng-legacy-${i}` }
  );
  return data;
}

function removeUrlParam(key: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  window.history.replaceState(null, '', url.toString());
}

const DEFAULT_CV_DATA: CVData = starterTemplates.find((t) => t.id === "professional")!.data;

export function useCVData() {
  // Undo/redo lives here rather than around each mutator: everything below
  // changes the document through `setData`, so routing that one setter
  // through a history stack covers every edit, including the deletes this
  // was asked for. `loadData` is the same setter for the cases that are not
  // edits (opening a document), which must not be undoable back to the
  // starter template the editor happened to boot with.
  const {
    value: data,
    set: setData,
    replace: loadData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<CVData>(DEFAULT_CV_DATA);
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isFirstSaveRef = useRef(true);

  // Load from URL (priority) or localStorage on mount
  useEffect(() => {
    // Legacy share links: the editor used to mirror the whole CV into ?data=
    // on every keystroke, and those URLs are already in circulation. It no
    // longer writes the param (see the save effect below), but it still
    // honours one that arrives.
    const urlParam = new URLSearchParams(window.location.search).get(LEGACY_QUERY_KEY);
    if (urlParam) {
      const decoded = decodeLegacyQuery(urlParam);
      if (decoded) {
        loadData(normalizeCVData(decoded));
        const history = loadVersionHistory();
        setVersions(history.versions);
        return;
      }
    }

    const saved = localStorage.getItem("cvBuilderData");
    if (saved) {
      try {
        loadData(normalizeCVData(JSON.parse(saved)));
      } catch (err) {
        console.error("Failed to load CV data:", err);
      }
    }

    // Load version history
    const history = loadVersionHistory();
    setVersions(history.versions);
  }, [loadData]);

  // Save to localStorage and URL whenever data changes
  useEffect(() => {
    // Skip the first render to avoid overwriting URL before the load effect reads it
    if (isFirstSaveRef.current) {
      isFirstSaveRef.current = false;
      return;
    }

    localStorage.setItem("cvBuilderData", JSON.stringify(data));

    // The CV is deliberately NOT mirrored into the query string any more.
    // It used to be, which made the address bar a de facto share link, but a
    // query string is sent to the server on every navigation, so a CV of any
    // substance risked a 414 from the host (GitHub Pages cuts off well before
    // the browser does) and landed in access logs and Referer headers on the
    // way. Sharing now goes through an explicit Share link, which puts the
    // same payload, compressed, in the fragment. See lib/cv-share.ts.

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
  }, [setData]);

  const addExperience = useCallback((entry: Omit<ExperienceEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...entry, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateExperience = useCallback((id: string, updates: Partial<ExperienceEntry>) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    }));
  }, [setData]);

  const deleteExperience = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  }, [setData]);

  const addEducation = useCallback((entry: Omit<EducationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      education: [...prev.education, { ...entry, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateEducation = useCallback((id: string, updates: Partial<EducationEntry>) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
    }));
  }, [setData]);

  const deleteEducation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, [setData]);

  const addSkill = useCallback((skill: Omit<SkillEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      skills: [...prev.skills, { ...skill, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateSkill = useCallback((id: string, updates: Partial<SkillEntry>) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) => (skill.id === id ? { ...skill, ...updates } : skill)),
    }));
  }, [setData]);

  const deleteSkill = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  }, [setData]);

  const addProject = useCallback((project: Omit<ProjectEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      projects: [...prev.projects, { ...project, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateProject = useCallback((id: string, updates: Partial<ProjectEntry>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj)),
    }));
  }, [setData]);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  }, [setData]);

  const addCertification = useCallback((cert: Omit<CertificationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { ...cert, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateCertification = useCallback((id: string, updates: Partial<CertificationEntry>) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) => (cert.id === id ? { ...cert, ...updates } : cert)),
    }));
  }, [setData]);

  const deleteCertification = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  }, [setData]);

  const addLanguage = useCallback((lang: { name: string; proficiency: 1 | 2 | 3 | 4 | 5 }) => {
    setData((prev) => ({
      ...prev,
      languages: [...prev.languages, { id: `lng-${Date.now().toString(36)}-${prev.languages.length}`, ...lang }],
    }));
  }, [setData]);

  const updateLanguage = useCallback((id: string, proficiency: 1 | 2 | 3 | 4 | 5) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.map((lang) => (lang.id === id ? { ...lang, proficiency } : lang)),
    }));
  }, [setData]);

  const deleteLanguage = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang.id !== id),
    }));
  }, [setData]);

  const resetData = useCallback(() => {
    setData(DEFAULT_CV_DATA);
    localStorage.removeItem("cvBuilderData");
    removeUrlParam(LEGACY_QUERY_KEY);
  }, [setData]);

  const importData = useCallback((importedData: CVData) => {
    setData(importedData);
  }, [setData]);

  const createSavepoint = useCallback((label?: string) => {
    const version = saveVersion(data, label);
    setVersions(loadVersionHistory().versions);
    return version;
  }, [data]);

  const restoreSavepoint = useCallback((versionId: string) => {
    const raw = restoreVersion(versionId);
    const restoredData = raw ? normalizeCVData(raw) : null;
    if (restoredData) {
      setData(restoredData);
      localStorage.setItem("cvBuilderData", JSON.stringify(restoredData));
    }
  }, [setData]);

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
  }, [setData]);

  const updateAward = useCallback((id: string, updates: Partial<AwardEntry>) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.map((award) => (award.id === id ? { ...award, ...updates } : award)),
    }));
  }, [setData]);

  const deleteAward = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      awards: prev.awards.filter((award) => award.id !== id),
    }));
  }, [setData]);

  const addReference = useCallback((ref: Omit<ReferenceEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      references: [...prev.references, { ...ref, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateReference = useCallback((id: string, updates: Partial<ReferenceEntry>) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.map((ref) => (ref.id === id ? { ...ref, ...updates } : ref)),
    }));
  }, [setData]);

  const deleteReference = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.filter((ref) => ref.id !== id),
    }));
  }, [setData]);

  const addVolunteering = useCallback((vol: Omit<VolunteeringEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      volunteering: [...prev.volunteering, { ...vol, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateVolunteering = useCallback((id: string, updates: Partial<VolunteeringEntry>) => {
    setData((prev) => ({
      ...prev,
      volunteering: prev.volunteering.map((vol) => (vol.id === id ? { ...vol, ...updates } : vol)),
    }));
  }, [setData]);

  const deleteVolunteering = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      volunteering: prev.volunteering.filter((vol) => vol.id !== id),
    }));
  }, [setData]);

  const addStrength = useCallback((strength: Omit<StrengthEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      strengths: [...prev.strengths, { ...strength, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateStrength = useCallback((id: string, updates: Partial<StrengthEntry>) => {
    setData((prev) => ({
      ...prev,
      strengths: prev.strengths.map((strength) => (strength.id === id ? { ...strength, ...updates } : strength)),
    }));
  }, [setData]);

  const deleteStrength = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      strengths: prev.strengths.filter((strength) => strength.id !== id),
    }));
  }, [setData]);

  const addInterest = useCallback((interest: Omit<InterestEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      interests: [...prev.interests, { ...interest, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateInterest = useCallback((id: string, updates: Partial<InterestEntry>) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.map((interest) => (interest.id === id ? { ...interest, ...updates } : interest)),
    }));
  }, [setData]);

  const deleteInterest = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.filter((interest) => interest.id !== id),
    }));
  }, [setData]);

  const addPublication = useCallback((pub: Omit<PublicationEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      publications: [...prev.publications, { ...pub, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updatePublication = useCallback((id: string, updates: Partial<PublicationEntry>) => {
    setData((prev) => ({
      ...prev,
      publications: prev.publications.map((pub) => (pub.id === id ? { ...pub, ...updates } : pub)),
    }));
  }, [setData]);

  const deletePublication = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      publications: prev.publications.filter((pub) => pub.id !== id),
    }));
  }, [setData]);

  const addSocialLink = useCallback((link: Omit<SocialLinkEntry, "id">) => {
    setData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { ...link, id: Date.now().toString() }],
    }));
  }, [setData]);

  const updateSocialLink = useCallback((id: string, updates: Partial<SocialLinkEntry>) => {
    setData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).map((link) => (link.id === id ? { ...link, ...updates } : link)),
    }));
  }, [setData]);

  const deleteSocialLink = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((link) => link.id !== id),
    }));
  }, [setData]);

  // ── Custom sections ──
  const addCustomSection = useCallback((title: string) => {
    setData((prev) => {
      const id = `cs-${Date.now()}`;
      const newSection: CustomSection = { id, title, items: [] };
      return {
        ...prev,
        customSections: [...prev.customSections, newSection],
        sectionOrder: [...getEffectiveSectionOrder(prev), { id, column: "left" }],
      };
    });
  }, [setData]);

  /**
   * Removes a section from the résumé, whatever kind it is.
   *
   * A custom section is deleted outright. A built-in one cannot be: every
   * template reads its content from a named field on CVData, and
   * getEffectiveSectionOrder re-appends any built-in missing from the order
   * (that is how older documents pick up newer section types). So deleting a
   * built-in clears its content and marks it hidden, which takes it off the
   * page and returns it to the catalogue as an empty section.
   *
   * It therefore destroys content, and callers are expected to confirm first.
   */
  const removeSection = useCallback((id: string) => {
    setData((prev) => {
      const isCustom = prev.customSections.some((s) => s.id === id);
      if (isCustom) {
        return {
          ...prev,
          customSections: prev.customSections.filter((s) => s.id !== id),
          sectionOrder: getEffectiveSectionOrder(prev).filter((s) => s.id !== id),
        };
      }

      const cleared: Partial<CVData> = {};
      switch (id) {
        case "summary":      cleared.personalInfo = { ...prev.personalInfo, summary: "" }; break;
        case "experience":   cleared.experience = []; break;
        case "education":    cleared.education = []; break;
        case "skills":       cleared.skills = []; break;
        case "awards":       cleared.awards = []; break;
        case "publications": cleared.publications = []; break;
        case "references":   cleared.references = []; break;
        case "socialLinks":  cleared.socialLinks = []; break;
        case "languages":    cleared.languages = []; break;
        default: break;
      }

      return {
        ...prev,
        ...cleared,
        sectionOrder: getEffectiveSectionOrder(prev).map((s) =>
          s.id === id ? { ...s, hidden: true } : s
        ),
      };
    });
  }, [setData]);

  const deleteCustomSection = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((s) => s.id !== id),
      sectionOrder: getEffectiveSectionOrder(prev).filter((s) => s.id !== id),
    }));
  }, [setData]);

  const updateCustomSectionTitle = useCallback((id: string, title: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) => (s.id === id ? { ...s, title } : s)),
    }));
  }, [setData]);

  const addCustomSectionItem = useCallback((sectionId: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, { id: `csi-${Date.now()}`, title: "", subtitle: "", meta: "", description: "" }] }
          : s
      ),
    }));
  }, [setData]);

  const updateCustomSectionItem = useCallback((sectionId: string, itemId: string, field: keyof Omit<CustomSectionItem, "id">, value: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)) }
          : s
      ),
    }));
  }, [setData]);

  const deleteCustomSectionItem = useCallback((sectionId: string, itemId: string) => {
    setData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((it) => it.id !== itemId) } : s
      ),
    }));
  }, [setData]);

  // ── Section visibility / order ──
  const toggleSectionHidden = useCallback((id: string) => {
    setData((prev) => {
      const order = getEffectiveSectionOrder(prev);
      return { ...prev, sectionOrder: order.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)) };
    });
  }, [setData]);

  const setSectionColumn = useCallback((id: string, column: "left" | "right") => {
    setData((prev) => {
      const order = getEffectiveSectionOrder(prev);
      return { ...prev, sectionOrder: order.map((s) => (s.id === id ? { ...s, column } : s)) };
    });
  }, [setData]);

  /**
   * Moves a section one slot earlier/later. "column" mode swaps with the
   * nearest other entry sharing the same column (for two-column templates,
   * so a move is never a no-op just because the adjacent array entry
   * belongs to the other column). "flat" mode swaps with the raw adjacent
   * array entry, matching how single-column templates render the order.
   */
  /**
   * Drops a section at an explicit position: into `column`, immediately
   * before `beforeId`, or at the end of that column when `beforeId` is null.
   *
   * Anchoring to a neighbouring id rather than an index means the caller
   * never has to translate between "third visible box in the right column"
   * and a position in the flat sectionOrder array, so the two can't disagree.
   */
  const placeSection = useCallback(
    (id: string, column: "left" | "right", beforeId: string | null) => {
      setData((prev) => {
        const order = getEffectiveSectionOrder(prev);
        const moving = order.find((s) => s.id === id);
        if (!moving || id === beforeId) return prev;

        const without = order.filter((s) => s.id !== id);
        const placed = { ...moving, column };

        let insertAt: number;
        if (beforeId) {
          const at = without.findIndex((s) => s.id === beforeId);
          insertAt = at === -1 ? without.length : at;
        } else {
          // End of the target column's run, so it lands under its new
          // neighbours rather than at the end of the whole document.
          let last = -1;
          without.forEach((s, i) => { if (s.column === column) last = i; });
          insertAt = last === -1 ? without.length : last + 1;
        }

        const next = [...without];
        next.splice(insertAt, 0, placed);
        return { ...prev, sectionOrder: next };
      });
    },
    [setData]
  );

  const moveSection = useCallback((id: string, direction: -1 | 1, mode: "flat" | "column") => {
    setData((prev) => {
      const order = getEffectiveSectionOrder(prev);
      const idx = order.findIndex((s) => s.id === id);
      if (idx === -1) return prev;

      let swapIdx: number;
      if (mode === "flat") {
        swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= order.length) return prev;
      } else {
        const col = order[idx].column;
        const colIndices: number[] = [];
        order.forEach((s, i) => { if (s.column === col) colIndices.push(i); });
        const pos = colIndices.indexOf(idx);
        const swapPos = pos + direction;
        if (swapPos < 0 || swapPos >= colIndices.length) return prev;
        swapIdx = colIndices[swapPos];
      }

      const next = [...order];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return { ...prev, sectionOrder: next };
    });
  }, [setData]);

  // Generic path-based update for WYSIWYG inline editing
  const updateField = useCallback((path: string, value: FieldValue) => {
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
          newData.languages = newData.languages.map((lang) =>
            lang.id === id ? { ...lang, [field]: value } : lang
          );
        } else {
          const list = newData[collection];
          if (Array.isArray(list)) {
            // The path names a collection and a field on one of its entries.
            // No index signature on CVData can express that pair, so the
            // entry is narrowed to the one thing every collection shares, an
            // id, and the field name is trusted: it comes from a template
            // that built the path out of its own typed data.
            const updated = (list as { id: string }[]).map((item) =>
              item.id === id ? { ...item, [field]: value } : item
            );
            Object.assign(newData, { [collection]: updated });
          }
        }
      }

      return newData;
    });
  }, [setData]);

  return {
    data,
    undo,
    redo,
    canUndo,
    canRedo,
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
    addCustomSection,
    deleteCustomSection,
    removeSection,
    updateCustomSectionTitle,
    addCustomSectionItem,
    updateCustomSectionItem,
    deleteCustomSectionItem,
    toggleSectionHidden,
    setSectionColumn,
    moveSection,
    placeSection,
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
