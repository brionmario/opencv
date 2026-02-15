import type { CVData } from "@/lib/cv-builder-types";

interface MinimalTemplateProps {
  data: CVData;
}

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return `${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            {data.personalInfo.fullName}
          </h1>
          <p className="text-gray-600 mt-2">
            {data.personalInfo.jobTitle}
          </p>
          <div className="flex gap-4 text-xs text-gray-500 mt-4">
            {data.personalInfo.email && (
              <span>{data.personalInfo.email}</span>
            )}
            {data.personalInfo.phone && (
              <span>{data.personalInfo.phone}</span>
            )}
            {data.personalInfo.location && (
              <span>{data.personalInfo.location}</span>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-12 pb-6 border-b border-gray-300">
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest mb-6">
              Experience
            </h2>
            <div className="space-y-8">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-serif font-bold text-gray-900 text-sm">
                      {exp.jobTitle}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(exp.startDate)} - {exp.currentlyWorking ? "now" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{exp.company}</p>
                  {exp.description && (
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest mb-6">
              Education
            </h2>
            <div className="space-y-6">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-serif font-bold text-gray-900 text-sm">
                      {edu.degree}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest mb-6">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div>
            <h2 className="font-serif font-bold text-gray-900 text-sm uppercase tracking-widest mb-6">
              Languages
            </h2>
            <div className="flex gap-6">
              {data.languages.map((lang) => (
                <div key={lang.name}>
                  <p className="text-xs font-semibold text-gray-900">
                    {lang.name}
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
