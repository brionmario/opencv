"use client";

import { useState } from "react";
import { Sparkles, X, Copy, Check } from "lucide-react";

interface AISuggestionsProps {
  type: "jobDescription" | "summary" | "skills" | "achievement";
  context: Record<string, any>;
  onSelect: (suggestion: string) => void;
  placeholder?: string;
}

export function AISuggestions({
  type,
  context,
  onSelect,
  placeholder = "Generate AI suggestions",
}: AISuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context }),
      });

      if (!response.ok) throw new Error("Failed to generate suggestions");

      const data = await response.json();
      const result = data.suggestions;

      if (Array.isArray(result)) {
        setSuggestions(result);
      } else if (typeof result === "string") {
        setSuggestions([result]);
      } else {
        setSuggestions([]);
        setError("Unexpected response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!isOpen) {
            generateSuggestions();
          }
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
      >
        <Sparkles size={16} />
        {placeholder}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded mb-3">
                {error}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-blue-300 group"
                  >
                    <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelect(suggestion)}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleCopy(suggestion, idx)}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                      >
                        {copied === idx ? (
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
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && suggestions.length === 0 && (
              <div className="text-center py-4">
                <button
                  onClick={generateSuggestions}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Generate suggestions
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
