import type { APIRoute } from "astro";
import { createGoogleGenerativeAI, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

export const prerender = false;

const maxPdfSize = 5 * 1024 * 1024;
const maxJobDescriptionLength = 5000;

const scoreSchema = z.object({
  title: z.string(),
  score: z.number().min(0).max(100),
  summary: z.string().max(180),
});

const detailList = (maxItems: number, maxLength = 180) => z.array(z.string().max(maxLength)).max(maxItems);

const analysisSchema = z.object({
  overallHealth: scoreSchema,
  ats: scoreSchema,
  match: scoreSchema,
  review: scoreSchema,
  recruiterReadability: scoreSchema,
  sectionAnalysis: scoreSchema,
  matchingSkills: z.array(z.string().max(40)).max(12),
  missingSkills: z.array(z.string().max(40)).max(12),
  weakBullets: z.array(z.string().max(180)).max(3),
  improvedBullets: z.array(z.string().max(220)).max(3),
  recommendations: z.array(z.string().max(180)).max(5),
  impact: scoreSchema.extend({
    weakBulletPoints: detailList(5),
    suggestedRewrites: detailList(5, 220),
  }),
  repetition: scoreSchema.extend({
    repeatedPhrases: detailList(8, 80),
    suggestions: detailList(5),
  }),
  grammar: scoreSchema.extend({
    errorCount: z.number().int().min(0).max(99),
    corrections: detailList(8),
  }),
  bulletConsistency: scoreSchema.extend({
    issues: detailList(6),
    recommendations: detailList(5),
  }),
  essentialSections: scoreSchema.extend({
    missingSections: detailList(6, 60),
    recommendedSections: detailList(6, 80),
  }),
  contactValidation: scoreSchema.extend({
    missingFields: detailList(5, 60),
    invalidFields: detailList(5, 100),
  }),
  structureReview: scoreSchema.extend({
    orderingRecommendations: detailList(5),
  }),
  fileQuality: scoreSchema.extend({
    warnings: detailList(5),
    suggestions: detailList(5),
  }),
  designReadability: z.object({
    designScore: scoreSchema,
    readabilityScore: scoreSchema,
    suggestions: detailList(5),
  }),
  linkValidation: scoreSchema.extend({
    brokenLinks: detailList(5, 120),
    invalidLinks: detailList(5, 120),
    missingLinks: detailList(5, 80),
  }),
  fileName: scoreSchema.extend({
    suggestedFilename: z.string().max(100),
  }),
  dateConsistency: scoreSchema.extend({
    gapWarnings: detailList(5),
    dateInconsistencies: detailList(5),
  }),
  hrRedFlags: scoreSchema.extend({
    riskExplanations: detailList(6),
  }),
  interviewRisk: scoreSchema.extend({
    recruiterQuestions: detailList(6),
  }),
  leadershipSignals: scoreSchema.extend({
    examplesDetected: detailList(6),
    suggestions: detailList(5),
  }),
  peerBenchmarking: scoreSchema.extend({
    strengthsComparedToPeers: detailList(5),
    weaknessesComparedToPeers: detailList(5),
    note: z.string().max(180),
  }),
  linkedinConsistency: scoreSchema.extend({
    mismatches: detailList(5),
    unavailableReason: z.string().max(180),
  }),
  aiRecommendations: z.object({
    prioritizedFixes: detailList(8),
    quickWins: detailList(5),
    highImpactImprovements: detailList(5),
    topActions: detailList(5),
  }),
});

const generatedScoreSchema = z.object({
  title: z.string(),
  score: z.number(),
  summary: z.string(),
});

const generatedAnalysisSchema = z.object({
  ats: generatedScoreSchema,
  match: generatedScoreSchema,
  review: generatedScoreSchema,
  recruiterReadability: generatedScoreSchema,
  sectionAnalysis: generatedScoreSchema,
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  weakBullets: z.array(z.string()),
  improvedBullets: z.array(z.string()),
  recommendations: z.array(z.string()),
  impact: generatedScoreSchema.extend({
    weakBulletPoints: z.array(z.string()),
    suggestedRewrites: z.array(z.string()),
  }),
  repetition: generatedScoreSchema.extend({
    repeatedPhrases: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  grammar: generatedScoreSchema.extend({
    errorCount: z.number(),
    corrections: z.array(z.string()),
  }),
  bulletConsistency: generatedScoreSchema.extend({
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  essentialSections: generatedScoreSchema.extend({
    missingSections: z.array(z.string()),
    recommendedSections: z.array(z.string()),
  }),
  contactValidation: generatedScoreSchema.extend({
    missingFields: z.array(z.string()),
    invalidFields: z.array(z.string()),
  }),
  structureReview: generatedScoreSchema.extend({
    orderingRecommendations: z.array(z.string()),
  }),
  fileQuality: generatedScoreSchema.extend({
    warnings: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  designReadability: z.object({
    designScore: generatedScoreSchema,
    readabilityScore: generatedScoreSchema,
    suggestions: z.array(z.string()),
  }),
  linkValidation: generatedScoreSchema.extend({
    brokenLinks: z.array(z.string()),
    invalidLinks: z.array(z.string()),
    missingLinks: z.array(z.string()),
  }),
  fileName: generatedScoreSchema.extend({
    suggestedFilename: z.string(),
  }),
  dateConsistency: generatedScoreSchema.extend({
    gapWarnings: z.array(z.string()),
    dateInconsistencies: z.array(z.string()),
  }),
  hrRedFlags: generatedScoreSchema.extend({
    riskExplanations: z.array(z.string()),
  }),
  interviewRisk: generatedScoreSchema.extend({
    recruiterQuestions: z.array(z.string()),
  }),
  leadershipSignals: generatedScoreSchema.extend({
    examplesDetected: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  peerBenchmarking: generatedScoreSchema.extend({
    strengthsComparedToPeers: z.array(z.string()),
    weaknessesComparedToPeers: z.array(z.string()),
    note: z.string(),
  }),
  linkedinConsistency: generatedScoreSchema.extend({
    mismatches: z.array(z.string()),
    unavailableReason: z.string(),
  }),
  aiRecommendations: z.object({
    prioritizedFixes: z.array(z.string()),
    quickWins: z.array(z.string()),
    highImpactImprovements: z.array(z.string()),
    topActions: z.array(z.string()),
  }),
});

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function compactText(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > maxLength * 0.65 ? lastSpace : truncated.length)}…`;
}

function normalizeScore(score: z.infer<typeof generatedScoreSchema>) {
  const rawScore = Number.isFinite(score.score) ? score.score : 0;
  const scaledScore = rawScore > 0 && rawScore <= 5 ? rawScore * 20 : rawScore;

  return {
    title: compactText(score.title, 40),
    score: Math.max(0, Math.min(100, Math.round(scaledScore))),
    summary: compactText(score.summary, 180),
  };
}

function normalizeList(values: string[], maxItems: number, maxLength: number) {
  return values.map((value) => compactText(value, maxLength)).filter(Boolean).slice(0, maxItems);
}

function normalizeAnalysis(analysis: z.infer<typeof generatedAnalysisSchema>) {
  const normalizedModules = {
    ats: normalizeScore(analysis.ats),
    match: normalizeScore(analysis.match),
    review: normalizeScore(analysis.review),
    recruiterReadability: normalizeScore(analysis.recruiterReadability),
    sectionAnalysis: normalizeScore(analysis.sectionAnalysis),
    matchingSkills: normalizeList(analysis.matchingSkills, 12, 40),
    missingSkills: normalizeList(analysis.missingSkills, 12, 40),
    weakBullets: normalizeList(analysis.weakBullets, 3, 180),
    improvedBullets: normalizeList(analysis.improvedBullets, 3, 220),
    recommendations: normalizeList(analysis.recommendations, 5, 180),
    impact: {
      ...normalizeScore(analysis.impact),
      weakBulletPoints: normalizeList(analysis.impact.weakBulletPoints, 5, 180),
      suggestedRewrites: normalizeList(analysis.impact.suggestedRewrites, 5, 220),
    },
    repetition: {
      ...normalizeScore(analysis.repetition),
      repeatedPhrases: normalizeList(analysis.repetition.repeatedPhrases, 8, 80),
      suggestions: normalizeList(analysis.repetition.suggestions, 5, 180),
    },
    grammar: {
      ...normalizeScore(analysis.grammar),
      errorCount: Math.max(0, Math.min(99, Math.round(analysis.grammar.errorCount || 0))),
      corrections: normalizeList(analysis.grammar.corrections, 8, 180),
    },
    bulletConsistency: {
      ...normalizeScore(analysis.bulletConsistency),
      issues: normalizeList(analysis.bulletConsistency.issues, 6, 180),
      recommendations: normalizeList(analysis.bulletConsistency.recommendations, 5, 180),
    },
    essentialSections: {
      ...normalizeScore(analysis.essentialSections),
      missingSections: normalizeList(analysis.essentialSections.missingSections, 6, 60),
      recommendedSections: normalizeList(analysis.essentialSections.recommendedSections, 6, 80),
    },
    contactValidation: {
      ...normalizeScore(analysis.contactValidation),
      missingFields: normalizeList(analysis.contactValidation.missingFields, 5, 60),
      invalidFields: normalizeList(analysis.contactValidation.invalidFields, 5, 100),
    },
    structureReview: {
      ...normalizeScore(analysis.structureReview),
      orderingRecommendations: normalizeList(analysis.structureReview.orderingRecommendations, 5, 180),
    },
    fileQuality: {
      ...normalizeScore(analysis.fileQuality),
      warnings: normalizeList(analysis.fileQuality.warnings, 5, 180),
      suggestions: normalizeList(analysis.fileQuality.suggestions, 5, 180),
    },
    designReadability: {
      designScore: normalizeScore(analysis.designReadability.designScore),
      readabilityScore: normalizeScore(analysis.designReadability.readabilityScore),
      suggestions: normalizeList(analysis.designReadability.suggestions, 5, 180),
    },
    linkValidation: {
      ...normalizeScore(analysis.linkValidation),
      brokenLinks: normalizeList(analysis.linkValidation.brokenLinks, 5, 120),
      invalidLinks: normalizeList(analysis.linkValidation.invalidLinks, 5, 120),
      missingLinks: normalizeList(analysis.linkValidation.missingLinks, 5, 80),
    },
    fileName: {
      ...normalizeScore(analysis.fileName),
      suggestedFilename: compactText(analysis.fileName.suggestedFilename, 100),
    },
    dateConsistency: {
      ...normalizeScore(analysis.dateConsistency),
      gapWarnings: normalizeList(analysis.dateConsistency.gapWarnings, 5, 180),
      dateInconsistencies: normalizeList(analysis.dateConsistency.dateInconsistencies, 5, 180),
    },
    hrRedFlags: {
      ...normalizeScore(analysis.hrRedFlags),
      riskExplanations: normalizeList(analysis.hrRedFlags.riskExplanations, 6, 180),
    },
    interviewRisk: {
      ...normalizeScore(analysis.interviewRisk),
      recruiterQuestions: normalizeList(analysis.interviewRisk.recruiterQuestions, 6, 180),
    },
    leadershipSignals: {
      ...normalizeScore(analysis.leadershipSignals),
      examplesDetected: normalizeList(analysis.leadershipSignals.examplesDetected, 6, 180),
      suggestions: normalizeList(analysis.leadershipSignals.suggestions, 5, 180),
    },
    peerBenchmarking: {
      ...normalizeScore(analysis.peerBenchmarking),
      strengthsComparedToPeers: normalizeList(analysis.peerBenchmarking.strengthsComparedToPeers, 5, 180),
      weaknessesComparedToPeers: normalizeList(analysis.peerBenchmarking.weaknessesComparedToPeers, 5, 180),
      note: compactText(analysis.peerBenchmarking.note, 180),
    },
    linkedinConsistency: {
      ...normalizeScore(analysis.linkedinConsistency),
      mismatches: normalizeList(analysis.linkedinConsistency.mismatches, 5, 180),
      unavailableReason: compactText(analysis.linkedinConsistency.unavailableReason, 180),
    },
    aiRecommendations: {
      prioritizedFixes: normalizeList(analysis.aiRecommendations.prioritizedFixes, 8, 180),
      quickWins: normalizeList(analysis.aiRecommendations.quickWins, 5, 180),
      highImpactImprovements: normalizeList(analysis.aiRecommendations.highImpactImprovements, 5, 180),
      topActions: normalizeList(analysis.aiRecommendations.topActions, 5, 180),
    },
  };

  const moduleScores = [
    normalizedModules.ats.score,
    normalizedModules.match.score,
    normalizedModules.recruiterReadability.score,
    normalizedModules.sectionAnalysis.score,
    normalizedModules.impact.score,
    normalizedModules.repetition.score,
    normalizedModules.grammar.score,
    normalizedModules.bulletConsistency.score,
    normalizedModules.essentialSections.score,
    normalizedModules.contactValidation.score,
    normalizedModules.structureReview.score,
    normalizedModules.fileQuality.score,
    normalizedModules.designReadability.designScore.score,
    normalizedModules.designReadability.readabilityScore.score,
    normalizedModules.linkValidation.score,
    normalizedModules.fileName.score,
    normalizedModules.dateConsistency.score,
    normalizedModules.hrRedFlags.score,
    normalizedModules.interviewRisk.score,
    normalizedModules.leadershipSignals.score,
    normalizedModules.peerBenchmarking.score,
    normalizedModules.linkedinConsistency.score,
  ];
  const healthScore = Math.round(moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length);

  return analysisSchema.parse({
    overallHealth: {
      title: "Resume Health Score",
      score: healthScore,
      summary: "Derived from ATS, content quality, recruiter readiness, and technical validation modules.",
    },
    ...normalizedModules,
  });
}

export const POST: APIRoute = async ({ request }) => {
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
    const { output } = await generateText({
      model: createGoogleGenerativeAI({ apiKey })("gemini-2.5-flash"),
      maxOutputTokens: 5000,
      temperature: 0.2,
      output: Output.object({ schema: generatedAnalysisSchema }),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
            includeThoughts: false,
          },
        } satisfies GoogleLanguageModelOptions,
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this resume PDF against the job description below.

Return a comprehensive structured resume analysis. Be strict, specific, and concise.
Do not include markdown.
Every score must be a whole number from 0 to 100, not a 0-5 score and not a decimal.
Keep score summaries under 25 words.
Keep list items short and actionable.
Return empty arrays when no issues are detected.
For peerBenchmarking, clearly state that it is an AI estimate.
For linkedinConsistency, do not claim to browse LinkedIn. If LinkedIn page content is unavailable, set unavailableReason and only compare against visible resume URL/title text.
For linkValidation, flag malformed URLs. If network validation is unavailable, do not invent broken links.

Required modules:
- ats: ATS structure, parsing, formatting, and compatibility.
- match: job description keyword and skill match.
- review: general resume content quality.
- recruiterReadability: recruiter scanability and clarity.
- sectionAnalysis: quality of resume sections.
- impact: measurable achievements in bullets, weak bullets, and rewrites.
- repetition: repeated phrases, repeated action verbs, keyword stuffing, duplicate wording.
- grammar: spelling, grammar, capitalization, and punctuation.
- bulletConsistency: bullet format, tense, action verb, and punctuation consistency.
- essentialSections: contact, professional summary, skills, work experience, projects, education.
- contactValidation: email, phone, LinkedIn, portfolio, GitHub validity.
- structureReview: compare section order to Contact, Summary, Skills, Experience, Projects, Education.
- fileQuality: PDF format, file size, likely resume length, ATS compatibility.
- designReadability: visual hierarchy, density, scanability, ATS-safe readability.
- linkValidation: LinkedIn, GitHub, portfolio, and website URLs.
- fileName: filename quality and suggested filename.
- dateConsistency: missing dates, overlapping dates, impossible timelines, unexplained gaps.
- hrRedFlags: job hopping, gaps, generic descriptions, buzzwords, lack of measurable impact.
- interviewRisk: likely recruiter questions.
- leadershipSignals: team leadership, mentoring, ownership, cross-functional work, project leadership.
- peerBenchmarking: estimated competitiveness across skills, experience, projects, leadership, impact.
- aiRecommendations: prioritized fixes, quick wins, high-impact improvements, and exactly top 5 actions.

Uploaded file metadata:
- filename: ${resume.name}
- sizeBytes: ${resume.size}
- isPdf: true

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

    return json({ analysis: normalizeAnalysis(output) });
  } catch (error) {
    console.error("Resume analysis failed:", error instanceof Error ? error.message : error);
    return json({ message: "Gemini could not analyze this PDF. Try a text-based PDF under 5 MB." }, 502);
  }
};
