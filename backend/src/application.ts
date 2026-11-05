import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcryptjs";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { PDFParse } from "pdf-parse";
import { jsPDF } from "jspdf";
import { db as defaultDB, type DB } from "./database/client.js";
import { analyze as defaultAnalyze } from "./ai/analysis.service.js";
const status = z.enum(["Saved", "Applied", "Interview", "Offer", "Rejected"]);
const date = z.union([z.literal(""), z.iso.date()]).default("");
const jobSchema = z.object({
  title: z.string().trim().min(2).max(200),
  company: z.string().trim().min(2).max(200),
  description: z.string().trim().min(20).max(30000),
  link: z
    .union([
      z.literal(""),
      z.url().refine((v) => /^https?:\/\//.test(v), "Use http or https"),
    ])
    .default(""),
  status: status.default("Saved"),
  appliedDate: date,
  followUpDate: date,
  interviewDate: date,
  notes: z.string().max(10000).default(""),
});
const authSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z
    .string()
    .min(10)
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must use at most 72 UTF-8 bytes",
    ),
  name: z.string().trim().min(2).max(100).optional(),
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname),
    ),
});
const hash = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
const safeUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  monthlyGoal: u.monthly_goal,
});
const jobOut = (j: any) => ({
  id: j.id,
  ...j.data,
  createdAt: j.created_at,
  updatedAt: j.updated_at,
});
const cvOut = (c: any) => ({
  id: c.id,
  name: c.name,
  size: c.size,
  sha256: c.sha256,
  createdAt: c.created_at,
});
export function createApp(
  database: DB = defaultDB,
  ai: typeof defaultAnalyze = defaultAnalyze,
) {
  const app = express();
  const production = process.env.NODE_ENV === "production";
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const origin = process.env.FRONTEND_URL || "http://localhost:3000";
  app.use(helmet());
  app.use(cors({ origin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") &&
      req.get("origin") !== origin
    )
      return res.status(403).json({ error: "Request origin is not allowed." });
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 25,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const asyncRoute = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  const session = asyncRoute(async (req: any, res: any, next: any) => {
    const token = req.cookies.ct_session;
    if (!token) return res.status(401).json({ error: "Please log in." });
    const { rows } = await database.query(
      "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
      [hash(token)],
    );
    if (!rows[0])
      return res
        .status(401)
        .json({ error: "Your session expired. Please log in." });
    req.user = rows[0];
    next();
  });
  const setSession = async (res: any, id: string) => {
    const token = randomBytes(32).toString("hex");
    await database.query(
      "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
      [hash(token), id, new Date(Date.now() + 7 * 86400000)],
    );
    res.cookie("ct_session", token, {
      httpOnly: true,
      secure: production,
      sameSite:
        production && process.env.COOKIE_CROSS_SITE === "true" ? "none" : "lax",
      maxAge: 7 * 86400000,
      path: "/api",
    });
  };
  const activity = async (uid: string, jid: string | null, message: string) =>
    database.query(
      "INSERT INTO activities (id,user_id,job_id,message) VALUES ($1,$2,$3,$4)",
      [randomUUID(), uid, jid, message],
    );
  const ownJob = async (id: string, uid: string) => {
    if (!z.uuid().safeParse(id).success)
      throw Object.assign(new Error("Opportunity not found."), { status: 404 });
    const { rows } = await database.query(
      "SELECT * FROM jobs WHERE id=$1 AND user_id=$2",
      [id, uid],
    );
    if (!rows[0])
      throw Object.assign(new Error("Opportunity not found."), { status: 404 });
    return rows[0];
  };
  const readCV = async (file: Express.Multer.File | undefined) => {
    if (!file)
      throw Object.assign(new Error("Select a PDF file (maximum 4 MB)."), {
        status: 400,
      });
    if (file.buffer.subarray(0, 5).toString() !== "%PDF-")
      throw Object.assign(new Error("The file is not a valid PDF."), {
        status: 400,
      });
    let text = "";
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
    try {
      text = (await parser.getText()).text.trim();
    } catch {
      throw Object.assign(
        new Error(
          "This PDF cannot be read. Upload an unlocked text-based PDF.",
        ),
        { status: 422 },
      );
    } finally {
      await parser.destroy();
    }
    if (text.replace(/\s/g, "").length < 60)
      throw Object.assign(
        new Error(
          "This PDF has insufficient readable text. Scanned documents need OCR before upload.",
        ),
        { status: 422 },
      );
    if (text.length > 60000)
      throw Object.assign(
        new Error("This CV is too long to analyze. Upload a shorter document."),
        { status: 422 },
      );
    return text;
  };
  const storeCV = async (
    uid: string,
    file: Express.Multer.File,
    text: string,
    main: boolean,
  ) => {
    const id = randomUUID();
    await database.query(
      "INSERT INTO cvs (id,user_id,name,sha256,size,content,extracted_text,is_main) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        id,
        uid,
        file.originalname.replace(/[\r\n"/\\]/g, "_").slice(0, 200),
        hash(file.buffer),
        file.size,
        file.buffer,
        text,
        main,
      ],
    );
    return (
      await database.query("SELECT * FROM cvs WHERE id=$1 AND user_id=$2", [
        id,
        uid,
      ])
    ).rows[0];
  };
  app.get(
    "/api/health",
    asyncRoute(async (_req: any, res: any) => {
      await database.query("SELECT 1");
      res.json({ status: "ok", aiConfigured: !!process.env.AI_API_KEY });
    }),
  );
  app.post(
    "/api/auth/register",
    authLimit,
    asyncRoute(async (req: any, res: any) => {
      const data = authSchema
        .extend({ name: z.string().trim().min(2).max(100) })
        .parse(req.body);
      const id = randomUUID();
      try {
        await database.query(
          "INSERT INTO users (id,email,name,password_hash) VALUES ($1,$2,$3,$4)",
          [id, data.email, data.name, await bcrypt.hash(data.password, 12)],
        );
      } catch (e: any) {
        if (e.code === "23505")
          return res
            .status(409)
            .json({ error: "An account with this email already exists." });
        throw e;
      }
      await setSession(res, id);
      res
        .status(201)
        .json(
          safeUser(
            (await database.query("SELECT * FROM users WHERE id=$1", [id]))
              .rows[0],
          ),
        );
    }),
  );
  app.post(
    "/api/auth/login",
    authLimit,
    asyncRoute(async (req: any, res: any) => {
      const { email, password } = authSchema.parse(req.body);
      const u = (
        await database.query("SELECT * FROM users WHERE email=$1", [email])
      ).rows[0];
      if (!u || !(await bcrypt.compare(password, u.password_hash)))
        return res
          .status(401)
          .json({ error: "Email or password is incorrect." });
      await setSession(res, u.id);
      res.json(safeUser(u));
    }),
  );
  app.post(
    "/api/auth/logout",
    asyncRoute(async (req: any, res: any) => {
      if (req.cookies.ct_session)
        await database.query("DELETE FROM sessions WHERE token_hash=$1", [
          hash(req.cookies.ct_session),
        ]);
      res.clearCookie("ct_session", {
        path: "/api",
        httpOnly: true,
        secure: production,
        sameSite:
          production && process.env.COOKIE_CROSS_SITE === "true"
            ? "none"
            : "lax",
      });
      res.status(204).end();
    }),
  );
  app.use("/api", session);
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  app.get("/api/profile", (req: any, res) => res.json(safeUser(req.user)));
  app.patch(
    "/api/profile",
    asyncRoute(async (req: any, res: any) => {
      const d = z
        .object({
          name: z.string().trim().min(2).max(100),
          monthlyGoal: z.number().int().min(1).max(1000),
        })
        .parse(req.body);
      const { rows } = await database.query(
        "UPDATE users SET name=$1,monthly_goal=$2 WHERE id=$3 RETURNING *",
        [d.name, d.monthlyGoal, req.user.id],
      );
      res.json(safeUser(rows[0]));
    }),
  );
  app.get(
    "/api/cv",
    asyncRoute(async (req: any, res: any) => {
      const { rows } = await database.query(
        "SELECT * FROM cvs WHERE user_id=$1 AND is_main=true",
        [req.user.id],
      );
      res.json(rows[0] ? cvOut(rows[0]) : null);
    }),
  );
  // Serialize main-CV replacement per user with an atomic SQL transaction on one connection.
  app.post(
    "/api/cv",
    upload.single("cv"),
    asyncRoute(async (req: any, res: any) => {
      const text = await readCV(req.file);
      const pool = database as any;
      const client =
        typeof pool.connect === "function" ? await pool.connect() : null;
      const q = client || database;
      try {
        await q.query("BEGIN");
        await q.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
          req.user.id,
        ]);
        await q.query(
          "UPDATE cvs SET is_main=false WHERE user_id=$1 AND is_main=true",
          [req.user.id],
        );
        const id = randomUUID();
        await q.query(
          "INSERT INTO cvs (id,user_id,name,sha256,size,content,extracted_text,is_main) VALUES ($1,$2,$3,$4,$5,$6,$7,true)",
          [
            id,
            req.user.id,
            req.file.originalname.replace(/[\r\n"/\\]/g, "_").slice(0, 200),
            hash(req.file.buffer),
            req.file.size,
            req.file.buffer,
            text,
          ],
        );
        await q.query("COMMIT");
        const c = (
          await database.query("SELECT * FROM cvs WHERE id=$1 AND user_id=$2", [
            id,
            req.user.id,
          ])
        ).rows[0];
        res.status(201).json(cvOut(c));
      } catch (e) {
        await q.query("ROLLBACK");
        throw e;
      } finally {
        client?.release();
      }
    }),
  );
  app.get(
    "/api/cv/:id/file",
    asyncRoute(async (req: any, res: any) => {
      if (!z.uuid().safeParse(req.params.id).success)
        return res.status(404).end();
      const c = (
        await database.query("SELECT * FROM cvs WHERE id=$1 AND user_id=$2", [
          req.params.id,
          req.user.id,
        ])
      ).rows[0];
      if (!c) return res.status(404).json({ error: "CV not found." });
      res
        .set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${c.name}"`,
          "Cache-Control": "private, no-store",
        })
        .send(Buffer.from(c.content));
    }),
  );
  app.get(
    "/api/jobs",
    asyncRoute(async (req: any, res: any) => {
      let jobs = (
        await database.query(
          "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC",
          [req.user.id],
        )
      ).rows.map(jobOut);
      const query = String(req.query.q || "").toLowerCase();
      if (query)
        jobs = jobs.filter((j: any) =>
          (j.title + " " + j.company).toLowerCase().includes(query),
        );
      if (req.query.status)
        jobs = jobs.filter((j: any) => j.status === req.query.status);
      for (const [key, field] of [
        ["addedFrom", "createdAt"],
        ["appliedFrom", "appliedDate"],
      ] as const)
        if (req.query[key])
          jobs = jobs.filter(
            (j: any) => j[field]?.slice(0, 10) >= String(req.query[key]),
          );
      res.json(jobs);
    }),
  );
  app.post(
    "/api/jobs",
    asyncRoute(async (req: any, res: any) => {
      const data = jobSchema.parse(req.body);
      const id = randomUUID();
      await database.query(
        "INSERT INTO jobs (id,user_id,data) VALUES ($1,$2,$3)",
        [id, req.user.id, JSON.stringify(data)],
      );
      await activity(req.user.id, id, `Saved ${data.title} at ${data.company}`);
      res.status(201).json(jobOut(await ownJob(id, req.user.id)));
    }),
  );
  app.get(
    "/api/jobs/:id",
    asyncRoute(async (req: any, res: any) =>
      res.json(jobOut(await ownJob(req.params.id, req.user.id))),
    ),
  );
  app.patch(
    "/api/jobs/:id",
    asyncRoute(async (req: any, res: any) => {
      const old = await ownJob(req.params.id, req.user.id);
      const data = jobSchema.parse({ ...old.data, ...req.body });
      await database.query(
        "UPDATE jobs SET data=$1,updated_at=now() WHERE id=$2 AND user_id=$3",
        [JSON.stringify(data), req.params.id, req.user.id],
      );
      await activity(
        req.user.id,
        req.params.id,
        old.data.status === data.status
          ? `Updated ${data.title} at ${data.company}`
          : `Moved ${data.title} at ${data.company} to ${data.status}`,
      );
      res.json(jobOut(await ownJob(req.params.id, req.user.id)));
    }),
  );
  app.delete(
    "/api/jobs/:id",
    asyncRoute(async (req: any, res: any) => {
      const old = await ownJob(req.params.id, req.user.id);
      await database.query("DELETE FROM jobs WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.user.id,
      ]);
      await activity(
        req.user.id,
        null,
        `Removed ${old.data.title} at ${old.data.company}`,
      );
      res.status(204).end();
    }),
  );
  app.get(
    "/api/jobs/:id/notes",
    asyncRoute(async (req: any, res: any) => {
      await ownJob(req.params.id, req.user.id);
      res.json(
        (
          await database.query(
            'SELECT id,body,created_at AS "createdAt" FROM notes WHERE job_id=$1 AND user_id=$2 ORDER BY created_at DESC',
            [req.params.id, req.user.id],
          )
        ).rows,
      );
    }),
  );
  app.post(
    "/api/jobs/:id/notes",
    asyncRoute(async (req: any, res: any) => {
      await ownJob(req.params.id, req.user.id);
      const { body } = z
        .object({ body: z.string().trim().min(1).max(5000) })
        .parse(req.body);
      const id = randomUUID();
      await database.query(
        "INSERT INTO notes (id,user_id,job_id,body) VALUES ($1,$2,$3,$4)",
        [id, req.user.id, req.params.id, body],
      );
      await activity(req.user.id, req.params.id, "Added an opportunity note");
      res.status(201).json({ id, body, createdAt: new Date().toISOString() });
    }),
  );
  app.get(
    "/api/dashboard",
    asyncRoute(async (req: any, res: any) => {
      const jobs = (
        await database.query(
          "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC",
          [req.user.id],
        )
      ).rows.map(jobOut);
      const now = new Date();
      const month = now.toISOString().slice(0, 7);
      const prev = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      )
        .toISOString()
        .slice(0, 7);
      const counts = Object.fromEntries(
        status.options.map((s) => [
          s,
          jobs.filter((j: any) => j.status === s).length,
        ]),
      );
      const recentActivity = (
        await database.query(
          'SELECT id,message,created_at AS "createdAt" FROM activities WHERE user_id=$1 ORDER BY created_at DESC LIMIT 15',
          [req.user.id],
        )
      ).rows;
      res.json({
        total: jobs.length,
        counts,
        thisMonth: jobs.filter((j: any) => j.appliedDate?.startsWith(month))
          .length,
        lastMonth: jobs.filter((j: any) => j.appliedDate?.startsWith(prev))
          .length,
        recent: jobs.slice(0, 5),
        recentActivity,
        monthlyGoal: req.user.monthly_goal,
        upcoming: jobs
          .flatMap((j: any) =>
            [
              ["Follow up", j.followUpDate],
              ["Interview", j.interviewDate],
            ]
              .filter(([, d]) => d && d >= now.toISOString().slice(0, 10))
              .map(([type, date]) => ({
                jobId: j.id,
                title: j.title,
                company: j.company,
                type,
                date,
              })),
          )
          .sort((a: any, b: any) => a.date.localeCompare(b.date)),
      });
    }),
  );
  const analysisLimit = rateLimit({
    windowMs: 3600000,
    limit: 15,
    keyGenerator: (req: any) => req.user.id,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.get(
    "/api/analyses",
    asyncRoute(async (req: any, res: any) => {
      const { rows } = await database.query(
        "SELECT a.*,c.name AS cv_name,c.sha256 AS cv_sha256 FROM analyses a JOIN cvs c ON c.id=a.cv_id WHERE a.user_id=$1 ORDER BY a.created_at DESC",
        [req.user.id],
      );
      res.json(
        rows.map((a) => ({
          id: a.id,
          title: a.title,
          jobDescription: a.job_description,
          cvId: a.cv_id,
          cvName: a.cv_name,
          cvHash: a.cv_sha256,
          report: a.report,
          model: a.model,
          createdAt: a.created_at,
        })),
      );
    }),
  );
  app.post(
    "/api/analyses",
    analysisLimit,
    upload.single("cv"),
    asyncRoute(async (req: any, res: any) => {
      const { jobDescription, title } = z
        .object({
          jobDescription: z.string().trim().min(40).max(30000),
          title: z.string().trim().min(2).max(200).default("CV analysis"),
        })
        .parse(req.body);
      let cv: any;
      let text: string;
      if (req.file) {
        text = await readCV(req.file);
        cv = null;
      } else {
        if (req.body.source === "alternative")
          throw Object.assign(new Error("Select the alternative PDF first."), {
            status: 400,
          });
        cv = (
          await database.query(
            "SELECT * FROM cvs WHERE user_id=$1 AND is_main=true",
            [req.user.id],
          )
        ).rows[0];
        if (!cv)
          throw Object.assign(
            new Error("Upload your main CV or choose an alternative PDF."),
            { status: 400 },
          );
        text = cv.extracted_text;
      }
      const result = await ai(text, jobDescription);
      if (!cv) cv = await storeCV(req.user.id, req.file, text, false);
      const id = randomUUID();
      await database.query(
        "INSERT INTO analyses (id,user_id,cv_id,job_description,title,report,model) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [
          id,
          req.user.id,
          cv.id,
          jobDescription,
          title,
          JSON.stringify(result.report),
          result.model,
        ],
      );
      res
        .status(201)
        .json({
          id,
          title,
          jobDescription,
          cvId: cv.id,
          cvName: cv.name,
          cvHash: cv.sha256,
          report: result.report,
          model: result.model,
          createdAt: new Date().toISOString(),
        });
    }),
  );
  app.delete(
    "/api/analyses/:id",
    asyncRoute(async (req: any, res: any) => {
      if (!z.uuid().safeParse(req.params.id).success)
        return res.status(404).end();
      const r = await database.query(
        "DELETE FROM analyses WHERE id=$1 AND user_id=$2 RETURNING cv_id",
        [req.params.id, req.user.id],
      );
      if (!r.rows.length)
        return res.status(404).json({ error: "Analysis not found." });
      await database.query(
        "DELETE FROM cvs WHERE id=$1 AND user_id=$2 AND is_main=false AND NOT EXISTS (SELECT 1 FROM analyses WHERE cv_id=$1)",
        [r.rows[0].cv_id, req.user.id],
      );
      res.status(204).end();
    }),
  );
  app.get(
    "/api/analyses/:id/pdf",
    asyncRoute(async (req: any, res: any) => {
      if (!z.uuid().safeParse(req.params.id).success)
        return res.status(404).end();
      const a = (
        await database.query(
          "SELECT a.*,c.name AS cv_name FROM analyses a JOIN cvs c ON c.id=a.cv_id WHERE a.id=$1 AND a.user_id=$2",
          [req.params.id, req.user.id],
        )
      ).rows[0];
      if (!a) return res.status(404).json({ error: "Analysis not found." });
      const doc = new jsPDF();
      let y = 20;
      const line = (s: string) => {
        for (const t of doc.splitTextToSize(s, 170)) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(t, 20, y);
          y += 6;
        }
        y += 4;
      };
      doc.setFontSize(11);
      line("CareerTech | CV analysis");
      line(a.title);
      line(`CV: ${a.cv_name} | ${new Date(a.created_at).toLocaleDateString()}`);
      line(`${a.report.category} (${a.report.score}/100)`);
      line(a.report.summary);
      line(a.report.scoreExplanation);
      for (const x of a.report.requirements)
        line(
          `${x.status}: ${x.requirement}\nEvidence: ${x.evidence || "Not confirmed"}\n${x.explanation}`,
        );
      for (const x of a.report.relevantExperience)
        line(`${x.title}\n${x.evidence}\n${x.relevance}`);
      for (const x of a.report.suggestions)
        line(
          `${x.section}: ${x.suggestion}\n${x.rationale}\nEvidence: ${x.evidence}`,
        );
      line(a.report.disclaimer);
      line("Original job description");
      line(a.job_description);
      res
        .set({
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="careertech-analysis.pdf"',
          "Cache-Control": "private, no-store",
        })
        .send(Buffer.from(doc.output("arraybuffer")));
    }),
  );
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({
          error: err.issues
            .map((x: any) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        });
    if (err instanceof multer.MulterError)
      return res
        .status(400)
        .json({
          error:
            err.code === "LIMIT_FILE_SIZE"
              ? "PDF must be smaller than 4 MB."
              : "Only one PDF is allowed.",
        });
    if (err.type === "entity.too.large")
      return res.status(413).json({ error: "Request is too large." });
    if (err instanceof SyntaxError)
      return res.status(400).json({ error: "Invalid JSON request." });
    res
      .status(err.status || 500)
      .json({
        error: err.status
          ? err.message
          : "Something went wrong. Please try again.",
      });
  });
  return app;
}
