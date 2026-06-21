import { FileCheck2, FileText, Upload, X } from "lucide-react";
import type { ChangeEvent, DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { formatFileSize, isPdfFile } from "./fileUtils";
import type { UploadedFile } from "./types";

const maxFileSize = 5 * 1024 * 1024;

type FileUploadPanelProps = {
  file: UploadedFile | null;
  onFileChange: (file: File | null) => void;
};

export function FileUploadPanel({ file, onFileChange }: FileUploadPanelProps) {
  const hasFile = Boolean(file);

  function handleCandidate(nextFile: File | undefined) {
    if (hasFile) return;
    if (!nextFile) return;
    if (!isPdfFile(nextFile) || nextFile.size > maxFileSize) {
      onFileChange(null);
      return;
    }
    onFileChange(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (hasFile) return;
    handleCandidate(event.dataTransfer.files[0]);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    handleCandidate(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleRemoveFile() {
    onFileChange(null);
  }

  return (
    <Card className="min-h-full" aria-labelledby="upload-title">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle id="upload-title">Upload resume</CardTitle>
            <CardDescription>PDF only, up to 5 MB.</CardDescription>
          </div>
          <Badge variant="secondary">Step 1</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel
              htmlFor="resume-upload"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              aria-disabled={hasFile}
              className={cn(
                "min-h-72 w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center transition-colors",
                hasFile ? "cursor-default border-primary/30 bg-primary/5 hover:bg-primary/5" : "cursor-pointer hover:bg-muted/70"
              )}
            >
              {file ? (
                <div className="flex w-full max-w-md flex-col items-center gap-4">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border bg-background shadow-sm">
                    <object
                      data={`${file.previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="size-full"
                      aria-label={`${file.name} preview`}
                    >
                      <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
                        <FileCheck2 aria-hidden="true" />
                        <span className="text-sm font-medium">Preview unavailable</span>
                      </div>
                    </object>
                  </div>
                  <div className="flex w-full items-center justify-center gap-3 rounded-lg border bg-background p-3 text-left">
                    <FileText className="shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{file.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove Uploaded Resume" onClick={handleRemoveFile}>
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid size-12 place-items-center rounded-full bg-background text-primary shadow-sm ring-1 ring-border">
                    <Upload aria-hidden="true" />
                  </div>
                  <div className="flex max-w-sm flex-col items-center gap-2">
                    <span className="text-base font-medium">Upload PDF resume</span>
                    <span className="text-sm font-normal leading-6 text-muted-foreground">
                      Gemini reads the document on the backend and returns a structured ATS report.
                    </span>
                  </div>
                  <Badge variant="default">Choose PDF</Badge>
                </>
              )}
              <input
                id="resume-upload"
                className="sr-only"
                name="resume"
                type="file"
                accept="application/pdf,.pdf"
                aria-label="Upload PDF Resume"
                onChange={handleFileInput}
                disabled={hasFile}
                required
              />
            </FieldLabel>
            <FieldDescription aria-live="polite">
              {file ? "Resume attached and ready for analysis." : "Select a valid PDF resume before analysis."}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
