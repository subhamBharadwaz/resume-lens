import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KeywordCloudProps = {
  title: string;
  keywords: string[];
  tone: "matched" | "missing";
};

export function KeywordCloud({ title, keywords, tone }: KeywordCloudProps) {
  const id = `${tone}-keywords`;

  return (
    <Card size="sm" className="min-w-0" aria-labelledby={id}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle id={id} className="text-sm">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="tabular-nums">
            {keywords.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.length > 0 ? (
            keywords.map((keyword) => (
              <Badge key={keyword} variant={tone === "matched" ? "default" : "outline"} className="max-w-full">
                <span className="truncate">{keyword}</span>
                {tone === "matched" ? <Check data-icon="inline-end" aria-hidden="true" /> : null}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Run an analysis to populate this list.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
