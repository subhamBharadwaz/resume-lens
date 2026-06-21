# Resume Lens

AI-powered ATS Resume Checker

Resume Lens analyzes PDF resumes against a job description and returns a structured, actionable report that helps candidates optimize for Applicant Tracking Systems (ATS) and recruiter readability.

- Built with: Astro + React + Tailwind CSS + TypeScript
- AI backend: Google Gemini via `@ai-sdk/google` and the `ai` package

---

## Table of contents

- [What it does](#what-it-does)
- [Features](#features)
- [Architecture & flow](#architecture--flow)
- [Quick start (local development)](#quick-start-local-development)
- [Environment variables](#environment-variables)
- [API: /api/analyze-resume](#api-apianalyze-resume)
- [Testing](#testing)
- [Branch & commit conventions](#branch--commit-conventions)
- [Privacy & security](#privacy--security)
- [Contributing](#contributing)
- [Author](#author)

---

## What it does

Resume Lens accepts a PDF resume and a pasted job description, sends the file and prompt to a generative AI model (Gemini) and returns a normalized JSON analysis. The frontend presents:

- ATS compatibility score and suggestions
- Job description keyword matches and missing keywords
- Resume health, content quality and recruiter-readiness scores
- Grammar, repetition and bullet-strength analysis
- Actionable AI recommendations and suggested rewrites
- Link, filename and timeline validation hints

This project is an opinionated, minimal implementation meant for local development and experimentation.

## Features

- Client: drag-and-drop or file input PDF upload with preview and client-side validation (PDF only, <= 5 MB)
- Server API: typed endpoint that validates input, sends data to Gemini, and normalizes the structured result using zod
- Results dashboard: scorecards, keyword clouds, prioritized recommendations and suggested rewrites
- Tests: vitest + Testing Library tests for the API and main UI flows
- SEO-ready landing page built with Astro

## Architecture & flow

1. User uploads a PDF and pastes a job description in the UI.
2. The client sends a multipart POST to `POST /api/analyze-resume` with `resume` (file) and `jobDescription` (string).
3. The API validates inputs, reads the file bytes and sends a prompt + file to Gemini using the `ai` + `@ai-sdk/google` libraries.
4. The model returns a structured object which the endpoint normalizes and returns to the client.
5. The client renders the analysis with scorecards and detailed modules.

## Quick start (local development)

Prerequisites

- Node.js 18 or newer
- npm (or compatible package manager)
- A Google Generative AI / Gemini API key if you want the real AI integration

Clone and install

```sh
git clone git@github.com:subhamBharadwaz/resume-lens.git
cd resume-lens
npm install
```

Environment

Create a `.env` file in the project root or set environment variables in your shell. At minimum provide:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

Run the development server

```sh
npm run dev
```

Open `http://localhost:3000` (Astro default) and try uploading a PDF and a job description.

Build and preview

```sh
npm run build
npm run preview
```

Notes

- The dev server is configured with a server body size limit to support file uploads. See `astro.config.mjs` for adapter settings.
- The API will return helpful errors when required validation fails (non-PDF uploads, files > 5MB, job description length outside 80–5000 characters).

## Environment variables

- `GOOGLE_GENERATIVE_AI_API_KEY` — required for the Gemini integration. If not set, the API returns a 503 with instructions.

Keep your API key secret. Do not commit `.env` or keys to source control.

## API: /api/analyze-resume

Endpoint: `POST /api/analyze-resume`

Form fields (multipart/form-data):

- `resume` — file, must be a PDF (application/pdf), max 5 MB
- `jobDescription` — string, 80–5,000 characters

Response (success 200):

```json
{ "analysis": { /* normalized structured analysis object */ } }
```

Common error responses:

- 400 — missing file, invalid type, or job description length out of range
- 413 — PDF too large (> 5 MB)
- 503 — Gemini API key not configured
- 502 — Gemini request failed (model error)

Example curl (local dev server):

```sh
curl -s -X POST http://localhost:3000/api/analyze-resume \
  -F "resume=@/path/to/your_resume.pdf" \
  -F "jobDescription=We need a frontend engineer with React, TypeScript..."
```

## Testing

Run unit and component tests with Vitest:

```sh
npm run test
# or
npm run test:watch
```

## Branch & commit conventions

This project follows Conventional Commits and a simple branch naming convention:

- Branches:
  - feature/<short-description>
  - fix/<short-description>
  - test/<short-description>
  - docs/<short-description>
  - chore/<short-description>

- Commit message format: `type(scope): short summary` + optional body. Common types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`.

Example:

```
feat(resume): add resume upload UI with PDF preview
```

## Privacy & security

- Uploaded resumes may contain personal data. Do not use production API keys or real user data in public or shared demo environments.
- The project sends file bytes and prompt text to the configured generative AI provider (Gemini). That provider will receive the content — review their policy and your account settings before sending sensitive resumes.

## Contributing

- Create a branch for your work: `feature/short-description`.
- Run and add tests for any new behavior.
- Open a pull request with a clear description and link to related issues.

## Author

This project scaffold and demo implementation were created by Subham Shyamal Bharadwaz.

---

If you'd like, I can also open draft PRs for the pushed branches or create GitHub Actions for CI. Let me know which you'd prefer.