import type { CVData } from "@/lib/cv-builder-types";

interface ModernTemplateProps {
  data: CVData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-white p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">
            {data.personalInfo.fullName}
          </h1>
          <p className="text-xl text-blue-600 font-medium mb-4">
            {data.personalInfo.jobTitle}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {data.personalInfo.email && (
              <span>{data.personalInfo.email}</span>
            )}
            {data.personalInfo.phone && (
              <span>{data.personalInfo.phone}</span>
            )}
            {data.personalInfo.location && (
              <span>{data.personalInfo.location}</span>
            )}
            {data.personalInfo.website && (
              <a href={`https://${data.personalInfo.website}`} className="text-blue-600 hover:underline">
                {data.personalInfo.website}
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Experience */}
            {data.experience.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  EXPERIENCE
                </h2>
                <div className="space-y-6">
                  {data.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif text-lg font-bold text-gray-900">
                          {exp.jobTitle}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium mb-2">{exp.company}</p>
                      {exp.location && (
                        <p className="text-sm text-gray-600 mb-2">{exp.location}</p>
                      )}
                      {exp.description && (
                        <p className="text-gray-700 mb-2">{exp.description}</p>
                      )}
                      {exp.highlights.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {exp.highlights.map((highlight, idx) => (
                            <li key={idx} className="text-sm">{highlight}</li>
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
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  EDUCATION
                </h2>
                <div className="space-y-4">
                  {data.education.map((edu) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif font-bold text-gray-900">
                          {edu.degree}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium">{edu.institution}</p>
                      {edu.field && (
                        <p className="text-sm text-gray-600">{edu.field}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  PROJECTS
                </h2>
                <div className="space-y-4">
                  {data.projects.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif font-bold text-gray-900">
                          {project.name}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.link && (
                        <a href={project.link} className="text-blue-600 hover:underline text-sm">
                          {project.link}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Skills */}
            {data.skills.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  SKILLS
                </h2>
                <div className="space-y-3">
                  {data.skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {skill.name}
                        </p>
                        <span className="text-xs text-gray-600">{skill.category}</span>
                      </div>
                      <div className="flex gap-1">
                        {Array(skill.proficiency)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          ))}
                        {Array(5 - skill.proficiency)
                          .fill(0)
                          .map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="h-1.5 w-1.5 rounded-full bg-gray-300"
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.languages.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  LANGUAGES
                </h2>
                <div className="space-y-2">
                  {data.languages.map((lang) => (
                    <div key={lang.name}>
                      <p className="font-medium text-gray-900 text-sm mb-1">
                        {lang.name}
                      </p>
                      <div className="flex gap-1">
                        {Array(lang.proficiency)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          ))}
                        {Array(5 - lang.proficiency)
                          .fill(0)
                          .map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="h-1.5 w-1.5 rounded-full bg-gray-300"
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {data.certifications.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
                  CERTIFICATIONS
                </h2>
                <div className="space-y-2">
                  {data.certifications.map((cert) => (
                    <div key={cert.id}>
                      <p className="font-medium text-gray-900 text-sm">
                        {cert.name}
                      </p>
                      <p className="text-xs text-gray-600">{cert.issuer}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(cert.issueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
