# Psychological Consultation Intake Form

A full-stack intake form for preparing first psychological consultations. The app collects structured client context, generates an AI-assisted preliminary analysis, saves the submission to Notion, and sends separate email reports to the client and therapist.

This project was built as a practical automation tool for a private consulting workflow: reduce manual preparation time, preserve sensitive context in an organized system, and give clients a calm, guided way to reflect before the first session.

## Project Highlights

- Real-world client intake workflow for psychological consultations
- Multi-step interactive form with progress tracking and draft saving
- AI-generated client summary and therapist-only professional analysis
- Notion database integration for structured case management
- Automated email notifications via Gmail/Nodemailer
- Responsive React interface with thoughtful UX for sensitive personal data

## Features

### Guided Intake Experience

The form helps a client describe their current situation before the first consultation. It includes:

- Contact details and consent-related checks
- A "Wheel of Life" assessment across 8 life areas
- Problem-to-goal mapping across 6 psychological directions
- Open questions about obstacles, expectations, previous experience, and referral source
- Auto-saved drafts in LocalStorage to prevent accidental data loss
- Submission status states for analyzing, loading, success, and errors

### AI-Assisted Analysis

The app uses Google Gemini to generate two different outputs from the same intake data:

- A short, warm summary shown to the client after submission
- A deeper therapist-only analysis for preparation before the first session

The detailed analysis is intentionally not displayed to the client in the UI.

### Notion CRM-Style Storage

On submission, the backend creates a new Notion database entry with:

- Client contact data
- Wheel of Life scores
- Problem and goal pairs
- Open-question answers
- AI summary and detailed analysis
- Timestamped submission metadata

### Email Automation

The server sends two types of emails:

- Client email: confirmation, copy of answers, and supportive AI summary
- Therapist email: full intake report with detailed AI analysis

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling and UI | Tailwind CSS, Motion, Lucide React |
| Backend | Node.js, Express |
| AI | Google Gemini API via `@google/genai` |
| Storage | Notion API |
| Email | Nodemailer with Gmail App Passwords |
| Tooling | TypeScript, Vite, tsx |

## Architecture

```text
Client Browser
  |
  | React intake form
  | LocalStorage draft saving
  | Gemini-powered preliminary analysis
  v
Express API: /api/submit-form
  |
  |-- Notion API: stores structured consultation record
  |
  |-- Nodemailer/Gmail: sends client confirmation
  |
  |-- Nodemailer/Gmail: sends therapist report
```

## What I Built

- Designed the full intake flow and data model for a sensitive consulting use case
- Implemented a responsive React form with dynamic sections, sliders, repeatable problem-goal pairs, and progress tracking
- Integrated Gemini structured output for separate client-facing and therapist-facing AI summaries
- Built an Express submission endpoint that saves structured records to Notion
- Implemented automated email reporting with different content for client and therapist
- Added browser draft persistence and user-friendly success/error states

## Why This Project Matters

The project demonstrates the ability to connect product thinking with implementation. It is not only a form: it is an operational workflow that combines UX, AI, database automation, and email delivery around a real professional process.

For recruiters, this project shows experience with:

- Building end-to-end web applications
- Working with third-party APIs and external services
- Designing user flows for real business needs
- Handling asynchronous workflows and error states
- Structuring AI output for practical use
- Thinking about privacy and role-based information visibility

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key
- A Notion integration and database
- A Gmail account with an App Password for Nodemailer

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
NOTION_API_KEY=your_notion_internal_integration_token
NOTION_DATABASE_ID=your_notion_database_id
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### Run Locally

```bash
npm run dev
```

The app runs with the Express server and Vite development environment.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run lint
```

## Notion Database Requirements

The Notion database should contain properties for client identity, contact information, Wheel of Life scores, intake answers, and AI analysis fields. The backend expects property names that match the current implementation.

Key fields include:

- Name/title
- Email
- Phone
- Submission date
- 8 numeric Wheel of Life scores
- Problem/goal text fields for each direction
- AI client summary
- AI therapist analysis

## Privacy Notes

This repository does not include API keys, credentials, or real client submissions. Sensitive values must be provided through environment variables.

Because the product handles personal psychological information, any production deployment should also include explicit consent language, secure hosting, access control, and a clear data-retention policy.

## Roadmap

- Add a public demo mode with mocked submission data
- Add screenshots and a short product walkthrough
- Move AI analysis fully server-side to avoid exposing API keys in the client bundle
- Add automated tests for validation and submission flows
- Improve Notion schema validation and setup documentation
- Add deployment documentation for a production environment

## License

MIT License. See [LICENSE](./LICENSE) for details.