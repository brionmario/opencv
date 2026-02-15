import type { CVData } from "@/lib/cv-builder-types";
import { getIconSvg, getSocialIconSvg } from "@/lib/icons";

export function exportToJSON(data: CVData, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(blob, filename);
}

export function exportToMarkdown(data: CVData, filename: string) {
  let md = `# ${data.personalInfo.fullName}\n\n`;
  md += `**${data.personalInfo.jobTitle}**\n\n`;

  const contactParts: string[] = [];
  if (data.personalInfo.email) contactParts.push(`${data.personalInfo.email}`);
  if (data.personalInfo.phone) contactParts.push(`${data.personalInfo.phone}`);
  if (data.personalInfo.location) contactParts.push(`${data.personalInfo.location}`);
  if (data.personalInfo.website) contactParts.push(`${data.personalInfo.website}`);
  if (contactParts.length > 0) md += contactParts.join(" | ") + "\n\n";

  if (data.personalInfo.summary) {
    md += `## Summary\n\n${data.personalInfo.summary}\n\n`;
  }

  if (data.experience.length > 0) {
    md += `## Experience\n\n`;
    data.experience.forEach((exp) => {
      md += `### ${exp.jobTitle}\n\n`;
      md += `**${exp.company}**`;
      if (exp.location) md += ` | ${exp.location}`;
      md += `\n`;
      md += `${exp.startDate} - ${exp.currentlyWorking ? "Present" : exp.endDate}\n\n`;
      if (exp.description) md += `${exp.description}\n\n`;
      if (exp.highlights.length > 0) {
        exp.highlights.forEach((h) => {
          if (h) md += `- ${h}\n`;
        });
        md += "\n";
      }
    });
  }

  if (data.education.length > 0) {
    md += `## Education\n\n`;
    data.education.forEach((edu) => {
      md += `### ${edu.degree}\n\n`;
      md += `**${edu.institution}**`;
      if (edu.field) md += ` - ${edu.field}`;
      md += `\n`;
      md += `${edu.startDate} - ${edu.endDate}\n\n`;
    });
  }

  if (data.skills.length > 0) {
    md += `## Skills\n\n`;
    md += data.skills.map((s) => s.name).filter(Boolean).join(", ");
    md += "\n\n";
  }

  if (data.awards.length > 0) {
    md += `## Achievements\n\n`;
    data.awards.forEach((award) => {
      md += `- **${award.title}**`;
      if (award.description) md += ` - ${award.description}`;
      md += "\n";
    });
    md += "\n";
  }


  if (data.publications && data.publications.length > 0) {
    md += `## Publications\n\n`;
    data.publications.forEach((pub) => {
      md += `- **${pub.title}**`;
      if (pub.publisher) md += `, ${pub.publisher}`;
      if (pub.date) md += ` (${pub.date})`;
      if (pub.link) md += ` [Link](${pub.link})`;
      if (pub.description) md += ` - ${pub.description}`;
      md += "\n";
    });
    md += "\n";
  }

  if (data.socialLinks && data.socialLinks.length > 0) {
    md += `## Links\n\n`;
    data.socialLinks.forEach((link) => {
      md += `- [${link.platform}](${link.url.startsWith("http") ? link.url : `https://${link.url}`})\n`;
    });
    md += "\n";
  }
  // ...existing code...

  if (data.languages.length > 0) {
    md += `## Languages\n\n`;
    const labels = ["Beginner", "Elementary", "Intermediate", "Proficient", "Fluent"];
    data.languages.forEach((lang) => {
      md += `- ${lang.name} (${labels[lang.proficiency - 1]})\n`;
    });
    md += "\n";
  }

  const blob = new Blob([md], { type: "text/markdown" });
  downloadFile(blob, filename);
}


