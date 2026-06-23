import type { APIRoute } from "astro";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const prerender = false;

const maxPdfSize = 5 * 1024 * 1024;
const maxJobDescriptionLength = 5000;
const allowedOrigins = new Set(["https://resume-lens-mu.vercel.app", "http://localhost:4321"]);

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestOrigin = new URL(request.url).origin;
    if (origin === requestOrigin) return true;
  } catch {}

  return allowedOrigins.has(origin);
}

function isQuotaError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes("quota") || normalized.includes("rate limit") || normalized.includes("429") || normalized.includes("resource_exhausted");
}

function createFallbackImprovedResume(jobDescription: string) {
  const roleMatch = jobDescription.match(/\b(frontend|software|full[-\s]?stack|backend|web|react|node)\b.*?\b(engineer|developer)\b/i);
  const targetRole = roleMatch?.[0]?.replace(/\s+/g, " ") ?? "Software Engineer";

  return `# Candidate Name

email@example.com | linkedin.com/in/candidate | github.com/candidate | portfolio.example.com

## Professional Summary

Results-driven ${targetRole} with hands-on experience building reliable web applications, improving product workflows, and collaborating across engineering, design, and business teams. Strong focus on React, TypeScript, API integration, clean implementation, accessibility, testing, and measurable user impact.

## Technical Skills

- Languages: TypeScript, JavaScript, HTML, CSS, SQL
- Frontend: React, responsive UI, accessibility, state management, performance optimization
- Backend: Node.js, REST APIs, authentication flows, server-side validation
- Tools: Git, CI/CD, automated testing, debugging, documentation

## Experience

### Software Engineering Intern | Project-Based Experience

- Built responsive React and TypeScript interfaces that improved task completion speed and reduced repeated manual steps for users.
- Integrated backend APIs with resilient loading, empty, and error states to make product workflows easier to complete and debug.
- Improved UI quality by adding validation, accessible labels, clear feedback messages, and consistent component behavior.
- Collaborated with stakeholders to translate job requirements into focused features, prioritizing maintainability and user value.

### Web Application Developer | Academic and Portfolio Projects

- Developed full-stack application features using React, Node.js, and structured API contracts.
- Optimized components for readability, reuse, and predictable state updates across common user workflows.
- Added automated checks and manual QA passes to catch regressions before delivery.

## Projects

### Resume Lens | AI Resume Analysis Tool

- Created an ATS-focused resume checker that accepts PDF uploads, compares resumes against job descriptions, and presents structured improvement guidance.
- Implemented AI-assisted recommendations, score breakdowns, PDF preview generation, and downloadable improved resume output.
- Designed graceful fallback behavior so demos remain usable when external AI quota is temporarily unavailable.

## Education

### Degree / Program Name | Institution Name

- Relevant coursework: Data Structures, Web Development, Database Systems, Software Engineering

## Selected Strengths

- Converts ambiguous requirements into usable product features.
- Writes clear, maintainable code with attention to validation and error handling.
- Communicates implementation tradeoffs clearly with technical and non-technical teammates.`;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAllowedOrigin(request)) {
    return json({ message: "Resume improvement requests are only allowed from Resume Lens." }, 403);
  }

  const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey || apiKey === "replace_with_rotated_gemini_key") {
    return json(
      { message: "Gemini API key is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env, then restart the dev server." },
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "Could not read the uploaded resume. Upload a PDF resume and try again." }, 400);
  }
  const resume = formData.get("resume");
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();

  if (!(resume instanceof File)) {
    return json({ message: "Upload a PDF resume file." }, 400);
  }

  if (!isPdf(resume)) {
    return json({ message: "Only PDF resumes are supported." }, 400);
  }

  if (resume.size > maxPdfSize) {
    return json({ message: "PDF must be 5 MB or smaller." }, 413);
  }

  if (jobDescription.length < 80 || jobDescription.length > maxJobDescriptionLength) {
    return json({ message: "Job description must be between 80 and 5,000 characters." }, 400);
  }

  const fileBytes = new Uint8Array(await resume.arrayBuffer());

  try {
    const { text } = await generateText({
      model: createGoogleGenerativeAI({ apiKey })("gemini-2.5-flash"),
      maxOutputTokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert resume writer and career coach. Review the uploaded resume PDF and the target job description. 
Rewrite and optimize the entire resume to align perfectly with the target job description.

Specifically:
1. Tailor experience bullets and skills to emphasize qualifications required in the job description.
2. Quantify impact and achievements using numbers and metrics where appropriate.
3. Improve phrasing using strong action verbs.
4. Correct any grammatical or spelling issues.
5. Structure the output as a clean, professionally formatted Markdown document.

Do not include any chat introductory or concluding remarks, warning notes, or markdown backticks formatting like "\`\`\`markdown" at the start and end of the response. Output ONLY the raw markdown content of the improved resume.

Job description:
${jobDescription}`,
            },
            {
              type: "file",
              data: fileBytes,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    });

    return json({ improvedResume: text.trim(), fallback: false });
  } catch (error) {
    console.error("Resume improvement failed:", error instanceof Error ? error.message : error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isQuotaError(errorMessage)) {
      return json({
        improvedResume: createFallbackImprovedResume(jobDescription),
        fallback: true,
        fallbackReason: "Gemini quota is temporarily unavailable, so Resume Lens generated a demo improved resume for this internship demo.",
      });
    }

    return json({ message: "Resume improvement is temporarily unavailable. Please try again in a minute." }, 502);
  }
};

export const GET: APIRoute = async () => {
  return json({ message: "Only POST requests are supported on this endpoint." }, 405);
};
