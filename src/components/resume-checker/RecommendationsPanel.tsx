import { AlertTriangle, ChevronRight, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type RecommendationsPanelProps = {
  recommendations: string[];
  weakBullets: string[];
  improvedBullets: string[];
};

export function RecommendationsPanel({ recommendations, weakBullets, improvedBullets }: RecommendationsPanelProps) {
  return (
    <Card size="sm" aria-labelledby="recommendations-title">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="text-muted-foreground" aria-hidden="true" />
          <CardTitle id="recommendations-title" className="text-sm">
            AI Resume Review
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {recommendations.map((item) => (
            <Alert key={item}>
              <AlertTriangle aria-hidden="true" />
              <AlertDescription className="flex items-start gap-3">
                <span className="min-w-0 flex-1 break-words">{item}</span>
                <ChevronRight className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </AlertDescription>
            </Alert>
          ))}
        </div>

        <div className="rounded-2xl border bg-muted/40 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <AlertTitle>Weak bullet points</AlertTitle>
              <div className="mt-2 flex flex-col gap-2">
                {weakBullets.length > 0 ? (
                  weakBullets.map((bullet) => (
                    <p key={bullet} className="break-words text-sm leading-6 text-muted-foreground">
                      {bullet}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">No weak bullets detected.</p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <AlertTitle>Stronger wording</AlertTitle>
              <div className="mt-2 flex flex-col gap-2">
                {improvedBullets.length > 0 ? (
                  improvedBullets.map((bullet) => (
                    <p key={bullet} className="break-words text-sm leading-6">
                      {bullet}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">Upload a resume to generate stronger wording.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
