import { generateText } from "ai";

export async function POST(request: Request) {
  try {
    const { type, context } = await request.json();

    let prompt = "";

    switch (type) {
      case "jobDescription":
        prompt = `You are a professional CV writer. Based on the job title "${context.jobTitle}" and company "${context.company}", generate 3-4 bullet points that could be included in a job description for this position. Make them specific, measurable, and achievement-focused. Format as a JSON array of strings.`;
        break;

      case "summary":
        prompt = `You are a professional CV writer. Create a compelling 2-3 sentence professional summary for someone with the following background:
        - Job Title: ${context.jobTitle}
        - Experience: ${context.yearsExperience} years
        - Key Skills: ${context.skills?.join(", ") || "Not specified"}
        
        Make it concise, professional, and impactful. Return as a single string.`;
        break;

      case "skills":
        prompt = `You are a professional CV writer. Based on the job title "${context.jobTitle}" and industry "${context.industry || "technology"}", suggest 5-7 relevant skills that should be on a CV for this position. Return as a JSON array of skill names.`;
        break;

      case "achievement":
        prompt = `You are a professional CV writer. Help improve this job achievement: "${context.achievement}". 
        
        Make it more impactful by:
        1. Adding quantifiable metrics or results if possible
        2. Using strong action verbs
        3. Focusing on business impact
        
        Return the improved version as a single string.`;
        break;

      default:
        return Response.json(
          { error: "Unknown suggestion type" },
          { status: 400 }
        );
    }

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    const text = result.text.trim();

    try {
      const parsed = JSON.parse(text);
      return Response.json({ suggestions: parsed });
    } catch {
      // If not valid JSON, return as array of strings
      if (type === "summary" || type === "achievement") {
        return Response.json({ suggestions: text });
      }
      return Response.json({ suggestions: text.split("\n").filter((s: string) => s.trim()) });
    }
  } catch (error) {
    console.error("AI suggestion error:", error);
    return Response.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
