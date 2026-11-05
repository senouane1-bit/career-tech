// Explicitly run against a development database only. Creates a fictional account.
import fs from "node:fs/promises";
const base = process.env.SEED_API_URL || "http://localhost:4000";
if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 10)
  throw new Error("Set SEED_PASSWORD (at least 10 characters).");
const email = process.env.SEED_EMAIL || "sara@example.com";
const response = await fetch(base + "/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Sara Morgan",
    email,
    password: process.env.SEED_PASSWORD,
  }),
});
if (!response.ok)
  throw new Error("Could not create demo account. Use a fresh demo email.");
const cookie = response.headers
  .getSetCookie()
  .map((x) => x.split(";")[0])
  .join("; ");
const jobs = JSON.parse(
  await fs.readFile(
    new URL("../samples/opportunities.json", import.meta.url),
    "utf8",
  ),
);
for (const job of jobs) {
  const r = await fetch(base + "/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(job),
  });
  if (!r.ok) throw new Error("Could not save sample job.");
}
const form = new FormData();
form.append(
  "cv",
  new Blob(
    [
      await fs.readFile(
        new URL("../samples/Sara_Morgan_CV.pdf", import.meta.url),
      ),
    ],
    { type: "application/pdf" },
  ),
  "Sara_Morgan_CV.pdf",
);
const cv = await fetch(base + "/api/cv", {
  method: "POST",
  headers: { Cookie: cookie },
  body: form,
});
if (!cv.ok) throw new Error("Could not upload sample CV.");
console.log(
  "Fictional account, sample opportunities and main CV created. Log in with your SEED_EMAIL and SEED_PASSWORD.",
);
