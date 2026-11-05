import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const mem = new PGlite();
after(async () => {
  await mem.close();
});
import request from "supertest";
import { jsPDF } from "jspdf";
import { createApp } from "../src/application.js";
import { validateReport } from "../src/ai/analysis.service.js";
const text =
  "Sara Morgan. BSc Computer Science 2025. Built a job board with React and TypeScript. Developed REST APIs with Express.js. Collaborated with a designer.";
const jd =
  "Frontend developer requiring React, TypeScript and PostgreSQL experience. Build interfaces and collaborate with the team.";
const generated = {
  summary:
    "The CV directly supports React through a documented project. PostgreSQL is not clearly described.",
  requirements: [
    {
      requirement: "React",
      jobEvidence: "React",
      weight: 3,
      status: "demonstrated",
      evidence: "Built a job board with React and TypeScript.",
      explanation: "The named project demonstrates React.",
    },
    {
      requirement: "PostgreSQL",
      jobEvidence: "PostgreSQL",
      weight: 2,
      status: "not_clearly_described",
      evidence: "",
      explanation:
        "Not mentioned in the supplied CV; this does not prove lack of skill.",
    },
  ],
  relevantExperience: [
    {
      title: "Job board",
      evidence: "Built a job board with React and TypeScript.",
      relevance: "Relevant frontend development project.",
    },
  ],
  suggestions: [
    {
      section: "Projects",
      suggestion: "Clarify your personal contribution to the React job board.",
      rationale: "Makes existing relevant experience easier to assess.",
      evidence: "Built a job board with React and TypeScript.",
    },
  ],
};
function pdf(t = text) {
  const d = new jsPDF();
  d.text(d.splitTextToSize(t, 170), 20, 20);
  return Buffer.from(d.output("arraybuffer"));
}
async function setup() {
  await mem.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await mem.exec(
    readFileSync(new URL("../../database/migrations/001_initial.sql", import.meta.url), "utf8"),
  );
  const db: any = { query: (s: string, p?: any[]) => mem.query(s, p) };
  const ai = async (cv: string, description: string) => ({
    report: validateReport(generated, cv, description),
    model: "test-model",
  });
  const app = createApp(db, ai);
  const a = request.agent(app),
    b = request.agent(app);
  await a
    .post("/api/auth/register")
    .send({
      email: "sara@example.com",
      password: "correct-horse-2026",
      name: "Sara Morgan",
    })
    .expect(201);
  await b
    .post("/api/auth/register")
    .send({
      email: "alex@example.com",
      password: "correct-horse-2026",
      name: "Alex Morgan",
    })
    .expect(201);
  return { app, a, b, db };
}
const job = {
  title: "Frontend Developer",
  company: "Example Inc",
  description: jd,
  status: "Saved",
  link: "https://example.com/job",
  notes: "Prepare portfolio.",
};
test("registration, login, profile update and session revocation", async () => {
  const { app, a } = await setup();
  await request(app).get("/api/jobs").expect(401);
  const p = await a
    .patch("/api/profile")
    .send({ name: "Sara M.", monthlyGoal: 8 })
    .expect(200);
  assert.equal(p.body.monthlyGoal, 8);
  await a.post("/api/auth/logout").expect(204);
  await a.get("/api/profile").expect(401);
  await a
    .post("/api/auth/login")
    .send({ email: "sara@example.com", password: "wrong-password" })
    .expect(401);
  await a
    .post("/api/auth/login")
    .send({ email: "sara@example.com", password: "correct-horse-2026" })
    .expect(200);
  await a.get("/api/profile").expect(200);
});
test("duplicate emails and weak passwords are rejected", async () => {
  const { app } = await setup();
  await request(app)
    .post("/api/auth/register")
    .send({
      email: "SARA@example.com",
      password: "correct-horse-2026",
      name: "Sara Morgan",
    })
    .expect(409);
  await request(app)
    .post("/api/auth/register")
    .send({ email: "weak@example.com", password: "123", name: "Weak" })
    .expect(400);
});
test("jobs CRUD, search, status filter, real dashboard counts and owner isolation", async () => {
  const { a, b } = await setup();
  const created = await a.post("/api/jobs").send(job).expect(201);
  const id = created.body.id;
  await b.get("/api/jobs/" + id).expect(404);
  await b
    .patch("/api/jobs/" + id)
    .send({ status: "Offer" })
    .expect(404);
  await b.delete("/api/jobs/" + id).expect(404);
  assert.equal((await b.get("/api/jobs")).body.length, 0);
  assert.equal(
    (await a.get("/api/jobs?q=example&status=Saved")).body.length,
    1,
  );
  const date = new Date().toISOString().slice(0, 10);
  await a
    .patch("/api/jobs/" + id)
    .send({ status: "Interview", appliedDate: date, interviewDate: date })
    .expect(200);
  const dash = (await a.get("/api/dashboard").expect(200)).body;
  assert.equal(dash.total, 1);
  assert.equal(dash.counts.Interview, 1);
  assert.equal(dash.thisMonth, 1);
  assert.equal(dash.recentActivity.length, 2);
  await a.delete("/api/jobs/" + id).expect(204);
  assert.equal((await a.get("/api/dashboard")).body.total, 0);
});
test("invalid job URLs, statuses and short descriptions are rejected", async () => {
  const { a } = await setup();
  await a
    .post("/api/jobs")
    .send({ ...job, link: "javascript:alert(1)" })
    .expect(400);
  await a
    .post("/api/jobs")
    .send({ ...job, status: "Hired" })
    .expect(400);
  await a
    .post("/api/jobs")
    .send({ ...job, description: "short" })
    .expect(400);
});
test("notes history is private and survives job edits", async () => {
  const { a, b } = await setup();
  const id = (await a.post("/api/jobs").send(job)).body.id;
  await a
    .post(`/api/jobs/${id}/notes`)
    .send({ body: "Interview with engineering on Friday." })
    .expect(201);
  await a
    .patch("/api/jobs/" + id)
    .send({ title: "Frontend Engineer" })
    .expect(200);
  assert.equal(
    (await a.get(`/api/jobs/${id}/notes`)).body[0].body,
    "Interview with engineering on Friday.",
  );
  await b.get(`/api/jobs/${id}/notes`).expect(404);
  await b
    .post(`/api/jobs/${id}/notes`)
    .send({ body: "Access denied" })
    .expect(404);
});
test("valid PDF upload, retrieval and main CV replacement", async () => {
  const { a, b } = await setup();
  const first = (
    await a.post("/api/cv").attach("cv", pdf(), "main.pdf").expect(201)
  ).body;
  await a
    .get(`/api/cv/${first.id}/file`)
    .expect(200)
    .expect("Content-Type", /pdf/);
  await b.get(`/api/cv/${first.id}/file`).expect(404);
  const second = (
    await a
      .post("/api/cv")
      .attach("cv", pdf(text + " More project detail."), "updated.pdf")
      .expect(201)
  ).body;
  assert.notEqual(second.id, first.id);
  assert.equal((await a.get("/api/cv")).body.name, "updated.pdf");
  assert.equal((await b.get("/api/cv")).body, null);
});
test("fake PDF and unreadable PDF return clear errors", async () => {
  const { a } = await setup();
  await a
    .post("/api/cv")
    .attach("cv", Buffer.from("not a PDF"), {
      filename: "fake.pdf",
      contentType: "application/pdf",
    })
    .expect(400);
  const unreadable = await a
    .post("/api/cv")
    .attach("cv", pdf(" "), "blank.pdf")
    .expect(422);
  assert.match(unreadable.body.error, /readable text/);
  await a
    .post("/api/cv")
    .attach("cv", Buffer.alloc(6 * 1024 * 1024), {
      filename: "large.pdf",
      contentType: "application/pdf",
    })
    .expect(400);
});
test("independent AI analysis, immutable CV references, alternative CV and private history", async () => {
  const { a, b } = await setup();
  const main = (await a.post("/api/cv").attach("cv", pdf(), "main.pdf")).body;
  const result = (
    await a
      .post("/api/analyses")
      .field("title", "React role")
      .field("jobDescription", jd)
      .expect(201)
  ).body;
  assert.equal(result.cvId, main.id);
  assert.equal(result.report.score, 60);
  assert.equal(result.report.category, "Good Match");
  assert.equal((await a.get("/api/jobs")).body.length, 0);
  await a
    .post("/api/cv")
    .attach("cv", pdf(text + " Updated version."), "updated.pdf")
    .expect(201);
  const alt = (
    await a
      .post("/api/analyses")
      .field("title", "Alternative")
      .field("source", "alternative")
      .field("jobDescription", jd)
      .attach("cv", pdf(), "alternative.pdf")
      .expect(201)
  ).body;
  assert.notEqual(alt.cvId, main.id);
  assert.equal((await a.get("/api/cv")).body.name, "updated.pdf");
  const history = (await a.get("/api/analyses")).body;
  assert.equal(history.length, 2);
  assert.equal(history.find((r: any) => r.id === result.id).cvName, "main.pdf");
  assert.deepEqual(
    history.find((r: any) => r.id === result.id).report,
    result.report,
  );
  assert.equal((await b.get("/api/analyses")).body.length, 0);
  await b.get(`/api/analyses/${result.id}/pdf`).expect(404);
  await b.delete(`/api/analyses/${result.id}`).expect(404);
  await a
    .get(`/api/analyses/${result.id}/pdf`)
    .expect(200)
    .expect("Content-Type", /pdf/);
  await a.delete("/api/analyses/" + result.id).expect(204);
  assert.equal((await a.get("/api/analyses")).body.length, 1);
});
test("AI analysis cannot run without a CV and does not mutate application status", async () => {
  const { a } = await setup();
  await a.post("/api/analyses").field("jobDescription", jd).expect(400);
  const id = (await a.post("/api/jobs").send(job)).body.id;
  await a.post("/api/cv").attach("cv", pdf(), "main.pdf");
  await a.post("/api/analyses").field("jobDescription", jd).expect(201);
  assert.equal((await a.get("/api/jobs/" + id)).body.status, "Saved");
});
test("AI validation rejects malformed and hallucinated evidence; score is derived", () => {
  assert.throws(() => validateReport({ summary: "incomplete" }, text, jd));
  assert.throws(() =>
    validateReport(
      {
        ...generated,
        requirements: [
          {
            ...generated.requirements[0],
            evidence: "Built PostgreSQL data warehouses for ten years.",
          },
        ],
      },
      text,
      jd,
    ),
  );
  assert.throws(() =>
    validateReport(
      {
        ...generated,
        suggestions: [
          { ...generated.suggestions[0], evidence: "Invented project" },
        ],
      },
      text,
      jd,
    ),
  );
  assert.throws(() =>
    validateReport(
      {
        ...generated,
        requirements: [
          {
            ...generated.requirements[0],
            jobEvidence: "an invented job requirement",
          },
        ],
      },
      text,
      jd,
    ),
  );
  const report = validateReport(generated, text, jd);
  assert.equal(report.score, 60);
  assert.match(report.disclaimer, /Unconfirmed does not mean unqualified/);
});
test("unconfigured AI service fails without saving a report", async () => {
  const { a, db } = await setup();
  await a.post("/api/cv").attach("cv", pdf(), "main.pdf");
  const app = createApp(db, async () => {
    throw Object.assign(new Error("AI is not configured."), { status: 503 });
  });
  const agent = request.agent(app);
  await agent
    .post("/api/auth/login")
    .send({ email: "sara@example.com", password: "correct-horse-2026" });
  await agent.post("/api/analyses").field("jobDescription", jd).expect(503);
  assert.equal((await agent.get("/api/analyses")).body.length, 0);
});
test("cross-origin state changes are denied", async () => {
  const { a } = await setup();
  await a
    .post("/api/jobs")
    .set("Origin", "https://untrusted.example")
    .send(job)
    .expect(403);
});
