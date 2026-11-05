# HTTP API

All routes begin with `/api`. Authentication uses a cookie named `ct_session`. Browser clients must use `credentials: include`. JSON requests use `Content-Type: application/json`; file requests use `multipart/form-data` and the field `cv`.

| Method | Route             | Function                                                              |
| ------ | ----------------- | --------------------------------------------------------------------- |
| GET    | /health           | Database health and whether AI credentials are configured             |
| POST   | /auth/register    | Register `{name,email,password}` and create session                   |
| POST   | /auth/login       | Login `{email,password}`                                              |
| POST   | /auth/logout      | Revoke current session                                                |
| GET    | /profile          | Read own basic profile                                                |
| PATCH  | /profile          | Update `{name,monthlyGoal}`                                           |
| GET    | /cv               | Main CV metadata or null                                              |
| POST   | /cv               | Upload/replace main PDF, field `cv`                                   |
| GET    | /cv/:id/file      | Authorized original PDF, including report-referenced versions         |
| GET    | /jobs             | List own jobs. Query: q, status, addedFrom, appliedFrom               |
| POST   | /jobs             | Create opportunity                                                    |
| GET    | /jobs/:id         | Read own opportunity                                                  |
| PATCH  | /jobs/:id         | Update selected fields                                                |
| DELETE | /jobs/:id         | Delete own opportunity and notes                                      |
| GET    | /jobs/:id/notes   | Read own notes history                                                |
| POST   | /jobs/:id/notes   | Append `{body}`                                                       |
| GET    | /dashboard        | Counts, recent jobs, activity, monthly comparison and upcoming dates  |
| POST   | /analyses         | Multipart: jobDescription, optional title/source/cv; run validated AI |
| GET    | /analyses         | Own original saved reports with CV version and description            |
| GET    | /analyses/:id/pdf | Authorized PDF export                                                 |
| DELETE | /analyses/:id     | Remove own report                                                     |

An opportunity contains `title`, `company`, `description`, `link`, `status`, `appliedDate`, `followUpDate`, `interviewDate`, and `notes`. Dates use YYYY-MM-DD or an empty string. Only title, company and description are mandatory. Status defaults to Saved and accepts only Saved, Applied, Interview, Offer, Rejected.

Typical statuses: 201 created, 204 deleted, 400 invalid input, 401 missing/expired session, 403 unexpected origin, 404 missing or not owned, 409 email conflict, 422 unreadable PDF, 429 rate limit, 502 invalid/provider AI response, 503 AI not configured. Errors use `{ "error": "human-readable message" }`.

AI requests have a 60-second provider timeout and a limit of 15 analyses per authenticated user per hour. General API traffic is limited to 180 requests per minute. Auth endpoints allow 25 attempts per 15 minutes per IP. Sessions expire in seven days and logout revokes the current one. Expired session rows can be pruned using a scheduled database maintenance task.

PDFs are limited to 4 MB and extracted CV text to 60,000 characters. The system requires at least 60 non-whitespace characters. A MIME header alone is not accepted as proof of a valid PDF. Uploaded documents are parsed on the server; image-only scans require external OCR.
