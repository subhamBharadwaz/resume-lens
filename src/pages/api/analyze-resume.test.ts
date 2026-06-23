// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./analyze-resume";

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => () => "mock-gemini-model",
}));

vi.mock("ai", () => ({
  generateText: generateTextMock,
  Output: {
    object: (value: unknown) => value,
  },
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
  return new Request("http://localhost/api/analyze-resume", {
    method: "POST",
    body: formData,
  });
}

function generatedScore(title: string, score = 80) {
  return {
    title,
    score,
    summary: `${title} summary`,
  };
}

function generatedAnalysis(score = 80) {
  return {
    ats: generatedScore("ATS Compatibility", score),
    match: generatedScore("Job Description Match", score),
    review: generatedScore("AI Resume Review", score),
    recruiterReadability: generatedScore("Recruiter Readability", score),
    sectionAnalysis: generatedScore("Section Analysis", score),
    matchingSkills: ["React", "TypeScript"],
    missingSkills: ["Docker"],
    weakBullets: ["Responsible for frontend development"],
    improvedBullets: ["Improved frontend performance by 40%."],
    recommendations: ["Add measurable outcomes."],
    impact: {
      ...generatedScore("Impact Score", score),
      weakBulletPoints: ["Worked on frontend"],
      suggestedRewrites: ["Reduced page load time by 40%."],
    },
    repetition: {
      ...generatedScore("Repetition Score", score),
      repeatedPhrases: ["worked on"],
      suggestions: ["Vary action verbs."],
    },
    grammar: {
      ...generatedScore("Grammar Score", score),
      errorCount: 1,
      corrections: ["Use consistent capitalization."],
    },
    bulletConsistency: {
      ...generatedScore("Bullet Consistency", score),
      issues: ["Mixed punctuation."],
      recommendations: ["Use consistent punctuation."],
    },
    essentialSections: {
      ...generatedScore("Essential Sections", score),
      missingSections: ["Projects"],
      recommendedSections: ["Professional Summary"],
    },
    contactValidation: {
      ...generatedScore("Contact Information", score),
      missingFields: ["Portfolio URL"],
      invalidFields: ["Malformed LinkedIn URL"],
    },
    structureReview: {
      ...generatedScore("Structure Review", score),
      orderingRecommendations: ["Move skills above experience."],
    },
    fileQuality: {
      ...generatedScore("File Quality", score),
      warnings: ["Resume may be longer than two pages."],
      suggestions: ["Keep PDF under 5 MB."],
    },
    designReadability: {
      designScore: generatedScore("Design Score", score),
      readabilityScore: generatedScore("Readability Score", score),
      suggestions: ["Reduce dense text blocks."],
    },
    linkValidation: {
      ...generatedScore("Link Validation", score),
      brokenLinks: [],
      invalidLinks: ["github.com/example missing protocol"],
      missingLinks: ["Portfolio URL"],
    },
    fileName: {
      ...generatedScore("Filename Score", score),
      suggestedFilename: "Jane_Doe_Frontend_Engineer.pdf",
    },
    dateConsistency: {
      ...generatedScore("Timeline Score", score),
      gapWarnings: ["Unexplained 8-month gap."],
      dateInconsistencies: [],
    },
    hrRedFlags: {
      ...generatedScore("Red Flag Score", score),
      riskExplanations: ["Several bullets lack metrics."],
    },
    interviewRisk: {
      ...generatedScore("Interview Risk", score),
      recruiterQuestions: ["How did you measure the performance improvement?"],
    },
    leadershipSignals: {
      ...generatedScore("Leadership Signals", score),
      examplesDetected: ["Owned release process"],
      suggestions: ["Add team size."],
    },
    peerBenchmarking: {
      ...generatedScore("Peer Benchmarking", score),
      strengthsComparedToPeers: ["Strong frontend stack match."],
      weaknessesComparedToPeers: ["Less quantified impact than similar candidates."],
      note: "AI estimate based on resume and job description.",
    },
    linkedinConsistency: {
      ...generatedScore("LinkedIn Consistency", score),
      mismatches: [],
      unavailableReason: "LinkedIn content is unavailable without browsing.",
    },
    aiRecommendations: {
      prioritizedFixes: ["Quantify top bullets."],
      quickWins: ["Rename file with target role."],
      highImpactImprovements: ["Add measurable project outcomes."],
      topActions: ["Quantify impact.", "Fix LinkedIn URL.", "Add portfolio.", "Add projects.", "Clarify leadership."],
    },
  };
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
  generateTextMock.mockReset();
});

describe("POST /api/analyze-resume", () => {
  it("rejects explicit cross-origin requests with JSON", async () => {
    const request = formRequest({ resume: pdfFile() });
    request.headers.set("origin", "https://example.com");

    const response = await POST({ request } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Resume analysis requests are only allowed from Resume Lens." });
  });

  it("allows same-origin requests dynamically", async () => {
    const request = formRequest({ resume: pdfFile() });
    request.headers.set("origin", "http://localhost");
    generateTextMock.mockResolvedValue({ output: generatedAnalysis(80) });

    const response = await POST({ request } as never);

    expect(response.status).toBe(200);
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

  it("returns normalized comprehensive analysis with a derived health score", async () => {
    generateTextMock.mockResolvedValue({ output: generatedAnalysis(80) });

    const response = await POST({ request: formRequest({ resume: pdfFile("resume_final_final.pdf") }) } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.analysis.overallHealth).toEqual({
      title: "Resume Health Score",
      score: 80,
      summary: "Derived from ATS, content quality, recruiter readiness, and technical validation modules.",
    });
    expect(payload.analysis.fileName.suggestedFilename).toBe("Jane_Doe_Frontend_Engineer.pdf");
    expect(payload.analysis.aiRecommendations.topActions).toHaveLength(5);

    const prompt = generateTextMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(prompt).toContain("filename: resume_final_final.pdf");
    expect(prompt).toContain("Required modules:");
  });
});
