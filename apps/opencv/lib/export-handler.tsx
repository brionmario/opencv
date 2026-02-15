import type { CVData } from "@/lib/cv-builder-types";

export function exportToJSON(data: CVData, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(blob, filename);
}

export function exportToMarkdown(data: CVData, filename: string) {
  let markdown = `# ${data.personalInfo.fullName}\n\n`;
  markdown += `**${data.personalInfo.jobTitle}**\n\n`;
  
  if (data.personalInfo.email) markdown += `📧 ${data.personalInfo.email}\n`;
  if (data.personalInfo.phone) markdown += `📱 ${data.personalInfo.phone}\n`;
  if (data.personalInfo.location) markdown += `📍 ${data.personalInfo.location}\n\n`;

  if (data.personalInfo.summary) {
    markdown += `## Profile\n\n${data.personalInfo.summary}\n\n`;
  }

  if (data.experience.length > 0) {
    markdown += `## Experience\n\n`;
    data.experience.forEach((exp) => {
      markdown += `### ${exp.jobTitle}\n\n`;
      markdown += `**${exp.company}** | ${exp.startDate} - ${exp.currentlyWorking ? "Present" : exp.endDate}\n\n`;
      if (exp.description) markdown += `${exp.description}\n\n`;
      if (exp.highlights.length > 0) {
        exp.highlights.forEach((h) => {
          markdown += `- ${h}\n`;
        });
        markdown += "\n";
      }
    });
  }

  if (data.education.length > 0) {
    markdown += `## Education\n\n`;
    data.education.forEach((edu) => {
      markdown += `### ${edu.degree}\n\n`;
      markdown += `**${edu.institution}** | ${edu.startDate} - ${edu.endDate}\n\n`;
      if (edu.field) markdown += `Field: ${edu.field}\n\n`;
    });
  }

  if (data.skills.length > 0) {
    markdown += `## Skills\n\n`;
    const categories = Array.from(new Set(data.skills.map((s) => s.category)));
    categories.forEach((category) => {
      const categorySkills = data.skills.filter((s) => s.category === category);
      markdown += `### ${category}\n\n`;
      markdown += categorySkills.map((s) => `- ${s.name}`).join("\n");
      markdown += "\n\n";
    });
  }

  if (data.languages.length > 0) {
    markdown += `## Languages\n\n`;
    data.languages.forEach((lang) => {
      markdown += `- ${lang.name}\n`;
    });
    markdown += "\n";
  }

  const blob = new Blob([markdown], { type: "text/markdown" });
  downloadFile(blob, filename);
}

export function exportToHTML(htmlContent: string, data: CVData, filename: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.personalInfo.fullName} - CV</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Rubik', Arial, Helvetica, sans-serif;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

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

export async function exportToPDF(htmlContent: string, data: CVData, filename: string) {
  try {
    // Using a print-based approach for PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please disable popup blockers to export PDF");
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.personalInfo.fullName} - CV</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, Helvetica, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Rubik', Arial, Helvetica, sans-serif;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      page-break-after: always;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    window.onload = function() {
      window.print();
      window.close();
    }
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to export PDF. Please try again.");
  }
}
