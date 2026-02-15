import type { CVData } from "./cv-builder-types";

export interface CVVersion {
  id: string;
  data: CVData;
  timestamp: number;
  label: string;
}

export interface VersionHistory {
  current: CVVersion | null;
  versions: CVVersion[];
  maxVersions: number;
}

const VERSIONS_STORAGE_KEY = "cvBuilderVersions";
const CURRENT_VERSION_KEY = "cvBuilderCurrentVersion";
const MAX_VERSIONS = 20;

export function initializeVersionHistory(): VersionHistory {
  return {
    current: null,
    versions: [],
    maxVersions: MAX_VERSIONS,
  };
}

export function saveVersion(data: CVData, label?: string): CVVersion {
  const version: CVVersion = {
    id: Date.now().toString(),
    data: JSON.parse(JSON.stringify(data)),
    timestamp: Date.now(),
    label: label || new Date().toLocaleString(),
  };

  const history = loadVersionHistory();
  history.versions.unshift(version);

  // Keep only the last MAX_VERSIONS
  if (history.versions.length > MAX_VERSIONS) {
    history.versions = history.versions.slice(0, MAX_VERSIONS);
  }

  history.current = version;

  localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(history.versions));
  localStorage.setItem(CURRENT_VERSION_KEY, JSON.stringify(history.current));

  return version;
}

export function loadVersionHistory(): VersionHistory {
  const versionsJson = localStorage.getItem(VERSIONS_STORAGE_KEY);
  const currentJson = localStorage.getItem(CURRENT_VERSION_KEY);

  return {
    current: currentJson ? JSON.parse(currentJson) : null,
    versions: versionsJson ? JSON.parse(versionsJson) : [],
    maxVersions: MAX_VERSIONS,
  };
}

export function getVersion(versionId: string): CVVersion | null {
  const history = loadVersionHistory();
  return history.versions.find((v) => v.id === versionId) || null;
}

export function restoreVersion(versionId: string): CVData | null {
  const version = getVersion(versionId);
  if (!version) return null;

  const history = loadVersionHistory();
  history.current = version;
  localStorage.setItem(CURRENT_VERSION_KEY, JSON.stringify(history.current));

  return version.data;
}

export function deleteVersion(versionId: string): void {
  const history = loadVersionHistory();
  history.versions = history.versions.filter((v) => v.id !== versionId);
  localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(history.versions));
}

export function renameVersion(versionId: string, newLabel: string): void {
  const history = loadVersionHistory();
  const version = history.versions.find((v) => v.id === versionId);
  if (version) {
    version.label = newLabel;
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(history.versions));
  }
}

export function clearAllVersions(): void {
  localStorage.removeItem(VERSIONS_STORAGE_KEY);
  localStorage.removeItem(CURRENT_VERSION_KEY);
}

export function compareVersions(versionId1: string, versionId2: string): { added: string[]; removed: string[]; modified: string[] } {
  const v1 = getVersion(versionId1);
  const v2 = getVersion(versionId2);

  if (!v1 || !v2) return { added: [], removed: [], modified: [] };

  const changes = {
    added: [] as string[],
    removed: [] as string[],
    modified: [] as string[],
  };

  // Compare experience
  const exp1Ids = v1.data.experience.map((e) => e.id);
  const exp2Ids = v2.data.experience.map((e) => e.id);

  exp1Ids.forEach((id) => {
    if (!exp2Ids.includes(id)) {
      changes.removed.push(`Experience: ${v1.data.experience.find((e) => e.id === id)?.jobTitle}`);
    }
  });

  exp2Ids.forEach((id) => {
    if (!exp1Ids.includes(id)) {
      changes.added.push(`Experience: ${v2.data.experience.find((e) => e.id === id)?.jobTitle}`);
    }
  });

  // Compare education
  const edu1Ids = v1.data.education.map((e) => e.id);
  const edu2Ids = v2.data.education.map((e) => e.id);

  edu1Ids.forEach((id) => {
    if (!edu2Ids.includes(id)) {
      changes.removed.push(`Education: ${v1.data.education.find((e) => e.id === id)?.degree}`);
    }
  });

  edu2Ids.forEach((id) => {
    if (!edu1Ids.includes(id)) {
      changes.added.push(`Education: ${v2.data.education.find((e) => e.id === id)?.degree}`);
    }
  });

  return changes;
}
