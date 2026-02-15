import { cvData } from "./cv-data";

export function generateCVPDF(): string {
  const cv = cvData;

  // Generate HTML without any Tailwind classes
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${cv.personal.name} - CV</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Inter, Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #000;
      background: white;
    }

    .container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      padding: 30px;
      max-width: 8.5in;
      height: 11in;
      margin: 0 auto;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .right-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      margin-bottom: 10px;
    }

    .name {
      font-family: Rubik, Arial, Helvetica, sans-serif;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 10px;
      margin-bottom: 8px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    h2 {
      font-family: Rubik, Arial, Helvetica, sans-serif;
      font-size: 13px;
      font-weight: bold;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    h3 {
      font-family: Rubik, Arial, Helvetica, sans-serif;
      font-size: 11px;
      font-weight: bold;
      margin-top: 6px;
    }

    .company-link {
      color: #0066cc;
      font-weight: bold;
    }

    .date {
      font-size: 10px;
      color: #333;
    }

    .location {
      font-size: 10px;
      color: #555;
    }

    .description {
      font-size: 10px;
      margin-bottom: 4px;
    }

    ul {
      margin-left: 16px;
      font-size: 10px;
    }

    li {
      margin-bottom: 3px;
      line-height: 1.4;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .skill-tag {
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 9px;
      display: inline-block;
      width: fit-content;
    }

    .education-item {
      margin-bottom: 8px;
    }

    .achievement-item {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;
      font-size: 9px;
    }

    .achievement-icon {
      flex-shrink: 0;
      width: 16px;
    }

    .achievement-content {
      flex: 1;
    }

    .social-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      margin-bottom: 4px;
    }

    .social-icon {
      font-size: 12px;
    }

    .social-link {
      color: #0066cc;
    }

    .language-item {
      margin-bottom: 8px;
    }

    .language-name {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 2px;
    }

    .proficiency-bars {
      display: flex;
      gap: 4px;
    }

    .proficiency-bar {
      width: 10px;
      height: 6px;
      border-radius: 2px;
    }

    .proficiency-bar.filled {
      background: #0066cc;
    }

    .proficiency-bar.empty {
      background: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-column">
      <div class="header">
        <div class="name">${cv.personal.name}</div>
        <div class="contact-info">
          <div class="contact-item">📞 ${cv.personal.phone}</div>
          <div class="contact-item">✉️ ${cv.personal.email}</div>
          <div class="contact-item">🌐 ${cv.personal.website}</div>
          <div class="contact-item">📍 ${cv.personal.location}</div>
        </div>
      </div>

      <section>
        <h2>SUMMARY</h2>
        <p style="font-size: 10px; line-height: 1.5;">${cv.summary}</p>
      </section>

      <section>
        <h2>EXPERIENCE</h2>
        ${cv.experience
          .map(
            (job) => `
          <div>
            <h3>${job.title}</h3>
            <span class="company-link">${job.company}</span>
            <div class="date">${job.startDate} - ${job.endDate}</div>
            <div class="location">📍 ${job.location}</div>
            <p class="description">${job.description}</p>
            <ul>
              ${job.highlights.map((h) => `<li>${h}</li>`).join("")}
            </ul>
          </div>
        `
          )
          .join("")}
      </section>
    </div>

    <div class="right-column">
      <section>
        <h2>SKILLS</h2>
        <div class="skills-grid">
          ${cv.skills
            .flat()
            .map((skill) => `<div class="skill-tag">${skill}</div>`)
            .join("")}
        </div>
      </section>

      <section>
        <h2>EDUCATION</h2>
        ${cv.education
          .map(
            (edu) => `
          <div class="education-item">
            <h3>${edu.degree}</h3>
            <span class="company-link">${edu.institution}</span>
            <div class="date">${edu.startDate} - ${edu.endDate}</div>
          </div>
        `
          )
          .join("")}
      </section>

      <section>
        <h2>KEY ACHIEVEMENTS</h2>
        ${cv.achievements
          .map(
            (achievement) => `
          <div class="achievement-item">
            <div class="achievement-icon">💎</div>
            <div class="achievement-content">
              <strong>${achievement.title}</strong>
              <div>${achievement.description}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </section>

      <section>
        <h2>FIND ME ONLINE</h2>
        ${cv.socialLinks
          .map(
            (link) => `
          <div class="social-item">
            <span class="social-icon">
              ${link.platform === "GitHub" ? "🐙" : ""}
              ${link.platform === "Portfolio" ? "🌐" : ""}
              ${link.platform === "LinkedIn" ? "💼" : ""}
              ${link.platform === "Medium" ? "📝" : ""}
            </span>
            <a href="${link.url}" class="social-link">${link.platform}</a>
          </div>
        `
          )
          .join("")}
      </section>

      <section>
        <h2>LANGUAGES</h2>
        ${cv.languages
          .map(
            (lang) => `
          <div class="language-item">
            <div class="language-name">${lang.name}</div>
            <div class="proficiency-bars">
              ${Array(lang.proficiency)
                .fill(0)
                .map(() => '<div class="proficiency-bar filled"></div>')
                .join("")}
              ${Array(5 - lang.proficiency)
                .fill(0)
                .map(() => '<div class="proficiency-bar empty"></div>')
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </section>
    </div>
  </div>
</body>
</html>`;

  return html;
}
