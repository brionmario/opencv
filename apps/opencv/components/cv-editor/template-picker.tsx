"use client";

import { starterTemplates, type StarterTemplate } from "@/lib/starter-templates";

interface TemplatePickerProps {
  onSelect: (template: StarterTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-3">
            Choose a Template
          </h1>
          <p className="text-gray-600 text-lg">
            Pick a starter template to begin building your CV
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {starterTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-6 text-left flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {template.icon}
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 flex-1">
                {template.description}
              </p>
              <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
                Use this template →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
