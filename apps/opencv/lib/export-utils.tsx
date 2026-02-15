export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for PDF export");
    return;
  }

  // Dynamically import html2pdf
  const html2pdf = (await import("html2pdf.js")).default;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  };

  html2pdf().set(opt).from(element).save();
}

export function exportToHTML(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for HTML export");
    return;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        .cv-container {
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        @media (max-width: 768px) {
            .cv-container {
                grid-template-columns: 1fr;
                gap: 30px;
            }
        }
        .cv-header {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 20px;
        }
        .cv-header-content h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .cv-header-content p {
            color: #666;
            margin: 5px 0;
            font-size: 14px;
        }
        .profile-image {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
        }
        h2 {
            font-size: 18px;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #333;
        }
        h3 {
            font-size: 16px;
            margin-top: 15px;
            margin-bottom: 5px;
            color: #333;
        }
        .job-title {
            color: #3366cc;
            font-weight: 600;
        }
        .job-meta {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
        }
        ul {
            margin-left: 20px;
            margin-top: 8px;
        }
        li {
            margin-bottom: 5px;
            font-size: 14px;
        }
        .skill-badge {
            display: inline-block;
            background: #f0f0f0;
            padding: 6px 12px;
            border-radius: 4px;
            margin: 5px 5px 5px 0;
            font-size: 14px;
        }
        .achievement {
            margin-bottom: 15px;
        }
        .achievement-title {
            font-weight: 600;
            color: #333;
        }
        .achievement-desc {
            font-size: 14px;
            color: #666;
            margin-top: 3px;
        }
        a {
            color: #3366cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${element.innerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
