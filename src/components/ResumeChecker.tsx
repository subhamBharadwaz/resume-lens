import { useEffect, useState } from "react";
import { AnalysisResults } from "./resume-checker/AnalysisResults";
import { FileUploadPanel } from "./resume-checker/FileUploadPanel";
import { JobDescriptionPanel } from "./resume-checker/JobDescriptionPanel";
import { sampleJobDescription } from "./resume-checker/sampleData";
import type { ResumeAnalysis, UploadedFile } from "./resume-checker/types";

type RequestState = "idle" | "loading" | "success" | "error";
type AnalysisResponse = { analysis?: ResumeAnalysis; message?: string };

async function readAnalysisResponse(response: Response): Promise<AnalysisResponse> {
  const body = await response.text();

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as AnalysisResponse;
  } catch {
    return {
      message: response.ok ? "Resume analysis returned an invalid response." : body,
    };
  }
}

export default function ResumeChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [jobDescription, setJobDescription] = useState(sampleJobDescription);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("Upload a PDF resume to run the backend ATS check.");

  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
    };
  }, [uploadedFile?.previewUrl]);

  async function submitAnalysis(event: { preventDefault: () => void }) {
    event.preventDefault();

    if (!file) {
      setRequestState("error");
      setMessage("Upload a PDF resume before running the ATS check.");
      return;
    }

    setRequestState("loading");
    setMessage("Analyzing resume with Gemini 2.5 Flash…");

    const formData = new FormData();
    formData.set("resume", file);
    formData.set("jobDescription", jobDescription);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });
      const payload = await readAnalysisResponse(response);

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.message ?? "Resume analysis failed. Try a smaller PDF or shorter job description.");
      }

      setAnalysis(payload.analysis);
      setRequestState("success");
      setMessage("Analysis complete.");
    } catch (error) {
      setAnalysis(null);
      setRequestState("error");
      setMessage(error instanceof Error ? error.message : "Resume analysis failed. Try again.");
    }
  }

  function handleFileSelection(nextFile: File | null) {
    setFile(nextFile);
    setAnalysis(null);

    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }

    if (!nextFile) {
      setUploadedFile(null);
      setMessage("Upload a PDF resume to run the backend ATS check.");
      return;
    }

    setUploadedFile({ name: nextFile.name, size: nextFile.size, previewUrl: URL.createObjectURL(nextFile) });
    setMessage("PDF ready. Run the ATS check when the job description looks right.");
  }

  return (
    <form id="checker" className="flex flex-col gap-4" onSubmit={submitAnalysis} noValidate>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <FileUploadPanel file={uploadedFile} onFileChange={handleFileSelection} />
        <JobDescriptionPanel value={jobDescription} onChange={setJobDescription} />
      </div>

      <AnalysisResults analysis={analysis} state={requestState} message={message} />
    </form>
  );
}
