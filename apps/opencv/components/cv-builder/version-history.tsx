'use client';

import { useState } from 'react';
import { Clock, Trash2, Download, Edit2, ChevronDown } from 'lucide-react';
import type { CVVersion } from '@/lib/cv-versioning';

interface VersionHistoryProps {
  versions: CVVersion[];
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onRename: (versionId: string, newLabel: string) => void;
  onExport: (version: CVVersion) => void;
}

export function VersionHistory({
  versions,
  onRestore,
  onDelete,
  onRename,
  onExport,
}: VersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const startEditing = (version: CVVersion) => {
    setEditingId(version.id);
    setEditLabel(version.label);
  };

  const saveLabel = (versionId: string) => {
    if (editLabel.trim()) {
      onRename(versionId, editLabel.trim());
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeSinceVersion = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (versions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Clock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No saved versions yet. Auto-save will create versions as you edit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {versions.map((version) => (
        <div
          key={version.id}
          className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <Clock size={16} className="text-gray-400" />
              <div>
                {editingId === version.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => saveLabel(version.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveLabel(version.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <p className="font-medium text-sm text-gray-900">{version.label}</p>
                    <p className="text-xs text-gray-500">{getTimeSinceVersion(version.timestamp)}</p>
                  </>
                )}
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${expandedId === version.id ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedId === version.id && (
            <div className="px-4 py-3 bg-white border-t space-y-2">
              <p className="text-xs text-gray-500">{formatDate(version.timestamp)}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Experiences: {version.data.experience.length}</p>
                <p>• Education: {version.data.education.length}</p>
                <p>• Skills: {version.data.skills.length}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onRestore(version.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={() => startEditing(version)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Rename version"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onExport(version)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Export version"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => onDelete(version.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete version"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
