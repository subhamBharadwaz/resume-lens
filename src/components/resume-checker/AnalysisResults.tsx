import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  FileSearch,
  Gauge,
  GraduationCap,
  Link,
  ListChecks,
  MailCheck,
  Medal,
  MessageSquareWarning,
  Repeat,
  Search,
  ShieldAlert,
  Sparkles,
  SpellCheck,
  Target,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { KeywordCloud } from "./KeywordCloud";
import { ScoreCard } from "./ScoreCard";
import type { ResumeAnalysis, ScoreItem } from "./types";

type AnalysisResultsProps = {
  analysis: ResumeAnalysis | null;
  state: "idle" | "loading" | "success" | "error";
  message: string;
};

const emptyScore = (title: string, summary = "Run an analysis to calculate this score."): ScoreItem => ({
  title,
  score: 0,
  summary,
});

const emptyAnalysis: ResumeAnalysis = {
  overallHealth: emptyScore("Resume Health Score", "Derived from all analysis modules after upload."),
  ats: emptyScore("ATS Compatibility", "Upload a PDF to calculate ATS compatibility."),
  match: emptyScore("Job Description Match", "Paste a role description to compare keywords."),
  review: emptyScore("AI Resume Review", "Gemini will review bullet strength and clarity."),
  recruiterReadability: emptyScore("Recruiter Readability"),
  sectionAnalysis: emptyScore("Section Analysis"),
  matchingSkills: [],
  missingSkills: [],
  weakBullets: [],
  improvedBullets: [],
  recommendations: ["Upload a PDF resume and run the ATS check to generate recommendations."],
  impact: { ...emptyScore("Impact Score"), weakBulletPoints: [], suggestedRewrites: [] },
  repetition: { ...emptyScore("Repetition Score"), repeatedPhrases: [], suggestions: [] },
  grammar: { ...emptyScore("Grammar Score"), errorCount: 0, corrections: [] },
  bulletConsistency: { ...emptyScore("Bullet Consistency"), issues: [], recommendations: [] },
  essentialSections: { ...emptyScore("Essential Sections"), missingSections: [], recommendedSections: [] },
  contactValidation: { ...emptyScore("Contact Information"), missingFields: [], invalidFields: [] },
  structureReview: { ...emptyScore("Structure Review"), orderingRecommendations: [] },
  fileQuality: { ...emptyScore("File Quality"), warnings: [], suggestions: [] },
  designReadability: {
    designScore: emptyScore("Design Score"),
    readabilityScore: emptyScore("Readability Score"),
    suggestions: [],
  },
  linkValidation: { ...emptyScore("Link Validation"), brokenLinks: [], invalidLinks: [], missingLinks: [] },
  fileName: { ...emptyScore("Filename Score"), suggestedFilename: "Firstname_Lastname_Target_Role.pdf" },
  dateConsistency: { ...emptyScore("Timeline Score"), gapWarnings: [], dateInconsistencies: [] },
  hrRedFlags: { ...emptyScore("Red Flag Score"), riskExplanations: [] },
  interviewRisk: { ...emptyScore("Interview Risk"), recruiterQuestions: [] },
  leadershipSignals: { ...emptyScore("Leadership Signals"), examplesDetected: [], suggestions: [] },
  peerBenchmarking: {
    ...emptyScore("Peer Benchmarking"),
    strengthsComparedToPeers: [],
    weaknessesComparedToPeers: [],
    note: "AI estimate generated after analysis.",
  },
  linkedinConsistency: { ...emptyScore("LinkedIn Consistency"), mismatches: [], unavailableReason: "" },
  aiRecommendations: {
    prioritizedFixes: [],
    quickWins: [],
    highImpactImprovements: [],
    topActions: [],
  },
};

