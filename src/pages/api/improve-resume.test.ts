// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./improve-resume";

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => () => "mock-gemini-model",
}));

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

function validJobDescription() {
  return "We need a frontend engineer with React, TypeScript, Node.js, testing, accessibility, performance optimization, APIs, and strong communication skills.";
}

function pdfFile(name = "Jane_Doe_Resume.pdf", sizeInBytes?: number) {
  const bytes = sizeInBytes ? new Uint8Array(sizeInBytes) : new TextEncoder().encode("%PDF-1.4 resume content");
  return new File([bytes], name, { type: "application/pdf" });
}

function formRequest({ resume, jobDescription = validJobDescription() }: { resume?: File | string; jobDescription?: string }) {
  const formData = new FormData();
  if (resume !== undefined) {
    formData.set("resume", resume);
  }
  formData.set("jobDescription", jobDescription);
  return new Request("http://localhost/api/improve-resume", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
  generateTextMock.mockReset();
});

describe("POST /api/improve-resume", () => {
  it("rejects explicit cross-origin requests with JSON", async () => {
    const request = formRequest({ resume: pdfFile() });
    request.headers.set("origin", "https://example.com");

    const response = await POST({ request } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Resume improvement requests are only allowed from Resume Lens." });
  });

  it("allows same-origin requests dynamically", async () => {
    const request = formRequest({ resume: pdfFile() });
    request.headers.set("origin", "http://localhost");
    generateTextMock.mockResolvedValue({ text: "# Improved Resume Markdown content" });

    const response = await POST({ request } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ improvedResume: "# Improved Resume Markdown content", fallback: false });
  });

  it("rejects requests without a resume file", async () => {
    const response = await POST({ request: formRequest({}) } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Upload a PDF resume file." });
  });

  it("rejects non-PDF uploads", async () => {
    const resume = new File(["hello"], "resume.txt", { type: "text/plain" });
    const response = await POST({ request: formRequest({ resume }) } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Only PDF resumes are supported." });
  });

  it("rejects PDFs over the maximum size", async () => {
    const response = await POST({ request: formRequest({ resume: pdfFile("large.pdf", 5 * 1024 * 1024 + 1) }) } as never);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ message: "PDF must be 5 MB or smaller." });
  });

  it("rejects job descriptions outside the accepted length", async () => {
    const response = await POST({ request: formRequest({ resume: pdfFile(), jobDescription: "Too short" }) } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Job description must be between 80 and 5,000 characters." });
  });

  it("returns improved resume in markdown format", async () => {
    generateTextMock.mockResolvedValue({ text: "  # Jane Doe\n\n- Improved experience bullet point.  " });

    const response = await POST({ request: formRequest({ resume: pdfFile() }) } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.improvedResume).toBe("# Jane Doe\n\n- Improved experience bullet point.");
  });

  it("returns a demo fallback resume when Gemini quota is exhausted", async () => {
    generateTextMock.mockRejectedValue(new Error("You exceeded your current quota for gemini-2.5-flash"));

    const response = await POST({ request: formRequest({ resume: pdfFile() }) } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.fallback).toBe(true);
    expect(payload.fallbackReason).toContain("Gemini quota");
    expect(payload.improvedResume).toContain("# Candidate Name");
    expect(payload.improvedResume).toContain("Resume Lens");
  });

  it("hides raw provider errors for non-quota Gemini failures", async () => {
    generateTextMock.mockRejectedValue(new Error("provider stack trace with private detail"));

    const response = await POST({ request: formRequest({ resume: pdfFile() }) } as never);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Resume improvement is temporarily unavailable. Please try again in a minute.",
    });
  });
});

describe("GET /api/improve-resume", () => {
  it("returns 405 Method Not Allowed with JSON message", async () => {
    const response = await GET({} as never);
    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({ message: "Only POST requests are supported on this endpoint." });
  });
});
