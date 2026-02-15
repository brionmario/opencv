"use client";

import React from "react"

import { useState } from "react";
import { X, Upload, Copy, Check } from "lucide-react";
import { parseLinkedInData, validateLinkedInJSON } from "@/lib/linkedin-parser";
import type { CVData } from "@/lib/cv-builder-types";

interface LinkedInImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Partial<CVData>) => void;
}

export function LinkedInImport({ isOpen, onClose, onImport }: LinkedInImportProps) {
  const [tab, setTab] = useState<"paste" | "instructions">("paste");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImport = () => {
    setError(null);

    try {
      const data = JSON.parse(jsonText);

      if (!validateLinkedInJSON(data)) {
        setError("Invalid LinkedIn data format. Please check your JSON.");
        return;
      }

      const parsed = parseLinkedInData(data);
      onImport(parsed);
      setSuccess(true);

      setTimeout(() => {
        setJsonText("");
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Invalid JSON. Please paste valid LinkedIn export data."
          : "Error parsing LinkedIn data. Please try again."
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        setError(null);
      } catch (err) {
        setError("Failed to read file");
      }
    };
    reader.readAsText(file);
  };

  const copyInstructions = () => {
    const instructions = `To import your LinkedIn profile:

1. Visit https://www.linkedin.com/me
2. Go to Settings & Privacy > Data privacy > Get a copy of your data
3. Select "Get a copy of your data" and download the JSON
4. Copy the contents and paste into the field
5. Click Import

You can also manually create a JSON object like:
{
  "profile": {
    "name": "Your Name",
    "headline": "Job Title",
    "summary": "Professional summary",
    "location": "City, Country",
    "email": "email@example.com",
    "phoneNumber": "+1234567890"
  },
  "experience": [...],
  "education": [...],
  "skills": [...]
}`;

    navigator.clipboard.writeText(instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-serif text-xl font-bold">Import LinkedIn Profile</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab("paste")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tab === "paste"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Import Data
          </button>
          <button
            onClick={() => setTab("instructions")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tab === "instructions"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Instructions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "paste" && (
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <label className="cursor-pointer">
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload LinkedIn JSON file
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or drag and drop
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or paste JSON</span>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setError(null);
                }}
                placeholder='Paste your LinkedIn JSON export here...'
                className="w-full h-40 px-3 py-2 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                  Profile imported successfully!
                </div>
              )}
            </div>
          )}

          {tab === "instructions" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">How to export from LinkedIn:</h3>
                <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                  <li>Go to your LinkedIn profile (linkedin.com/me)</li>
                  <li>Click "Settings & Privacy" in top right</li>
                  <li>Select "Data privacy"</li>
                  <li>Click "Get a copy of your data"</li>
                  <li>LinkedIn will prepare a file with your profile data</li>
                  <li>Download the JSON file and upload it here</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Manual JSON format:</h3>
                  <button
                    onClick={copyInstructions}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs bg-white border border-gray-300 rounded p-3 overflow-x-auto max-h-40">
{`{
  "profile": {
    "name": "Your Name",
    "headline": "Job Title",
    "summary": "Bio text...",
    "location": "City, Country",
    "email": "email@example.com"
  },
  "experience": [
    {
      "title": "Job Title",
      "companyName": "Company",
      "description": "Responsibilities..."
    }
  ],
  "education": [
    {
      "schoolName": "University",
      "degreeType": "Bachelor's",
      "fieldOfStudy": "Field"
    }
  ],
  "skills": [
    { "name": "Skill 1" },
    { "name": "Skill 2" }
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {tab === "paste" && (
            <button
              onClick={handleImport}
              disabled={!jsonText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Import Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