function ListBlock({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{title}</div>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item} className="break-words text-sm leading-6 text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function DetailCard({
  title,
  score,
  summary,
  children,
}: {
  title: string;
  score?: number;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {typeof score === "number" ? (
            <Badge variant={score >= 70 ? "default" : "secondary"} className="tabular-nums">
              {score}/100
            </Badge>
          ) : null}
        </div>
        {summary ? <p className="text-sm leading-6 text-muted-foreground">{summary}</p> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function CategorySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-title`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${title.toLowerCase().replace(/\s+/g, "-")}-title`} className="text-lg font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function AnalysisResults({ analysis, state, message }: AnalysisResultsProps) {
  const currentAnalysis = analysis ?? emptyAnalysis;
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Alert variant={isError ? "destructive" : "default"} className="border-0 bg-transparent p-0">
            <AlertTitle>Comprehensive resume analysis</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="relative overflow-hidden shadow-lg shadow-primary/20 transition-[transform,box-shadow,background-color] duration-300 before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)] before:transition-transform before:duration-700 hover:-translate-y-0.5 hover:shadow-primary/30 hover:before:translate-x-full active:translate-y-px disabled:shadow-none disabled:before:hidden"
          >
            {isLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" aria-hidden="true" />
            )}
            {isLoading ? "Checking Resume..." : "Run Full Analysis"}
          </Button>
        </CardHeader>
        {isLoading ? (
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard {...currentAnalysis.overallHealth} icon={Trophy} />
        <ScoreCard {...currentAnalysis.ats} icon={Gauge} />
        <ScoreCard {...currentAnalysis.match} icon={Search} />
      </div>

      <CategorySection title="ATS Optimization">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard {...currentAnalysis.ats} icon={Gauge} />
          <ScoreCard {...{ ...currentAnalysis.match, title: "Keyword Match" }} icon={Target} />
          <ScoreCard {...currentAnalysis.essentialSections} icon={ListChecks} />
          <ScoreCard {...currentAnalysis.structureReview} icon={FileSearch} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <KeywordCloud title="Matching Keywords" keywords={currentAnalysis.matchingSkills} tone="matched" />
          <KeywordCloud title="Missing Keywords" keywords={currentAnalysis.missingSkills} tone="missing" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard title="Essential Sections" score={currentAnalysis.essentialSections.score} summary={currentAnalysis.essentialSections.summary}>
            <ListBlock title="Missing sections" items={currentAnalysis.essentialSections.missingSections} emptyText="No required sections are missing." />
            <ListBlock title="Recommended sections" items={currentAnalysis.essentialSections.recommendedSections} emptyText="No extra sections recommended." />
          </DetailCard>
          <DetailCard title="Section Order Review" score={currentAnalysis.structureReview.score} summary={currentAnalysis.structureReview.summary}>
            <ListBlock title="Ordering recommendations" items={currentAnalysis.structureReview.orderingRecommendations} emptyText="Section order looks aligned." />
          </DetailCard>
        </div>
      </CategorySection>

      <CategorySection title="Content Quality">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard {...currentAnalysis.impact} icon={Medal} />
          <ScoreCard {...currentAnalysis.grammar} icon={SpellCheck} />
          <ScoreCard {...currentAnalysis.repetition} icon={Repeat} />
          <ScoreCard {...currentAnalysis.bulletConsistency} icon={BadgeCheck} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard title="Quantified Impact" score={currentAnalysis.impact.score} summary={currentAnalysis.impact.summary}>
            <ListBlock title="Weak bullets" items={currentAnalysis.impact.weakBulletPoints} emptyText="No weak bullets detected." />
            <ListBlock title="Suggested rewrites" items={currentAnalysis.impact.suggestedRewrites} emptyText="No rewrites generated yet." />
          </DetailCard>
          <DetailCard title="Spelling & Grammar" score={currentAnalysis.grammar.score} summary={currentAnalysis.grammar.summary}>
            <Badge variant="secondary" className="w-fit tabular-nums">
              {currentAnalysis.grammar.errorCount} errors
            </Badge>
            <ListBlock title="Suggested corrections" items={currentAnalysis.grammar.corrections} emptyText="No corrections detected." />
          </DetailCard>
          <DetailCard title="Repetition Detection" score={currentAnalysis.repetition.score} summary={currentAnalysis.repetition.summary}>
            <ListBlock title="Repeated phrases" items={currentAnalysis.repetition.repeatedPhrases} emptyText="No repeated phrases detected." />
            <ListBlock title="Suggestions" items={currentAnalysis.repetition.suggestions} emptyText="No repetition fixes needed." />
          </DetailCard>
          <DetailCard title="Bullet Consistency" score={currentAnalysis.bulletConsistency.score} summary={currentAnalysis.bulletConsistency.summary}>
            <ListBlock title="Issues found" items={currentAnalysis.bulletConsistency.issues} emptyText="No consistency issues detected." />
            <ListBlock title="Fix recommendations" items={currentAnalysis.bulletConsistency.recommendations} emptyText="No bullet fixes needed." />
          </DetailCard>
        </div>
      </CategorySection>

      <CategorySection title="Recruiter Readiness">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard {...currentAnalysis.hrRedFlags} icon={ShieldAlert} />
          <ScoreCard {...currentAnalysis.interviewRisk} icon={MessageSquareWarning} />
          <ScoreCard {...currentAnalysis.leadershipSignals} icon={BriefcaseBusiness} />
          <ScoreCard {...currentAnalysis.peerBenchmarking} icon={GraduationCap} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard title="HR Red Flags" score={currentAnalysis.hrRedFlags.score} summary={currentAnalysis.hrRedFlags.summary}>
            <ListBlock title="Risk explanations" items={currentAnalysis.hrRedFlags.riskExplanations} emptyText="No major red flags detected." />
          </DetailCard>
          <DetailCard title="Interview Risks" score={currentAnalysis.interviewRisk.score} summary={currentAnalysis.interviewRisk.summary}>
            <ListBlock title="Potential recruiter questions" items={currentAnalysis.interviewRisk.recruiterQuestions} emptyText="No likely question areas detected." />
          </DetailCard>
          <DetailCard title="Leadership Signals" score={currentAnalysis.leadershipSignals.score} summary={currentAnalysis.leadershipSignals.summary}>
            <ListBlock title="Examples detected" items={currentAnalysis.leadershipSignals.examplesDetected} emptyText="No leadership evidence detected." />
            <ListBlock title="Strengthen leadership" items={currentAnalysis.leadershipSignals.suggestions} emptyText="No leadership suggestions yet." />
          </DetailCard>
          <DetailCard title="Peer Benchmarking" score={currentAnalysis.peerBenchmarking.score} summary={currentAnalysis.peerBenchmarking.summary}>
            <p className="text-sm leading-6 text-muted-foreground">{currentAnalysis.peerBenchmarking.note}</p>
            <ListBlock title="Strengths vs peers" items={currentAnalysis.peerBenchmarking.strengthsComparedToPeers} emptyText="No peer strengths detected." />
            <ListBlock title="Weaknesses vs peers" items={currentAnalysis.peerBenchmarking.weaknessesComparedToPeers} emptyText="No peer weaknesses detected." />
          </DetailCard>
        </div>
      </CategorySection>

      <CategorySection title="Technical Validation">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard {...currentAnalysis.contactValidation} icon={MailCheck} />
          <ScoreCard {...currentAnalysis.linkValidation} icon={Link} />
          <ScoreCard {...currentAnalysis.dateConsistency} icon={CalendarClock} />
          <ScoreCard {...currentAnalysis.fileQuality} icon={FileSearch} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard title="Contact Information" score={currentAnalysis.contactValidation.score} summary={currentAnalysis.contactValidation.summary}>
            <ListBlock title="Missing fields" items={currentAnalysis.contactValidation.missingFields} emptyText="No contact fields missing." />
            <ListBlock title="Invalid fields" items={currentAnalysis.contactValidation.invalidFields} emptyText="No invalid contact fields detected." />
          </DetailCard>
          <DetailCard title="Link Validation" score={currentAnalysis.linkValidation.score} summary={currentAnalysis.linkValidation.summary}>
            <ListBlock title="Broken links" items={currentAnalysis.linkValidation.brokenLinks} emptyText="No broken links identified without network validation." />
            <ListBlock title="Invalid links" items={currentAnalysis.linkValidation.invalidLinks} emptyText="No malformed links detected." />
            <ListBlock title="Missing links" items={currentAnalysis.linkValidation.missingLinks} emptyText="No expected links missing." />
          </DetailCard>
          <DetailCard title="Dates & Timeline" score={currentAnalysis.dateConsistency.score} summary={currentAnalysis.dateConsistency.summary}>
            <ListBlock title="Gap warnings" items={currentAnalysis.dateConsistency.gapWarnings} emptyText="No gap warnings detected." />
            <ListBlock title="Date inconsistencies" items={currentAnalysis.dateConsistency.dateInconsistencies} emptyText="No date inconsistencies detected." />
          </DetailCard>
          <DetailCard title="File Quality & Filename" score={currentAnalysis.fileQuality.score} summary={currentAnalysis.fileQuality.summary}>
            <ListBlock title="File warnings" items={currentAnalysis.fileQuality.warnings} emptyText="No file warnings detected." />
            <ListBlock title="Optimization suggestions" items={currentAnalysis.fileQuality.suggestions} emptyText="No file optimizations needed." />
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Suggested filename</div>
              <p className="mt-1 break-words text-sm leading-6">{currentAnalysis.fileName.suggestedFilename}</p>
            </div>
          </DetailCard>
          <DetailCard title="Design & Readability" summary="ATS-safe scanability and visual hierarchy review.">
            <div className="grid gap-3 sm:grid-cols-2">
              {[currentAnalysis.designReadability.designScore, currentAnalysis.designReadability.readabilityScore].map((score) => (
                <div key={score.title} className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{score.title}</span>
                    <Badge variant={score.score >= 70 ? "default" : "secondary"} className="tabular-nums">
                      {score.score}/100
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{score.summary}</p>
                </div>
              ))}
            </div>
            <ListBlock title="Suggestions" items={currentAnalysis.designReadability.suggestions} emptyText="No design suggestions detected." />
          </DetailCard>
          <DetailCard title="LinkedIn Consistency" score={currentAnalysis.linkedinConsistency.score} summary={currentAnalysis.linkedinConsistency.summary}>
            {currentAnalysis.linkedinConsistency.unavailableReason ? (
              <Alert>
                <AlertTriangle aria-hidden="true" />
                <AlertDescription>{currentAnalysis.linkedinConsistency.unavailableReason}</AlertDescription>
              </Alert>
            ) : null}
            <ListBlock title="Mismatches found" items={currentAnalysis.linkedinConsistency.mismatches} emptyText="No LinkedIn mismatches detected from available resume content." />
          </DetailCard>
        </div>
      </CategorySection>

      <CategorySection title="AI Recommendations">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <DetailCard title="Top 5 Recommended Actions" summary="Ranked by expected impact on resume health.">
            <ListBlock title="Highest impact actions" items={currentAnalysis.aiRecommendations.topActions} emptyText="Run an analysis to generate ranked actions." />
          </DetailCard>
          <DetailCard title="Quick Wins">
            <ListBlock title="Fast fixes" items={currentAnalysis.aiRecommendations.quickWins} emptyText="Run an analysis to generate quick wins." />
          </DetailCard>
          <DetailCard title="High-Impact Improvements">
            <ListBlock title="Strategic improvements" items={currentAnalysis.aiRecommendations.highImpactImprovements} emptyText="Run an analysis to generate improvements." />
          </DetailCard>
        </div>
        <DetailCard title="Prioritized Fixes">
          <ListBlock title="Full priority list" items={currentAnalysis.aiRecommendations.prioritizedFixes} emptyText="Run an analysis to generate prioritized fixes." />
        </DetailCard>
      </CategorySection>
    </div>
  );
}
