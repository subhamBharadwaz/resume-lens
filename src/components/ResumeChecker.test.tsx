import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResumeChecker from "./ResumeChecker";
import type { ResumeAnalysis } from "./resume-checker/types";

const createObjectURL = vi.fn(() => "blob:resume-preview");
const revokeObjectURL = vi.fn();

function score(title: string, value = 82) {
  return {
    title,
    score: value,
    summary: `${title} summary`,
  };
}

const mockAnalysis: ResumeAnalysis = {
  overallHealth: score("Resume Health Score", 84),
  ats: score("ATS Compatibility", 88),
  match: score("Job Description Match", 79),
  review: score("AI Resume Review", 83),
  recruiterReadability: score("Recruiter Readability", 81),
  sectionAnalysis: score("Section Analysis", 80),
  matchingSkills: ["React", "TypeScript"],
  missingSkills: ["Docker"],
  weakBullets: ["Responsible for frontend development"],
  improvedBullets: ["Improved frontend performance by 35% using React profiling."],
  recommendations: ["Add measurable business outcomes to recent bullets."],
  impact: {
    ...score("Impact Score", 72),
    weakBulletPoints: ["Worked on dashboards"],
    suggestedRewrites: ["Built dashboards used by 200 weekly users."],
  },
  repetition: {
    ...score("Repetition Score", 76),
    repeatedPhrases: ["worked on"],
    suggestions: ["Vary action verbs across experience bullets."],
  },
  grammar: {
    ...score("Grammar Score", 91),
    errorCount: 2,
    corrections: ["Capitalize JavaScript consistently."],
  },
  bulletConsistency: {
    ...score("Bullet Consistency", 86),
    issues: ["Mixed periods at bullet endings."],
    recommendations: ["Use punctuation consistently across all bullets."],
  },
  essentialSections: {
    ...score("Essential Sections", 90),
    missingSections: [],
    recommendedSections: ["Add a short professional summary."],
  },
  contactValidation: {
    ...score("Contact Information", 95),
    missingFields: ["Portfolio URL"],
    invalidFields: [],
  },
  structureReview: {
    ...score("Structure Review", 84),
    orderingRecommendations: ["Move skills before experience for this role."],
  },
  fileQuality: {
    ...score("File Quality", 92),
    warnings: [],
    suggestions: ["Keep the PDF under 2 pages for recruiter scanning."],
  },
  designReadability: {
    designScore: score("Design Score", 80),
    readabilityScore: score("Readability Score", 85),
    suggestions: ["Reduce dense paragraph blocks."],
  },
  linkValidation: {
    ...score("Link Validation", 78),
    brokenLinks: [],
    invalidLinks: ["linkedin.com/in/example missing protocol"],
    missingLinks: ["GitHub URL"],
  },
  fileName: {
    ...score("Filename Score", 70),
    suggestedFilename: "Jane_Doe_Frontend_Engineer.pdf",
  },
  dateConsistency: {
    ...score("Timeline Score", 89),
    gapWarnings: [],
    dateInconsistencies: [],
  },
  hrRedFlags: {
    ...score("Red Flag Score", 74),
    riskExplanations: ["Several bullets are generic and impact-light."],
  },
  interviewRisk: {
    ...score("Interview Risk", 77),
    recruiterQuestions: ["Which metrics prove the dashboard improved workflow speed?"],
  },
  leadershipSignals: {
    ...score("Leadership Signals", 68),
    examplesDetected: ["Owned frontend migration"],
    suggestions: ["Name team size or cross-functional partners."],
  },
  peerBenchmarking: {
    ...score("Peer Benchmarking", 73),
    strengthsComparedToPeers: ["Strong React and TypeScript alignment."],
    weaknessesComparedToPeers: ["Fewer quantified outcomes than similar candidates."],
    note: "AI estimate based on the uploaded resume and job description.",
  },
  linkedinConsistency: {
    ...score("LinkedIn Consistency", 65),
    mismatches: [],
    unavailableReason: "LinkedIn profile content cannot be fetched in this analysis.",
  },
  aiRecommendations: {
    prioritizedFixes: ["Quantify the top three recent accomplishments."],
    quickWins: ["Rename the file with name and target role."],
    highImpactImprovements: ["Add metrics to project outcomes."],
    topActions: [
      "Quantify recent impact bullets.",
      "Add missing Docker keyword if accurate.",
      "Fix malformed LinkedIn URL.",
      "Add portfolio URL.",
      "Clarify leadership scope.",
    ],
  },
};

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL,
    revokeObjectURL,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResumeChecker", () => {
  it("previews a selected PDF and allows removing it", async () => {
    const user = userEvent.setup();
    render(<ResumeChecker />);

    const file = new File(["%PDF-1.4"], "Jane_Doe_Resume.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/upload pdf resume/i), file);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByLabelText("Jane_Doe_Resume.pdf preview")).toBeInTheDocument();
    expect(screen.getByText("Jane_Doe_Resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("Resume attached and ready for analysis.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove uploaded resume/i }));

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:resume-preview");
    expect(screen.queryByLabelText("Jane_Doe_Resume.pdf preview")).not.toBeInTheDocument();
    expect(screen.getByText("Select a valid PDF resume before analysis.")).toBeInTheDocument();
  });

  it("keeps detailed analysis sections hidden until AI data is available", () => {
    render(<ResumeChecker />);

    expect(screen.getByText("Analysis modules are ready.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "ATS Optimization" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Content Quality" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recruiter Readiness" })).not.toBeInTheDocument();
  });

  it("submits the PDF and job description, then renders comprehensive analysis modules", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ analysis: mockAnalysis }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ResumeChecker />);

    await user.upload(screen.getByLabelText(/upload pdf resume/i), new File(["%PDF-1.4"], "Jane_Doe_Resume.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: /run full analysis/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/analyze-resume", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText("Analysis complete.")).toBeInTheDocument();

    const submittedBody = fetchMock.mock.calls[0][1].body as FormData;
    expect(submittedBody.get("resume")).toBeInstanceOf(File);
    expect(String(submittedBody.get("jobDescription"))).toContain("React, Node.js, and TypeScript");

    expect(screen.getAllByText("Resume Health Score")[0]).toBeInTheDocument();
    expect(screen.getByText("Content Quality")).toBeInTheDocument();
    expect(screen.getByText("Recruiter Readiness")).toBeInTheDocument();
    expect(screen.getByText("Technical Validation")).toBeInTheDocument();
    expect(screen.getByText("Top 5 Recommended Actions")).toBeInTheDocument();
    expect(screen.getByText("Quantify recent impact bullets.")).toBeInTheDocument();
    expect(screen.getByText("Jane_Doe_Frontend_Engineer.pdf")).toBeInTheDocument();
  });

  it("shows plain text API errors without a JSON parse failure", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Cross-site POST form submissions are forbidden",
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ResumeChecker />);

    await user.upload(screen.getByLabelText(/upload pdf resume/i), new File(["%PDF-1.4"], "Jane_Doe_Resume.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: /run full analysis/i }));

    expect(await screen.findByText("Cross-site POST form submissions are forbidden")).toBeInTheDocument();
  });

  it("shows a helpful error before submission when no PDF is selected", async () => {
    const user = userEvent.setup();
    render(<ResumeChecker />);

    await user.click(screen.getByRole("button", { name: /run full analysis/i }));

    expect(screen.getByText("Upload a PDF resume before running the ATS check.")).toBeInTheDocument();
  });
});
