# Deploy CareerTech on Vercel

This repository deploys as **two Vercel projects plus one external PostgreSQL database**. Both application projects come from the same GitHub repository. No files need to be copied manually between them.

## 1. Upload the repository to GitHub

Extract the archive, open its `CareerTech` folder, and upload its contents to a new GitHub repository. The repository root must contain `frontend/`, `backend/`, `database/` and the root `package.json`.

Do not upload `node_modules`, `.next`, `dist`, or any real `.env` files. Example environment files are safe to commit. The CI workflow runs builds, type checks and tests.

## 2. Create PostgreSQL and apply the schema

Create a PostgreSQL database, for example on Neon. Get its **pooled connection string** for application traffic, including the provider's required TLS parameters. Use a direct connection string to run migrations if your provider recommends that for DDL.

From the project root:

```sh
npm ci
cp backend/.env.example backend/.env
```

Put the connection string into `DATABASE_URL` in `backend/.env`, then run:

```sh
npm run db:migrate
```

The runner applies numbered SQL files transactionally and records completed files in `schema_migrations`. It does not run inside an API request or at every function startup. Never edit an already applied SQL migration; add a new numbered file instead.

## 3. Choose the frontend production address

Choose an available frontend project name in Vercel, or use your own domain. You will enter its exact HTTPS origin as the backend's `FRONTEND_URL`. If Vercel assigns a different address, update that variable before testing login. No trailing path or slash is needed.

## 4. Deploy the Express backend first

Import the GitHub repository into Vercel with these settings:

| Vercel setting               | Value                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Project name                 | An available name, e.g. `careertech-api-yourname`                                                                             |
| Root Directory               | **`backend`**                                                                                                                 |
| Framework Preset             | **Express**                                                                                                                   |
| Node.js version              | **24.x**                                                                                                                      |
| Install Command              | Supplied in `backend/vercel.json`: `cd .. && npm ci`                                                                          |
| Build Command                | Leave the Express framework default; do not use a frontend build                                                              |
| Output Directory             | Leave framework default; do not enter `dist` or `public`                                                                      |
| Files outside Root Directory | Enable access to source files outside the root when Vercel shows this option, so the root npm workspace lockfile is available |

Set the backend variables for Production:

| Name                | Value                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`      | Your pooled PostgreSQL connection string with required TLS parameters     |
| `FRONTEND_URL`      | Exact frontend production origin, e.g. `https://your-frontend.vercel.app` |
| `AI_API_KEY`        | Secret model-provider credential                                          |
| `AI_BASE_URL`       | OpenAI-compatible `/v1` base URL, e.g. `https://api.openai.com/v1`        |
| `AI_MODEL`          | A model supporting Chat Completions and JSON object output                |
| `COOKIE_CROSS_SITE` | `false`                                                                   |

Vercel sets `NODE_ENV=production`. Never set AI credentials as `NEXT_PUBLIC_*` values. The `src/index.ts` entry exports Express without calling `listen`. The separate `src/local.ts` listener is for local/Docker usage.

Deploy, then open `https://YOUR_BACKEND_DOMAIN/api/health`. Expected response when the database is reachable:

```json
{ "status": "ok", "aiConfigured": true }
```

`aiConfigured:true` only confirms that a key is set. It does not prove the key is valid, funded, or allowed to use the selected model.

If Vercel Deployment Protection blocks the backend, the frontend's server-side proxy cannot reach it without a configured protection bypass. Ensure your backend API has the intended reachable production access, or configure an appropriate Vercel protection bypass. Application routes still require CareerTech login and ownership checks.

## 5. Deploy the Next.js frontend

Import the **same repository again** as a second Vercel project:

| Vercel setting               | Value                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| Project name                 | Your chosen frontend name                                      |
| Root Directory               | **`frontend`**                                                 |
| Framework Preset             | **Next.js**                                                    |
| Node.js version              | **24.x**                                                       |
| Install Command              | Supplied in `frontend/vercel.json`: `cd .. && npm ci`          |
| Build Command                | Supplied in configuration: `npm run build`                     |
| Output Directory             | Next.js default; do not set `out`                              |
| Files outside Root Directory | Enable when shown, for the workspace root package and lockfile |

Set these frontend variables:

| Name                    | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `BACKEND_URL`           | The actual backend origin, e.g. `https://YOUR_BACKEND_DOMAIN` |
| `NEXT_PUBLIC_DEMO_MODE` | `false`                                                       |

**Leave `NEXT_PUBLIC_API_URL` unset.** Browser requests use the frontend's own `/api` URL, which Next.js forwards to the backend. This avoids depending on third-party cookies. Leave rewrite caching disabled for private API requests.

Deploy. The application should open on its real login/registration screen, without the fictional demo banner. Confirm the resulting frontend origin equals backend `FRONTEND_URL`. If you change backend environment variables, redeploy the backend. If you change frontend `BACKEND_URL`, rebuild/redeploy the frontend because Next.js builds the rewrite configuration.

## 6. Check the complete workflow

1. Open the frontend and register a new account.
2. Upload `samples/Sara_Morgan_CV.pdf` and open the PDF.
3. Create an opportunity and change its status. Reload and verify persistence.
4. Paste `samples/frontend-job-description.txt` into CV Analysis and run the model.
5. Open the saved report, original description and CV version. Download its PDF.
6. Replace the main CV, then confirm the old report remains unchanged.
7. Analyze `samples/Sara_Morgan_Backend_CV.pdf` as an alternative. Confirm it does not replace the main CV.
8. Log out, log back in, and verify your records remain. A second account must not see the first account's records.

A successful build does not replace these live provider checks. This package has not been published into your Vercel account.

## Preview deployments

The backend currently permits one exact `FRONTEND_URL`. Use a separate preview backend/database and configure its exact preview frontend origin. Do not weaken origin validation to allow arbitrary origins. The application should not expose production data in an untrusted preview environment.

## Troubleshooting

| Symptom                                | Check                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend login request returns 404/502 | `BACKEND_URL`, backend `/api/health`, and backend Deployment Protection                             |
| “Request origin is not allowed”        | Backend `FRONTEND_URL` must exactly match the browser's frontend origin                             |
| Login succeeds but session disappears  | Leave direct API URL unset; use the same-origin proxy; keep `COOKIE_CROSS_SITE=false`; verify HTTPS |
| Database connection failure            | Correct URL, provider TLS parameters, credentials, pooled endpoint and applied migrations           |
| AI 503                                 | Missing `AI_API_KEY`                                                                                |
| AI 502                                 | Provider key/model access, provider quota, JSON compatibility or response validation                |
| Upload rejected                        | Text-based, unlocked PDF no larger than 4 MB                                                        |
| Upload/download receives Vercel 413    | Vercel function payload limit; use the 4 MB application cap and avoid older oversized files         |
| Function invocation error              | Node.js 24, installed dependencies, server environment and runtime logs                             |

## References checked for this package

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Next.js external rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- [Vercel function request size limit](https://vercel.com/docs/errors/function_payload_too_large)

The supplied function duration is 120 seconds. Confirm plan support and regional settings in your Vercel dashboard. Existing request rate limits use per-instance memory; configure shared limiting or Vercel Firewall for a publicly scaled deployment.
