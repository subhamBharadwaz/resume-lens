import { useState, useEffect } from "react";
import { AlertCircle, Download, Sparkles, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type ImprovementPanelProps = {
  file: File | null;
  jobDescription: string;
  visible: boolean;
};

export function ImprovementPanel({ file, jobDescription, visible }: ImprovementPanelProps) {
  const [improvedResume, setImprovedResume] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Automatically compile PDF preview when the improved resume is first loaded
  useEffect(() => {
    if (state === "success" && improvedResume) {
      const timer = setTimeout(() => {
        compilePdf();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [improvedResume, state]);

  async function handleImprove() {
    if (!file) return;

    setState("loading");
    setErrorMessage("");
    setCompilationError(null);
    setFallbackReason(null);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    try {
      const response = await fetch("/api/improve-resume", {
        method: "POST",
        body: formData,
      });

      const body = await response.text();
      let payload: { improvedResume?: string; message?: string; fallback?: boolean; fallbackReason?: string } = {};
      try {
        payload = JSON.parse(body);
      } catch {
        payload = { message: response.ok ? "Invalid response." : body };
      }

      if (!response.ok || !payload.improvedResume) {
        throw new Error(payload.message ?? "Failed to improve resume.");
      }

      setImprovedResume(payload.improvedResume);
      setFallbackReason(payload.fallback ? payload.fallbackReason ?? "Using demo improved resume content because the AI provider is temporarily unavailable." : null);
      setState("success");
    } catch (err) {
      setImprovedResume(null);
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to improve resume.");
    }
  }

  async function compilePdf() {
    if (!improvedResume) return;
    setIsCompiling(true);
    setCompilationError(null);
    try {
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;

      if (!jsPDF) {
        throw new Error("jsPDF module could not be resolved.");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      renderResumePdf(pdf, improvedResume);

      const blob = pdf.output("blob");
      const nextUrl = URL.createObjectURL(blob);

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      setPdfPreviewUrl(nextUrl);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setCompilationError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCompiling(false);
    }
  }

  function renderResumePdf(pdf: any, markdown: string) {
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 18;
    const marginTop = 16;
    const marginBottom = 16;
    const contentWidth = pageWidth - marginX * 2;
    let y = marginTop;

    const ensureSpace = (height: number) => {
      if (y + height <= pageHeight - marginBottom) return;
      pdf.addPage();
      y = marginTop;
    };

    const setTextColor = (hex: string) => {
      pdf.setTextColor(hex);
    };

    const writeWrapped = (
      text: string,
      options: { size: number; style?: "normal" | "bold"; color?: string; lineHeight?: number; indent?: number; align?: "left" | "center" },
    ) => {
      const indent = options.indent ?? 0;
      const lineHeight = options.lineHeight ?? options.size * 0.45;
      pdf.setFont("helvetica", options.style ?? "normal");
      pdf.setFontSize(options.size);
      setTextColor(options.color ?? "#475569");

      const lines = pdf.splitTextToSize(stripMarkdownBold(text), contentWidth - indent);
      ensureSpace(lines.length * lineHeight);

      const x = options.align === "center" ? pageWidth / 2 : marginX + indent;
      pdf.text(lines, x, y, { align: options.align ?? "left" });
      y += lines.length * lineHeight;
    };

    const lines = markdown.split("\n");

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        y += 2.8;
        continue;
      }

      if (trimmed.startsWith("# ")) {
        ensureSpace(14);
        writeWrapped(trimmed.replace("# ", ""), {
          size: 18,
          style: "bold",
          color: "#0f172a",
          lineHeight: 8,
          align: "center",
        });
        pdf.setDrawColor("#e2e8f0");
        pdf.line(marginX, y - 2, pageWidth - marginX, y - 2);
        y += 2;
        continue;
      }

      if (trimmed.startsWith("## ")) {
        const title = trimmed.replace("## ", "").toUpperCase();
        y += 2;
        ensureSpace(10);
        pdf.setDrawColor("#fecdd3");
        pdf.line(marginX, y + 3, pageWidth - marginX, y + 3);
        writeWrapped(title, {
          size: 10,
          style: "bold",
          color: "#d9383a",
          lineHeight: 5,
        });
        y += 1;
        continue;
      }

      if (trimmed.startsWith("### ")) {
        const subtitle = trimmed.replace("### ", "");
        const parts = subtitle.split(" | ");
        ensureSpace(7);
        if (parts.length > 1) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          setTextColor("#1e293b");
          pdf.text(stripMarkdownBold(parts[0]), marginX, y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          setTextColor("#64748b");
          pdf.text(stripMarkdownBold(parts[parts.length - 1]), pageWidth - marginX, y, { align: "right" });
          y += 5;
        } else {
          writeWrapped(subtitle, { size: 9, style: "bold", color: "#1e293b", lineHeight: 5 });
        }
        continue;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const text = trimmed.replace(/^[-*]\s+/, "");
        ensureSpace(6);
        pdf.setFillColor("#94a3b8");
        pdf.circle(marginX + 1.5, y - 1.3, 0.55, "F");
        writeWrapped(text, { size: 8.5, color: "#475569", lineHeight: 4.4, indent: 5 });
        continue;
      }

      if (y < 42 && (trimmed.includes("@") || trimmed.includes("github") || trimmed.includes("linkedin") || trimmed.includes("http"))) {
        writeWrapped(trimmed, {
          size: 8,
          color: "#64748b",
          lineHeight: 4,
          align: "center",
        });
        continue;
      }

      writeWrapped(trimmed, { size: 8.5, color: "#475569", lineHeight: 4.4 });
    }
  }

  function stripMarkdownBold(text: string) {
    return text.replace(/\*\*/g, "");
  }

  function handleDownloadPdf() {
    if (!pdfPreviewUrl) return;
    const filename = `${file ? file.name.replace(/\.[^/.]+$/, "") : "resume"}_improved.pdf`;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!visible) return null;

  return (
    <Card className="mt-8 border-primary/20 bg-gradient-to-b from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary animate-pulse" />
          AI Improved Resume Builder
        </CardTitle>
        <CardDescription>
          Customize the AI-generated text and view your live PDF preview. Download the PDF directly when done.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state === "idle" && (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-2xl bg-muted/20">
            <Sparkles className="size-8 text-muted-foreground/60 mb-2 animate-bounce" />
            <p className="text-sm text-muted-foreground mb-4">Tailor your experience bullets, grammar, and keywords in one click.</p>
            <Button onClick={handleImprove} size="lg">
              Generate AI Improved Resume
            </Button>
          </div>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Spinner className="size-8 text-primary mb-4" />
            <h3 className="text-sm font-medium">Re-writing and Tailoring Resume...</h3>
            <p className="text-xs text-muted-foreground mt-1">This may take up to 20 seconds. Gemini is reviewing qualifications and impact metrics.</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Improvement Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={handleImprove} className="w-fit self-center">
              Try Again
            </Button>
          </div>
        )}

        {state === "success" && improvedResume !== null && (
          <div className="grid gap-6 lg:grid-cols-2 mt-2">
            {fallbackReason ? (
              <Alert className="lg:col-span-2">
                <AlertCircle className="size-4" />
                <AlertTitle>Demo fallback active</AlertTitle>
                <AlertDescription>{fallbackReason}</AlertDescription>
              </Alert>
            ) : null}

            {/* Left: Text Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Edit Resume Text (Markdown)
              </label>
              <textarea
                value={improvedResume}
                onChange={(e) => setImprovedResume(e.target.value)}
                className="w-full h-[550px] p-4 bg-background border rounded-2xl font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none scrollbar-thin"
              />
              <Button onClick={compilePdf} disabled={isCompiling} className="mt-2 w-full">
                {isCompiling ? <Spinner className="size-4 mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                Update PDF Preview
              </Button>
            </div>

            {/* Right: PDF Preview */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PDF Preview
                </label>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!pdfPreviewUrl} className="h-7 gap-1">
                  <Download className="size-3.5" />
                  Download PDF
                </Button>
              </div>
              <div className="flex-1 min-h-[550px] h-[550px] border rounded-2xl overflow-hidden bg-muted/20 relative shadow-inner">
                {isCompiling && (
                  <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-10">
                    <Spinner className="size-6 text-primary mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">Generating PDF...</span>
                  </div>
                )}
                {compilationError ? (
                  <div className="flex size-full flex-col items-center justify-center p-6 text-center text-destructive">
                    <AlertCircle className="size-6 mb-2" />
                    <span className="text-sm font-semibold">Preview Generation Failed</span>
                    <p className="text-xs text-muted-foreground mt-1">{compilationError}</p>
                    <Button variant="outline" size="sm" onClick={compilePdf} className="mt-4">
                      Retry Preview
                    </Button>
                  </div>
                ) : pdfPreviewUrl ? (
                  <object
                    data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    type="application/pdf"
                    className="size-full"
                    aria-label="AI Improved Resume PDF Preview"
                  >
                    <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
                      <AlertCircle className="size-6 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">PDF preview not supported by your browser.</span>
                      <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                        Download PDF Instead
                      </Button>
                    </div>
                  </object>
                ) : (
                  <div className="flex size-full flex-col items-center justify-center text-muted-foreground p-6">
                    <Spinner className="size-6 text-primary/60 mb-2" />
                    <span className="text-sm">Generating preview...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
