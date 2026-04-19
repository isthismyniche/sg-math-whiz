# SG Math Whiz — Claude Code Guide

## What this project is

A daily PSLE math challenge app for adults (25–55). One question per day, submitted once, ranked by speed. Built by Manish (PO) in MVP phase.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind v4 (CSS `@theme` — no `tailwind.config.js`)
- **Backend**: Vercel Serverless Functions (`api/**/*.ts`) using `@vercel/node`
- **Database**: Supabase PostgreSQL (service role key for scripts, anon key for frontend)
- **Storage**: Supabase Storage — bucket `question-diagrams` (public) for diagram images
- **Animation**: Framer Motion
- **Local dev**: `vercel dev` (not `npm run dev`) — required for API routes to work

## Project structure

```
api/                    Vercel serverless functions
  _lib/                 Shared: supabase.ts, auth.ts, dates.ts
  today.ts              GET today's question
  submit.ts             POST answer
  solution/[id].ts      GET solution (requires prior attempt)
  question/[date].ts    GET past question by date
  me.ts                 GET user stats
  past-questions.ts     GET list of past challenges
  leaderboard/          Streak + daily leaderboards
scripts/                Question ingestion pipeline (run with npx tsx)
  extract-questions.ts  PDF → JSON via Claude Vision (resumable)
  curate-questions.ts   Rank difficulty, keep top %
  generate-review.ts    JSON → TSV for PO review
  import-questions.ts   TSV → Supabase (uploads diagrams to Storage)
  schedule-questions.ts Assign dates to unscheduled questions
src/
  pages/                ChallengePage, SolutionPage, HomePage, PastChallengesPage, LeaderboardPage
  components/           ExamPaper, ResultDisplay, SuspenseReveal, Timer, ...
  types/index.ts        Shared API request/response types
  lib/                  api.ts, storage.ts (localStorage helpers)
supabase/migrations/    SQL migrations (applied manually via Supabase SQL editor)
data/                   All gitignored — local only
  papers/               Source PDFs
  extracted/            Per-paper JSON from extraction
  curated/              curated-questions.json (top % by difficulty)
  review/               questions-for-review.tsv (PO fills answers here)
  diagrams/             Source images for diagram questions
```

## Design system

Defined in `src/index.css` via Tailwind v4 `@theme`. Use these tokens, never hardcode colours:

| Token | Value | Use |
|-------|-------|-----|
| `bg-primary` | `#0A0F1C` | Page background |
| `bg-secondary` | `#141B2D` | Section backgrounds |
| `bg-card` | `#1C2438` | Cards |
| `accent-red` | `#E63946` | Primary CTA, errors |
| `accent-amber` | `#F4A261` | Highlights, streaks, correct answers |
| `text-primary` | `#F1FAEE` | Body text |
| `text-secondary` | `#A8B2C1` | Labels, metadata |
| `success` | `#2DC653` | Correct answer feedback |
| `error` | `#E63946` | Wrong answer feedback |

Fonts: `font-display` (Instrument Serif), `font-body` (DM Sans), `font-mono` (JetBrains Mono). Base font size is 18px.

## Key architectural rules

- **`correct_answer` is never sent to the frontend before submission** — never add it to API responses from `today.ts` or `question/[date].ts`
- **All dates are Singapore time (SGT, UTC+8)** — use `getTodaySGT()` from `api/_lib/dates.ts`
- **Supabase client**: service role (bypasses RLS) for `api/` and scripts; anon key for frontend
- **Auth**: username stored in localStorage, passed as `x-user-id` header — see `api/_lib/auth.ts`

## Question ingestion pipeline

```
data/papers/ → extract → data/extracted/ → curate → data/curated/
→ generate-review → data/review/questions-for-review.tsv
→ PO fills: correct_answer, solution_explanation, diagram_filename, approved (Y/N)
→ import → Supabase (diagram uploaded to Storage, date = NULL)
→ schedule → dates assigned
```

TSV columns: `source`, `number`, `question_text`, `topic`, `difficulty_score`, `difficulty_reason`, `correct_answer`, `solution_explanation`, `difficulty`, `diagram_filename`, `approved`

To add questions manually: add rows directly to the TSV with all fields filled, then run import.

For diagram questions: drop image into `data/diagrams/<filename>.png`, set `diagram_filename` in TSV. Import uploads to Supabase Storage and stores the public URL in `diagram_url`.

To test a specific question today in localhost, update its date directly in Supabase SQL editor:
```sql
UPDATE questions SET date = 'YYYY-MM-DD' WHERE question_text = '...' ;
```

## Supabase schema (key tables)

**`questions`**: `id`, `date` (nullable = unscheduled), `question_text`, `correct_answer`, `solution_explanation`, `source`, `topic`, `difficulty`, `diagram_url`, `created_at`

**`users`**: `id` (matches localStorage userId), `display_name`, `created_at`

**`attempts`**: `id`, `user_id`, `question_id`, `submitted_answer`, `is_correct`, `time_ms`, `is_daily`, `created_at`

Migrations applied manually — no Supabase CLI linked. Run SQL in Supabase dashboard → SQL Editor.

## ExamPaper component

The challenge and solution pages render questions in an exam-paper style (`bg-[#FFFEF9]`, serif font, ruled lines, red margin). If `diagramUrl` is set, an image renders inside the paper above the answer input. The `SolutionPage` renders the same exam paper style but read-only.

## Submit flow (race condition handled)

`ChallengePage` waits for **both** the animation timer (`SuspenseReveal`) **and** the API response before showing the result. `apiReady` is React state (not a ref) so it triggers re-renders. Never revert this to a ref.

## Before shipping to production

Always run `npm run build` and confirm it exits cleanly before committing code intended for production. Fix any TypeScript or build errors before pushing.

## What Manish decides, not Claude

- All architectural decisions
- Any changes to the question curation criteria
- Scheduling strategy changes
- Deployment timing
