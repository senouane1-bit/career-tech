# Requirement coverage

Source: CareerTech(1).pdf, all 13 pages. This checklist separates implemented code from external deployment that is still pending. “Implemented” means the code path exists, not that an external production provider has been connected. See README for test limits.

| Brief section | Requirement                                                 | Implementation / evidence                                                        | Status                                               |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1             | Central personal job-search workspace                       | Overview, Applications, My CV, CV analysis, History                              | Implemented                                          |
| 1             | Organize opportunities and applications                     | Typed opportunity records and PostgreSQL persistence                             | Implemented                                          |
| 1             | Show progress and recent activity                           | Dashboard counts, pipeline, activity and dates                                   | Implemented                                          |
| 1             | Help present existing qualifications                        | Structured AI report and section-specific suggestions                            | Implemented; live AI needs configuration             |
| 1–2           | One job-seeker role, no recruiters/employers/admin role     | Users table and own-workspace routes only                                        | Implemented                                          |
| 1             | No automatic applications or external job-board integration | Manual records, optional outbound posting link                                   | Scope preserved                                      |
| 2 / 3.1 A     | Email/password registration                                 | /auth/register, bcrypt, validation                                               | Tested                                               |
| 2 / 3.1 A     | Login and logout                                            | Hashed random sessions, HttpOnly cookie, revocation                              | Tested                                               |
| 2 / 3.1 A     | View/update basic profile                                   | /profile, Settings name and goal                                                 | Tested                                               |
| 2 / 3.1 A     | Private workspace and owner isolation                       | All record/file queries require user_id                                          | Tested across two accounts                           |
| 3.1 A         | Protect private documents                                   | Authenticated PDF routes, no public upload directory, private no-store responses | Tested                                               |
| 3.1 B         | PDF main CV upload                                          | Multer, extension, MIME, signature and size validation                           | Tested                                               |
| 3.1 B         | View CV metadata                                            | Filename, size, timestamp and SHA-256 fingerprint                                | Implemented                                          |
| 3.1 B         | Open original main PDF                                      | Authorized file route and UI action                                              | Tested                                               |
| 3.1 B         | Replace one main CV                                         | Row lock, transaction and partial unique index                                   | Tested                                               |
| 3.1 B         | Select main CV in analysis                                  | Independent analysis source selector                                             | Tested                                               |
| 3.1 B         | Alternative PDF per analysis                                | Multipart cv on /analyses, separate CV row                                       | Tested                                               |
| 3.1 B         | Alternative upload does not replace main                    | is_main=false, separate reference                                                | Tested                                               |
| 3.1 B         | Clear invalid/unsupported/unreadable feedback               | User-facing 400/422 errors, unreadable/scanned guidance                          | Tested                                               |
| 3.1 B         | Prior reports identify the original CV version              | Immutable CV ID, name, hash and extracted content retained                       | Tested                                               |
| 3.1 C         | Job title, company, description                             | Validated fields in opportunity editor/API                                       | Tested                                               |
| 3.1 C         | Optional original posting link                              | HTTP(S) URL validation and safe outbound link                                    | Tested                                               |
| 3.1 C         | Application date and personal notes                         | Editable dates/notes preserved in JSONB                                          | Implemented                                          |
| 3.1 C         | Add/list/read/edit/delete opportunities                     | /jobs CRUD and UI editor/detail view                                             | Tested                                               |
| 3.1 C         | Search title or company                                     | Client search and backend q filter                                               | Browser/API tested                                   |
| 3.1 C         | Filter status                                               | UI and API filtering                                                             | Browser/API tested                                   |
| 3.1 D         | Saved, Applied, Interview, Offer, Rejected                  | Shared frontend list and validated backend enum                                  | Tested                                               |
| 3.1 D         | User-controlled status changes                              | Dropdown and edit form only                                                      | Tested                                               |
| 3.1 D         | Statistics update after changes                             | Derived from current records; refreshed after mutations                          | Tested                                               |
| 3.1 D / 4     | AI cannot change statuses or decide to apply                | Analysis route never updates jobs                                                | Tested                                               |
| 3.1 E         | Total and per-status counts                                 | Actual account job rows, no fabricated live statistics                           | Tested                                               |
| 3.1 E         | Recently added opportunities                                | Created-at ordering and recent table                                             | Implemented                                          |
| 3.1 E         | Recent application activity                                 | Timestamped activity records                                                     | Tested                                               |
| 3.1 E         | Main CV and AI shortcuts                                    | Dashboard cards                                                                  | Browser inspected                                    |
| 3.1 E         | Dashboard responds to create/edit/delete                    | Refresh after CRUD, derived demo state                                           | API/browser tested                                   |
| 3.1 F         | Analyze without saving an application                       | Independent /analyses endpoint and page                                          | Tested                                               |
| 3.1 F         | Select PDF, paste description, request analysis             | Analysis form and multipart API                                                  | Implemented                                          |
| 3.1 F         | Loading and failure feedback                                | Disabled processing action, errors, timeouts                                     | Implemented                                          |
| 3.1 F.1       | Overall assessment and understandable category              | Summary + server-derived category                                                | Tested                                               |
| 3.1 F.2       | Matching qualifications with evidence                       | Requirement explanations and verified verbatim quotes                            | Tested                                               |
| 3.1 F.3       | Unsupported versus unclear requirements                     | Separate response statuses and UI labels                                         | Implemented                                          |
| 3.1 F.3       | Missing mention does not prove missing skill                | Prompt, report disclaimer and unconfirmed wording                                | Implemented                                          |
| 3.1 F.4       | Relevant experience/projects/education/certifications       | Evidence-grounded relevantExperience array                                       | Implemented                                          |
| 3.1 F.5       | Practical suggestions using existing qualifications         | Section, suggestion, rationale and source quote                                  | Implemented                                          |
| 3.1 F.5       | Never encourage invented achievements                       | Prompt constraints, quote validation and user review                             | Implemented; semantic model mistakes remain possible |
| 3.1 G         | History list and reopen original reports                    | GET /analyses, History page and report detail                                    | Tested                                               |
| 3.1 G         | Original description, CV reference, results and date        | Stored report and CV snapshot, detail tabs                                       | Tested                                               |
| 3.1 G         | New analyses/main CV replacements preserve past reports     | New rows, stable references                                                      | Tested                                               |
| 3.1 G         | Delete own history records                                  | Owner-scoped DELETE /analyses/:id                                                | Tested                                               |
| 3.2 A         | Explainable 0–100 weighted match score                      | Server formula, weights and visible explanation                                  | Tested                                               |
| 3.2 A         | Score is not hiring probability                             | Explanation and disclaimer                                                       | Implemented                                          |
| 3.2 B         | Submission, follow-up and interview dates                   | Date inputs, stored fields, upcoming actions                                     | Implemented                                          |
| 3.2 C         | Company/title/status/date filtering                         | Search, status, addedFrom, appliedFrom and sort                                  | Implemented                                          |
| 3.2 D         | Current-month applications and monthly change               | thisMonth, lastMonth, difference                                                 | Tested                                               |
| 3.2 D         | Interview count and status distribution                     | KPI and pipeline                                                                 | Implemented                                          |
| 3.3           | Application reminders                                       | In-app Coming up list and reminder icon, no external notifications               | Implemented within app                               |
| 3.3           | Downloadable PDF analysis reports                           | Frontend PDF export and authorized API PDF route                                 | API tested                                           |
| 3.3           | AI tailoring suggestions                                    | Existing-CV section-specific improvement suggestions                             | Implemented                                          |
| 3.3           | Notes history                                               | Timestamped updates linked to opportunity                                        | Tested                                               |
| 3.3           | Personal goals                                              | Editable monthly target and progress                                             | Tested                                               |
| 4.1–4.3       | Read professional data and job requirements                 | Model prompt includes skills, education, projects and evidence                   | Implemented; real provider not exercised             |
| 4.2           | Document processing in backend                              | Node pdf-parse in Express                                                        | Tested with actual PDFs                              |
| 4.2           | Backend model request                                       | OpenAI-compatible REST adapter, 60-second timeout                                | Implemented; credentials pending                     |
| 4.2           | Response validation before presentation/history             | Strict Zod structure plus quoted source validation                               | Tested                                               |
| 4.3           | Recognize ecosystem relationships                           | Prompt example: Express.js supports Node.js experience                           | Implemented in prompt, provider-dependent            |
| 4.3           | Insufficient/unreadable information                         | Reject documents with insufficient extracted text                                | Tested                                               |
| 4.4           | Express integration, no Flask/custom training               | Single TypeScript AI module called by Express                                    | Required architecture preserved                      |
| 4.4           | Handle layout differences and scanned PDFs                  | PDF parser; clear OCR guidance rather than fabricated text                       | Implemented                                          |
| 4.4           | Invalid/incomplete AI output is not successful              | 502 validation error, no saved report                                            | Tested                                               |
| 4.4           | Original reports reopen without another AI call             | Stored JSONB results                                                             | Tested                                               |
| 4.4           | Free/open-source-compatible AI option                       | Documented local Ollama setup                                                    | Configuration provided; model not run                |
| 5.1           | Next.js TypeScript App Router                               | frontend, strict type checks                                                     | Built                                                |
| 5.1           | Express Node.js TypeScript                                  | backend                                                                         | Built                                                |
| 5.1           | PostgreSQL or MongoDB                                       | PostgreSQL selected, schema and parameterized queries                            | Tested with embedded PostgreSQL                      |
| 5.1           | Node PDF extraction                                         | pdf-parse                                                                        | Tested                                               |
| 5.1 / 6       | Git and GitHub source                                       | Git versioning and CI workflow included                                          | GitHub push pending target repository                |
| 5.2           | Online frontend                                             | Private hosted static Next.js export                                             | Original demo available separately; Vercel package prepared                               |
| 5.2           | Online Express, production DB and live AI communicate       | Dockerfile, configuration and deployment instructions                            | Vercel configurations provided; account credentials and live publication pending             |
| 6             | README installation/configuration/deployment                | README.md and .env.example                                                       | Included                                             |
| 6             | Samples and fictional results                               | samples/ PDFs, JSON and job description                                          | Included                                             |
| 6             | Final presentation of workflows/decisions                   | Presentation deck and docs/DEMO_SCRIPT.md                                        | Included in handoff                                  |
| 6             | Sara end-to-end scenario including alternative CV           | Demonstration script and workflow tests                                          | Implemented; live AI demo needs credentials          |
| 7             | UX, architecture, AI reliability and explainability         | Responsive UI, clear errors, source quotes, test suite                           | Implemented with stated verification limits          |

## Known limits

- Production backend/database deployment and live-model verification are incomplete without external credentials. The online demo does not silently substitute browser storage for the required production database.
- No GitHub target was supplied, so a GitHub remote has not been populated.
- Reminders appear inside the application. There is no scheduled email, SMS, push notification or background scheduler.
- Scanned CVs require OCR before upload. CV sizes are limited to 4 MB.
- Evidence validation checks text quotations, not the truth of the CV or every semantic model inference. Users must review reports.
- Cross-site cookie restrictions vary by browser. Prefer a same-origin API proxy for production.

## Vercel package update

The current package uses `frontend/`, `backend/`, and `database/`. AI lives at `backend/src/ai/analysis.service.ts`, and API composition at `backend/src/application.ts`. The standard Next.js build now proxies `/api` to a separately deployed Express Vercel project. CV uploads are capped at 4 MB for Vercel payload limits. See the root DEPLOY_VERCEL.md for current instructions.
