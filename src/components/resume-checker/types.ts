export type UploadedFile = {
  name: string;
  size: number;
  previewUrl: string;
};

export type ScoreItem = {
  title: string;
  score: number;
  summary: string;
};

export type ImpactAnalysis = ScoreItem & {
  weakBulletPoints: string[];
  suggestedRewrites: string[];
};

export type RepetitionAnalysis = ScoreItem & {
  repeatedPhrases: string[];
  suggestions: string[];
};

export type GrammarAnalysis = ScoreItem & {
  errorCount: number;
  corrections: string[];
};

export type BulletConsistencyAnalysis = ScoreItem & {
  issues: string[];
  recommendations: string[];
};

export type EssentialSectionsAnalysis = ScoreItem & {
  missingSections: string[];
  recommendedSections: string[];
};

export type ContactValidationAnalysis = ScoreItem & {
  missingFields: string[];
  invalidFields: string[];
};

export type StructureReviewAnalysis = ScoreItem & {
  orderingRecommendations: string[];
};

export type FileQualityAnalysis = ScoreItem & {
  warnings: string[];
  suggestions: string[];
};

export type DesignReadabilityAnalysis = {
  designScore: ScoreItem;
  readabilityScore: ScoreItem;
  suggestions: string[];
};

export type LinkValidationAnalysis = ScoreItem & {
  brokenLinks: string[];
  invalidLinks: string[];
  missingLinks: string[];
};

export type FileNameAnalysis = ScoreItem & {
  suggestedFilename: string;
};

export type DateConsistencyAnalysis = ScoreItem & {
  gapWarnings: string[];
  dateInconsistencies: string[];
};

export type HrRedFlagsAnalysis = ScoreItem & {
  riskExplanations: string[];
};

export type InterviewRiskAnalysis = ScoreItem & {
  recruiterQuestions: string[];
};

export type LeadershipSignalsAnalysis = ScoreItem & {
  examplesDetected: string[];
  suggestions: string[];
};

export type PeerBenchmarkingAnalysis = ScoreItem & {
  strengthsComparedToPeers: string[];
  weaknessesComparedToPeers: string[];
  note: string;
};

export type LinkedinConsistencyAnalysis = ScoreItem & {
  mismatches: string[];
  unavailableReason: string;
};

export type AiRecommendations = {
  prioritizedFixes: string[];
  quickWins: string[];
  highImpactImprovements: string[];
  topActions: string[];
};

export type ResumeAnalysis = {
  overallHealth: ScoreItem;
  ats: ScoreItem;
  match: ScoreItem;
  review: ScoreItem;
  recruiterReadability: ScoreItem;
  sectionAnalysis: ScoreItem;
  matchingSkills: string[];
  missingSkills: string[];
  weakBullets: string[];
  improvedBullets: string[];
  recommendations: string[];
  impact: ImpactAnalysis;
  repetition: RepetitionAnalysis;
  grammar: GrammarAnalysis;
  bulletConsistency: BulletConsistencyAnalysis;
  essentialSections: EssentialSectionsAnalysis;
  contactValidation: ContactValidationAnalysis;
  structureReview: StructureReviewAnalysis;
  fileQuality: FileQualityAnalysis;
  designReadability: DesignReadabilityAnalysis;
  linkValidation: LinkValidationAnalysis;
  fileName: FileNameAnalysis;
  dateConsistency: DateConsistencyAnalysis;
  hrRedFlags: HrRedFlagsAnalysis;
  interviewRisk: InterviewRiskAnalysis;
  leadershipSignals: LeadershipSignalsAnalysis;
  peerBenchmarking: PeerBenchmarkingAnalysis;
  linkedinConsistency: LinkedinConsistencyAnalysis;
  aiRecommendations: AiRecommendations;
};
