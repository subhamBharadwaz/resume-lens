import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type JobDescriptionPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function JobDescriptionPanel({ value, onChange }: JobDescriptionPanelProps) {
  return (
    <Card className="min-h-full" aria-labelledby="job-title">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle id="job-title">Job description</CardTitle>
            <CardDescription>Paste the role text you want the resume matched against.</CardDescription>
          </div>
          <Badge variant="secondary">Step 2</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="job-description">Role details</FieldLabel>
              <Button type="button" variant="ghost" size="xs" onClick={() => onChange("")}>
                Clear
              </Button>
            </div>
            <Textarea
              id="job-description"
              name="jobDescription"
              className="min-h-72 resize-y leading-6 lg:min-h-[24.6rem]"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Paste the job description here..."
              spellCheck={true}
              autoComplete="off"
              maxLength={5000}
              required
            />
            <FieldDescription className="text-right tabular-nums" aria-live="polite">
              {new Intl.NumberFormat("en").format(value.length)}/5,000
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
