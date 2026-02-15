import type { CVData } from "@/lib/cv-builder-types";

interface ClassicTemplateProps {
  data: CVData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b-2 border-gray-300">
          <h1 className="font-serif text-5xl font-bold text-gray-900 mb-2">
            {data.personalInfo.fullName}
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            {data.personalInfo.jobTitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            {data.personalInfo.email && (
              <span>{data.personalInfo.email}</span>
            )}
            {data.personalInfo.phone && (
              <span>•</span>
            )}
            {data.personalInfo.phone && (
              <span>{data.personalInfo.phone}</span>
            )}
            {data.personalInfo.location && (
              <span>•</span>
            )}
            {data.personalInfo.location && (
              <span>{data.personalInfo.location}</span>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
              PROFILE
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
              PROFESSIONAL EXPERIENCE
            </h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      {exp.jobTitle}
                    </h3>
                    <span className="text-xs text-gray-600">
                      {formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-gray-700 font-semibold mb-1">{exp.company}</p>
                  {exp.location && (
                    <p className="text-xs text-gray-600 mb-2">{exp.location}</p>
                  )}
                  {exp.description && (
                    <p className="text-gray-700 mb-2 text-sm">{exp.description}</p>
                  )}
                  {exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      {exp.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
              EDUCATION
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      {edu.degree}
                    </h3>
                    <span className="text-xs text-gray-600">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <p className="text-gray-700 font-semibold">{edu.institution}</p>
                  {edu.field && (
                    <p className="text-xs text-gray-600">{edu.field}</p>
                  )}
                  {edu.description && (
                    <p className="text-gray-700 text-sm mt-2">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
              SKILLS
            </h2>
            <div className="space-y-3">
              {Array.from(
                new Set(data.skills.map((s) => s.category))
              ).map((category) => {
                const categorySkills = data.skills.filter(
                  (s) => s.category === category
                );
                return (
                  <div key={category}>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-block bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
              LANGUAGES
            </h2>
            <div className="flex flex-wrap gap-6">
              {data.languages.map((lang) => (
                <div key={lang.name}>
                  <p className="font-semibold text-gray-900 text-sm">
                    {lang.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {["Beginner", "Intermediate", "Advanced", "Expert", "Fluent"][lang.proficiency - 1]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
              CERTIFICATIONS
            </h2>
            <div className="space-y-3">
              {data.certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-semibold text-gray-900 text-sm">
                    {cert.name}
                  </p>
                  <p className="text-xs text-gray-700">
                    {cert.issuer} • {formatDate(cert.issueDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
