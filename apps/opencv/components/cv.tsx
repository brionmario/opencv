"use client";

import { useState } from "react";
import { cvData } from "@/lib/cv-data";
import { generateCVPDF } from "@/lib/pdf-generator";
import { Download, FileJson, FileText } from "lucide-react";

export function CV() {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = () => {
    setIsExporting(true);
    try {
      const html = generateCVPDF();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Brion_Mario_CV.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleHTMLExport = () => {
    try {
      const element = document.getElementById("cv-container");
      if (!element) throw new Error("CV container not found");

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brion Mario - CV</title>
  <style>
    body {
      font-family: Inter, Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    h1, h2, h3 { font-family: Rubik, Arial, Helvetica, sans-serif; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
    section { margin-bottom: 20px; }
    h2 { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; }
    a { color: #0066cc; text-decoration: none; }
    .contact-info { font-size: 14px; line-height: 1.8; }
  </style>
</head>
<body>
  ${element.innerHTML}
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Brion_Mario_CV.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("HTML export failed:", error);
      alert("Failed to export HTML");
    }
  };

  const handleJSONExport = () => {
    try {
      const json = JSON.stringify(cvData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Brion_Mario_CV.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("JSON export failed:", error);
      alert("Failed to export JSON");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-8 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            {cvData.personal.name}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handlePDFExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              title="Export as PDF"
            >
              <Download size={18} />
              <span className="text-sm font-medium">PDF</span>
            </button>
            <button
              onClick={handleHTMLExport}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              title="Export as HTML"
            >
              <FileText size={18} />
              <span className="text-sm font-medium">HTML</span>
            </button>
            <button
              onClick={handleJSONExport}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
              title="Export as JSON"
            >
              <FileJson size={18} />
              <span className="text-sm font-medium">JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="mx-auto max-w-6xl px-8 py-12">
        <div id="cv-container" className="grid grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="col-span-2">
            {/* Header */}
            <div className="mb-8 flex items-start gap-8 border-b border-gray-200 pb-8">
              <div className="flex-1">
                <h1 className="font-serif mb-2 text-4xl font-bold text-gray-900">
                  {cvData.personal.name}
                </h1>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${cvData.personal.phone}`} className="hover:text-blue-600">
                      {cvData.personal.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${cvData.personal.email}`} className="hover:text-blue-600">
                      {cvData.personal.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌐</span>
                    <a href={`https://${cvData.personal.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {cvData.personal.website}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{cvData.personal.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <section className="mb-8">
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
                SUMMARY
              </h2>
              <p className="text-justify text-sm leading-relaxed text-gray-700">
                {cvData.summary}
              </p>
            </section>

            {/* Experience */}
            <section className="mb-8">
              <h2 className="font-serif mb-6 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
                EXPERIENCE
              </h2>
              <div className="space-y-6">
                {cvData.experience.map((job, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-blue-600 font-semibold">
                          {job.link}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>📅 {job.startDate} - {job.endDate}</span>
                      <span>📍 {job.location}</span>
                    </div>
                    <p className="mb-3 text-sm text-gray-600">
                      {job.description}
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {job.highlights.map((highlight, aidx) => (
                        <li key={aidx} className="flex gap-3">
                          <span className="mt-0.5 flex-shrink-0">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-1 space-y-8">
            {/* Profile Image */}
            {cvData.personal.profileImage && (
              <div className="mb-8">
                <img
                  src={cvData.personal.profileImage || "/placeholder.svg"}
                  alt="Profile"
                  className="aspect-square w-full rounded-full object-cover border-4 border-pink-400"
                />
              </div>
            )}

            {/* Skills */}
            <section>
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-lg font-bold text-gray-900">
                SKILLS
              </h2>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.flat().map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-lg font-bold text-gray-900">
                EDUCATION
              </h2>
              <div className="space-y-3">
                {cvData.education.map((edu, idx) => (
                  <div key={idx}>
                    <h3 className="font-serif font-bold text-gray-900">{edu.degree}</h3>
                    <p className="text-sm text-blue-600">{edu.institution}</p>
                    <p className="text-xs text-gray-600">
                      📅 {edu.startDate} - {edu.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section>
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-lg font-bold text-gray-900">
                KEY ACHIEVEMENTS
              </h2>
              <div className="space-y-4">
                {cvData.achievements.map((achievement, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="mt-1 flex-shrink-0 text-lg">💎</span>
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-gray-900">
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Social Links */}
            <section>
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-lg font-bold text-gray-900">
                FIND ME ONLINE
              </h2>
              <div className="space-y-2">
                {cvData.socialLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-lg">
                      {link.platform === "GitHub" && "🐙"}
                      {link.platform === "Portfolio" && "🌐"}
                      {link.platform === "LinkedIn" && "💼"}
                      {link.platform === "Medium" && "📝"}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {link.platform}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section>
              <h2 className="font-serif mb-4 border-b-2 border-gray-900 pb-2 text-lg font-bold text-gray-900">
                LANGUAGES
              </h2>
              <div className="space-y-3">
                {cvData.languages.map((lang, idx) => (
                  <div key={idx}>
                    <h3 className="font-serif font-bold text-gray-900">{lang.name}</h3>
                    <div className="flex gap-1 mt-1">
                      {Array(lang.proficiency)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i} className="h-2 w-2 rounded-full bg-blue-600" />
                        ))}
                      {Array(5 - lang.proficiency)
                        .fill(0)
                        .map((_, i) => (
                          <div key={`empty-${i}`} className="h-2 w-2 rounded-full bg-gray-300" />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