function generateCleanHTML(data: CVData): string {
    // Publications HTML for export
    let publicationsHtml = "";
    if (data.publications && data.publications.length > 0) {
      publicationsHtml = data.publications
        .map(
          (pub) => `
            <div class="publication">
              <div class="publication-title"><strong>${escapeHtml(pub.title)}</strong></div>
              <div class="publication-meta">
                ${pub.publisher ? `<span>${escapeHtml(pub.publisher)}</span>` : ""}
                ${pub.date ? `<span>${escapeHtml(pub.date)}</span>` : ""}
                ${pub.link ? `<a href="${escapeHtml(pub.link)}" target="_blank">Link</a>` : ""}
              </div>
              ${pub.description ? `<div class="publication-desc">${sanitizeAndRenderHtml(pub.description)}</div>` : ""}
            </div>`
        )
        .join("");
    }
  const avatarHtml = data.personalInfo.avatar
    ? `<img src="${data.personalInfo.avatar}" class="avatar" />`
    : "";

  const skillsHtml = data.skills
    .filter((s) => s.name)
    .map((s) => `<span class="skill-tag">${escapeHtml(s.name)}</span>`)
    .join("\n            ");

  const experienceHtml = data.experience
    .map(
      (exp) => `
        <div class="entry">
          <h3>${escapeHtml(exp.jobTitle)}</h3>
          <div class="company">${escapeHtml(exp.company)}</div>
          <div class="meta">
            <span class="meta-item">${getIconSvg("calendar", "#9ca3af")} ${escapeHtml(exp.startDate)} - ${exp.currentlyWorking ? "Present" : escapeHtml(exp.endDate)}</span>
            ${exp.location ? `<span class="meta-item">${getIconSvg("location", "#9ca3af")} ${escapeHtml(exp.location)}</span>` : ""}
          </div>
          ${exp.description ? `<p class="description">${sanitizeAndRenderHtml(exp.description)}</p>` : ""}
          ${
            exp.highlights.filter(Boolean).length > 0
              ? `<ul>${exp.highlights
                  .filter(Boolean)
                  .map((h) => `<li>${sanitizeAndRenderHtml(h)}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </div>`
    )
    .join("");

  const educationHtml = data.education
    .map(
      (edu) => `
        <div class="entry">
          <h3>${escapeHtml(edu.degree)}</h3>
          <div class="company">${escapeHtml(edu.institution)}</div>
          <div class="meta">
            <span class="meta-item">${getIconSvg("calendar", "#9ca3af")} ${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}</span>
          </div>
        </div>`
    )
    .join("");

  const awardsHtml = data.awards
    .map(
      (award) => `
        <div class="achievement">
          <div class="achievement-icon">${getIconSvg("award", "#db2777")}</div>
          <div class="achievement-content">
            <strong>${escapeHtml(award.title)}</strong>
            ${award.description ? `<p>${sanitizeAndRenderHtml(award.description)}</p>` : ""}
          </div>
        </div>`
    )
    .join("");

  const socialLinksHtml = (data.socialLinks || [])
    .map(
      (link) => `
        <div class="social-link">
          <span class="social-icon">${getSocialIconSvg(link.platform, "#374151")}</span>
          <div class="social-text">
            <strong>${escapeHtml(link.platform)}</strong>
            <span>${escapeHtml(link.url)}</span>
          </div>
        </div>`
    )
    .join("");

  const labels = ["Beginner", "Elementary", "Intermediate", "Proficient", "Fluent"];
  const languagesHtml = data.languages
    .map(
      (lang) => `
        <div class="language">
          <div class="lang-info">
            <strong>${escapeHtml(lang.name)}</strong>
            <span class="lang-label">${labels[lang.proficiency - 1]}</span>
          </div>
          <div class="proficiency">
            ${Array(lang.proficiency).fill('<span class="dot filled"></span>').join("")}${Array(5 - lang.proficiency).fill('<span class="dot"></span>').join("")}
          </div>
        </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.personalInfo.fullName)} - CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      font-size: 11px;
      background: #f5f5f5;
      padding: 20px 0;
    }
    .page {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto 20px;
      padding: 36px 40px;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
    }
    /* Page break indicator */
    .page::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 5%;
      right: 5%;
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        #db2777 0,
        #db2777 10px,
        transparent 10px,
        transparent 20px
      );
      opacity: 0.3;
    }
    .page-break-indicator {
      position: absolute;
      left: 0;
      right: 0;
      height: 297mm;
      pointer-events: none;
      border-bottom: 2px dashed #db2777;
      opacity: 0.15;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .header-text { flex: 1; }
    .header h1 {
      font-size: 30px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .header .title {
      font-size: 15px;
      color: #db2777;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      color: #4b5563;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .contact-item svg { flex-shrink: 0; }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin-left: 20px;
      border: 2px solid #e5e7eb;
    }
    /* Two column */
    .two-col { display: flex; gap: 28px; }
    .col-left { width: 58%; }
    .col-right { width: 42%; }
    /* Section headers */
    h2 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #111827;
      border-bottom: 2px solid #db2777;
      padding-bottom: 3px;
      margin-bottom: 10px;
      margin-top: 18px;
    }
    h2:first-child { margin-top: 0; }
    /* Entries */
    .entry { margin-bottom: 14px; }
    .entry h3 {
      font-size: 12.5px;
      font-weight: 700;
      color: #111827;
    }
    .company { font-size: 11px; color: #db2777; font-weight: 600; margin-top: 1px; }
    .meta {
      display: flex;
      gap: 12px;
      margin-top: 2px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      color: #9ca3af;
    }
    .meta-item svg { flex-shrink: 0; }
    .description { font-size: 10.5px; color: #374151; margin-top: 4px; line-height: 1.5; }
    ul { margin-left: 14px; margin-top: 5px; }
    li { font-size: 10.5px; color: #374151; margin-bottom: 2px; line-height: 1.45; }
    strong { font-weight: 700; color: #111827; }
    em { font-style: italic; color: inherit; }
    a { color: #db2777; text-decoration: underline; }
    a:hover { color: #be185d; }
    /* Skills */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .skill-tag {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 3px 9px;
      border-radius: 3px;
      font-size: 10px;
      color: #1f2937;
    }
    /* Achievements */
    .achievement {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    .achievement-icon { flex-shrink: 0; margin-top: 1px; }
    .achievement-content { flex: 1; }
    .achievement strong { font-size: 11px; color: #111827; display: block; }
    .achievement p { font-size: 10px; color: #6b7280; margin-top: 1px; }
    /* Social links */
    .social-link {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .social-icon { flex-shrink: 0; display: flex; align-items: center; }
    .social-text { display: flex; flex-direction: column; }
    .social-text strong { font-size: 10.5px; color: #111827; }
    .social-text span { font-size: 9.5px; color: #6b7280; }
    /* Languages */
    .language { margin-bottom: 8px; }
    .lang-info { display: flex; justify-content: space-between; align-items: baseline; }
    .lang-info strong { font-size: 11px; color: #111827; }
    .lang-label { font-size: 9.5px; color: #6b7280; }
    .proficiency { display: flex; gap: 4px; margin-top: 3px; }
    .dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #e5e7eb;
      display: inline-block;
    }
    .dot.filled { background: #2563eb; }
    .summary { font-size: 11px; color: #374151; line-height: 1.65; }
    @page {
      margin: 0;
      size: A4;
    }
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .page { 
        padding: 30px 36px; 
        box-shadow: none; 
        margin: 0;
        page-break-after: always;
      }
      .page::after { display: none; }
      .page-break-indicator { display: none; }
      a { color: #db2777; text-decoration: underline; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-text">
        <h1>${escapeHtml(data.personalInfo.fullName)}</h1>
        <div class="title">${escapeHtml(data.personalInfo.jobTitle)}</div>
        <div class="contact">
          ${data.personalInfo.phone ? `<span class="contact-item">${getIconSvg("phone", "#db2777")} ${escapeHtml(data.personalInfo.phone)}</span>` : ""}
          ${data.personalInfo.email ? `<span class="contact-item">${getIconSvg("email", "#db2777")} ${escapeHtml(data.personalInfo.email)}</span>` : ""}
          ${data.personalInfo.website ? `<span class="contact-item">${getIconSvg("link", "#db2777")} ${escapeHtml(data.personalInfo.website)}</span>` : ""}
          ${data.personalInfo.location ? `<span class="contact-item">${getIconSvg("location", "#db2777")} ${escapeHtml(data.personalInfo.location)}</span>` : ""}
        </div>
      </div>
      ${avatarHtml}
    </div>

    <div class="two-col">
      <div class="col-left">
        ${data.personalInfo.summary ? `<h2>Summary</h2><p class="summary">${sanitizeAndRenderHtml(data.personalInfo.summary)}</p>` : ""}
        ${data.education.length > 0 ? `<h2>Education</h2>${educationHtml}` : ""}
        ${data.experience.length > 0 ? `<h2>Experience</h2>${experienceHtml}` : ""}
      </div>
      <div class="col-right">
        ${data.skills.length > 0 ? `<h2>Skills</h2><div class="skills-grid">${skillsHtml}</div>` : ""}
        ${data.awards.length > 0 ? `<h2>Key Achievements</h2>${awardsHtml}` : ""}
        ${publicationsHtml ? `<h2>Publications</h2>${publicationsHtml}` : ""}
        ${(data.socialLinks || []).length > 0 ? `<h2>Find Me Online</h2>${socialLinksHtml}` : ""}
        ${data.languages.length > 0 ? `<h2>Languages</h2>${languagesHtml}` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes and renders HTML content for display in CV templates.
 * 
 * This function is designed to work with WYSIWYG editors like Lexical.
 * It allows safe HTML formatting tags while preventing XSS attacks.
 * Also supports markdown syntax as a fallback for backward compatibility.
 * 
 * Allowed tags: <strong>, <em>, <b>, <i>, <u>, <br>, <sup>, <sub>, <a>
 * Anchor tags: Only http://, https://, and mailto: protocols are allowed
 * 
 * Security:
 * - Strips dangerous tags (script, iframe, style)
 * - Removes event handlers (onclick, onload, etc.)
 * - Removes attributes from allowed tags (except href/target for <a>)
 * - Plain text content is automatically escaped
 * 
 * @param str - The HTML or markdown string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
function sanitizeAndRenderHtml(str: string): string {
  if (!str) return "";
  
  // Check if content has markdown syntax (**, *, __, _)
  const hasMarkdown = /(\*\*|__|\*|_)/.test(str);
  const hasHtmlTags = /<[^>]+>/.test(str);
  
  // If it has markdown but no HTML, convert markdown to HTML first
  if (hasMarkdown && !hasHtmlTags) {
    // Convert markdown to HTML
    // Bold: **text** or __text__ (process first to avoid conflicts)
    str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (process after bold to avoid conflicts)
    // Match single * or _ not preceded/followed by another
    str = str.replace(/([^*]|^)\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    str = str.replace(/([^_]|^)_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');
  }
  
  // Now process HTML
  const stillHasHtmlTags = /<[^>]+>/.test(str);
  
  if (!stillHasHtmlTags) {
    // Plain text - escape it
    return escapeHtml(str);
  }
  
  // Basic HTML sanitization - allow only specific formatting tags
  // Remove any potentially dangerous tags/attributes
  let sanitized = str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/<\s*style[^>]*>.*?<\/style>/gi, '');
  
  // Allow only safe formatting tags: strong, b, em, i, u, br, a
  // Remove all other tags by escaping them
  const allowedTags = ['strong', 'em', 'b', 'i', 'u', 'br', 'sup', 'sub', 'a'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Closing tags - keep as is
      if (match.startsWith('</')) {
        return `</${tagName}>`;
      }
      
      // Special handling for anchor tags - preserve href and target attributes
      if (tagName.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href=(["'])([^"']*)\1/i);
        const targetMatch = match.match(/target=(["'])([^"']*)\1/i);
        
        if (hrefMatch) {
          const href = hrefMatch[2];
          // Sanitize href - only allow http, https, and mailto protocols
          if (/^(https?:\/\/|mailto:)/i.test(href)) {
            const targetAttr = targetMatch ? ` target="${escapeHtml(targetMatch[2])}"` : '';
            return `<a href="${escapeHtml(href)}"${targetAttr}>`;
          }
        }
        // If no valid href, strip the tag
        return '';
      }
      
      // Other tags - remove attributes
      return `<${tagName}>`;
    }
    // Escape disallowed tags
    return escapeHtml(match);
  });
  
  return sanitized;
}

export function exportToHTML(_htmlContent: string, data: CVData, filename: string) {
  const html = generateCleanHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadFile(blob, filename);
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(_htmlContent: string, data: CVData, _filename: string) {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please disable popup blockers to export PDF");
      return;
    }

    const html = generateCleanHTML(data);
    printWindow.document.write(
      html.replace("</body>", `<script>window.onload = function() { window.print(); window.close(); }<\/script></body>`)
    );
    printWindow.document.close();
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to export PDF. Please try again.");
  }
}
