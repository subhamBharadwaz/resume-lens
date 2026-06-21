import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";

type ScoreCardProps = {
  title: string;
  score: number;
  summary: string;
  icon: LucideIcon;
};

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Needs Work";
  return "High Risk";
}

export function ScoreCard({ title, score, summary, icon: Icon }: ScoreCardProps) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="truncate text-sm">{title}</CardTitle>
          </div>
          <Badge variant={score >= 70 ? "default" : "secondary"}>{scoreLabel(score)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-3xl font-medium tabular-nums">
          {score}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </div>
        <Progress value={score}>
          <ProgressLabel className="sr-only">{title}</ProgressLabel>
        </Progress>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}
