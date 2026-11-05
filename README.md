# CareerTech — Vercel deployment package

CareerTech helps individual job seekers track opportunities and analyze how their CV demonstrates job requirements. This package contains the Next.js frontend, Express backend, PostgreSQL migrations and AI integration.

**Start with [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).** It contains the exact Vercel project settings, environment variables and deployment order.

## Where each part lives

| Folder / file                        | Contents                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `frontend/`                          | Next.js 16, React 19, TypeScript App Router and CSS                          |
| `frontend/app/page.tsx`              | Dashboard, applications, CV manager, analysis, history and settings          |
| `frontend/app/model.ts`              | UI types and explicitly fictional demo fixtures                              |
| `frontend/next.config.ts`            | Same-origin `/api` proxy to the Express deployment                           |
| `frontend/vercel.json`               | Frontend Vercel configuration                                                |
| `backend/`                           | Express 5 / Node.js 24 / TypeScript API                                      |
| `backend/src/index.ts`               | Vercel entry point: exports the Express application                          |
| `backend/src/local.ts`               | Local development / Docker HTTP listener                                     |
| `backend/src/application.ts`         | Authentication, CV uploads, opportunities, dashboard, history and reports    |
| `backend/src/ai/analysis.service.ts` | Model requests, response validation, source quotes and weighted match scores |
| `backend/src/database/client.ts`     | PostgreSQL connection pool                                                   |
| `backend/test/`                      | Full API workflow tests                                                      |
| `backend/vercel.json`                | Express Vercel configuration                                                 |
| `database/migrations/`               | Numbered SQL schema migrations                                               |
| `database/migrate.mjs`               | Tracked, transactional migration runner                                      |
| `samples/`                           | Fictional CV PDFs, opportunities and report example                          |
| `docs/`                              | API reference, brief coverage, demonstration script and presentation         |
| `scripts/`                           | Sample generation, demo seeding and deployment configuration tests           |
| `.github/workflows/ci.yml`           | Build, type-check and automated tests                                        |

The AI is part of the Express backend, as required by the brief. It is not a separate Python service. PostgreSQL is external to Vercel and can be hosted on a provider such as Neon. CV PDF bytes and extracted text are stored in that database, not on Vercel's temporary filesystem.

## Local setup

Requires Node.js 24 and PostgreSQL 17 (or Docker).

```sh
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up -d db
npm run db:migrate
```

In two terminals:

```sh
npm run dev:backend
```

```sh
npm run dev:frontend
```

Open http://localhost:3000. The frontend forwards `/api` to http://localhost:4000, so you can register and log in directly. Set AI credentials in `backend/.env` to run analyses. Without AI credentials, tracking still works and analysis returns a clear configuration error.

## Checks and builds

```sh
npm run build
npm run check
npm test
```

The frontend now uses a standard Next.js build (`frontend/.next`), rather than static export. The backend compiles into `backend/dist`. Deployment configuration tests cover the rewrite and Vercel entry point. Workflow tests use an embedded PostgreSQL engine and deterministic AI fixtures; they do not make billable provider calls.

## Live configuration

Deploy **two Vercel projects from the same GitHub repository**: select `backend` as one project's Root Directory and `frontend` as the other's. Use the checklist in DEPLOY_VERCEL.md. Do not import the repository root as a single application.

- Frontend server variable: `BACKEND_URL` points to the deployed backend origin.
- Backend secrets: `DATABASE_URL`, `AI_API_KEY`, plus `AI_BASE_URL` and `AI_MODEL`.
- Backend variable: `FRONTEND_URL` must exactly match the frontend origin.
- Leave `COOKIE_CROSS_SITE=false` and leave `NEXT_PUBLIC_API_URL` unset. Requests pass through the same-origin proxy.
- Leave `NEXT_PUBLIC_DEMO_MODE=false` for real accounts. Set it to `true` only for the explicitly fictional demonstration workspace.

Vercel does not create the database or AI provider credentials automatically. Run database migrations separately before traffic reaches a new schema. Actual Vercel publication and live AI/database checks still require your accounts and environment values.

## Important deployment details

CV uploads are limited to **4 MB** to stay below Vercel's request/response limits with multipart overhead. Selectable text is required; scanned CVs need OCR first. Keep PDFs small enough for both upload and later download.

Vercel backend runtime limits allow 120 seconds in the supplied configuration. The AI request itself times out after 60 seconds. Confirm that your Vercel plan supports the configured duration.

Passwords use bcrypt, sessions use hashed random tokens with HttpOnly cookies, and private database queries check ownership. All frontend/API traffic should use HTTPS in production. AI quotes are checked against the supplied CV and job description, but users must still review semantic interpretations. Scores measure documented alignment, never hiring probability. Missing mentions are unconfirmed, not proof of absent skills.

The existing Express rate-limit store is per process. Vercel instances can restart and scale independently; use Vercel Firewall or a shared rate-limit store before exposing this to substantial public traffic. The user-data database remains persistent across instances.

For optional local open-source AI, configure Ollama with `AI_BASE_URL=http://localhost:11434/v1`, `AI_API_KEY=ollama`, and a locally installed model in `AI_MODEL`. A Vercel function cannot reach your laptop's localhost; production needs a reachable cloud model API or securely hosted model endpoint.

## Samples and presentation

The fictional demo account seeder requires an explicit `SEED_PASSWORD` and should run only against a development API. It creates sample jobs and a main CV. It does not inject fictional results into live report history.

```sh
SEED_PASSWORD='choose-a-unique-local-password' node scripts/seed-demo.mjs
```

The included presentation describes the original project build. For the current folder paths and deployment topology, use this README and DEPLOY_VERCEL.md. The previous hosted demo remains separate from this Vercel package.
