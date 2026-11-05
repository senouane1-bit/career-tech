"use client";
import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Sparkles,
  FileText,
  History,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  CalendarDays,
  Upload,
  Download,
  ExternalLink,
  X,
  MoreHorizontal,
  Trash2,
  Pencil,
  LogOut,
  ShieldCheck,
  Target,
  TrendingUp,
  Building2,
  Menu,
  LoaderCircle,
  AlertCircle,
  FileCheck2,
  ArrowLeft,
  Columns3,
  List,
  Mail,
  Lock,
  User as UserIcon,
  Link as LinkIcon,
  Bell,
  Bookmark,
  Send,
  MessageSquare,
  Gift,
  ChevronLeft,
} from "lucide-react";
import {
  statuses,
  seed,
  blankJob,
  sampleReport,
  sampleJD,
  sampleText,
  type Store,
  type Job,
  type Analysis,
  type CV,
  type User,
  type Report,
  type Note,
  type Status,
} from "./model";
const nav = [
  { id: "dashboard", name: "Overview", icon: LayoutDashboard },
  { id: "applications", name: "Applications", icon: BriefcaseBusiness },
  { id: "analysis", name: "CV analysis", icon: Sparkles },
  { id: "cv", name: "My CV", icon: FileText },
  { id: "history", name: "Analysis history", icon: History },
];
const fmt = (date: string) =>
  date
    ? new Date(date.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) =>
        x.toString(16).padStart(2, "0"),
      ).join("");
const Badge = ({ status }: { status: string }) => (
  <span className={"badge " + status.toLowerCase().replaceAll(" ", "-")}>
    <span />
    {status}
  </span>
);
const Company = ({ name }: { name: string }) => (
  <span className={"company-icon c" + (name.charCodeAt(0) % 5)}>
    {name.slice(0, 1)}
  </span>
);
const Empty = ({
  icon: Icon = BriefcaseBusiness,
  title,
  text,
  action,
}: {
  icon?: any;
  title: string;
  text: string;
  action?: ReactNode;
}) => (
  <div className="empty">
    <span className="empty-icon">
      <Icon size={26} />
    </span>
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>
);
export default function Home() {
  const [ready, setReady] = useState(false),
    [store, setStore] = useState<Store>(seed),
    [api, setApi] = useState(""),
    [user, setUser] = useState<User | null>(null),
    [page, setPage] = useState("dashboard"),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [authMode, setAuthMode] = useState("login"),
    [auth, setAuth] = useState({ name: "", email: "", password: "" }),
    [jobs, setJobs] = useState<Job[]>([]),
    [cv, setCV] = useState<CV | null>(null),
    [analyses, setAnalyses] = useState<Analysis[]>([]),
    [dashboard, setDashboard] = useState<any>(null);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [view, setView] = useState("list"),
    [addedFrom, setAddedFrom] = useState(""),
    [appliedFrom, setAppliedFrom] = useState(""),
    [sort, setSort] = useState("newest");
  const [editor, setEditor] = useState<any>(null),
    [detail, setDetail] = useState<Job | null>(null),
    [notes, setNotes] = useState<Note[]>([]),
    [note, setNote] = useState(""),
    [confirm, setConfirm] = useState<{
      text: string;
      action: () => Promise<void>;
    } | null>(null);
  const [source, setSource] = useState("main"),
    [alt, setAlt] = useState<File | null>(null),
    [jd, setJD] = useState(""),
    [analysisTitle, setAnalysisTitle] = useState(""),
    [report, setReport] = useState<Analysis | null>(null),
    [reportTab, setReportTab] = useState("report"),
    [profile, setProfile] = useState({ name: "", monthlyGoal: 12 }),
    [apiDraft, setApiDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const demo = !api;
  useEffect(() => {
    const a =
      localStorage.getItem("careertech-api") ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NEXT_PUBLIC_DEMO_MODE === "true"
        ? ""
        : window.location.origin);
    setApi(a);
    setApiDraft(a);
    try {
      const s = localStorage.getItem("careertech-demo-v1");
      if (s) setStore(JSON.parse(s));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && demo) {
      try {
        localStorage.setItem("careertech-demo-v1", JSON.stringify(store));
      } catch {
        setError(
          "This browser’s demo storage is full. Your current changes remain in memory, but may not survive a reload. Connect the backend for durable storage.",
        );
      }
    }
  }, [store, ready, demo]);
  const request = async (path: string, options: RequestInit = {}) => {
    const r = await fetch(api + path, {
      ...options,
      credentials: "include",
      headers:
        options.body instanceof FormData
          ? options.headers
          : { "Content-Type": "application/json", ...options.headers },
    });
    if (r.status === 204) return null;
    let data;
    try {
      data = await r.json();
    } catch {
      throw new Error(
        "The server did not return a valid response. Check the API connection.",
      );
    }
    if (!r.ok) {
      if (r.status === 401) setUser(null);
      throw new Error(data.error || "Request failed.");
    }
    return data;
  };
  async function refresh() {
    if (demo) return;
    try {
      const u = await request("/api/profile");
      setUser(u);
      const [j, c, a, d] = await Promise.all([
        request("/api/jobs"),
        request("/api/cv"),
        request("/api/analyses"),
        request("/api/dashboard"),
      ]);
      setJobs(j);
      setCV(c);
      setAnalyses(a);
      setDashboard(d);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (ready && api) refresh();
  }, [ready, api]);
  const currentUser = demo ? store.user : user;
  const allJobs = demo ? store.jobs : jobs,
    mainCV = demo ? store.cv : cv,
    allAnalyses = demo ? store.analyses : analyses;
  useEffect(() => {
    if (currentUser)
      setProfile({
        name: currentUser.name,
        monthlyGoal: currentUser.monthlyGoal,
      });
  }, [currentUser?.name, currentUser?.monthlyGoal]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setError("");
    setMenu(false);
  }, [page]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditor(null);
        setDetail(null);
        setConfirm(null);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    if (!editor && !detail && !confirm) return;
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog =
      document.querySelector(".confirm-modal") ||
      document.querySelector("[role=dialog]");
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea,a[href]",
        ) || [],
      );
    focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const fields = focusable();
      const first = fields[0],
        last = fields[fields.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [!!editor, !!detail, !!confirm]);
  const run = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const navigate = (p: string) => {
    setPage(p);
    setReport(null);
  };
  const log = (s: Store, message: string) =>
    [
      { id: uid(), message, createdAt: new Date().toISOString() },
      ...s.activities,
    ].slice(0, 100);
  async function saveJob(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const now = new Date().toISOString();
      if (demo) {
        setStore((s) => {
          const j = {
            ...editor,
            id: editor.id || uid(),
            createdAt: editor.createdAt || now,
            updatedAt: now,
          };
          return {
            ...s,
            jobs: editor.id
              ? s.jobs.map((x) => (x.id === j.id ? j : x))
              : [j, ...s.jobs],
            activities: log(
              s,
              `${editor.id ? "Updated" : "Saved"} ${j.title} at ${j.company} · ${j.status}`,
            ),
          };
        });
      } else {
        await request("/api/jobs" + (editor.id ? "/" + editor.id : ""), {
          method: editor.id ? "PATCH" : "POST",
          body: JSON.stringify(editor),
        });
        await refresh();
      }
      setEditor(null);
      setToast("Opportunity saved. Your overview is up to date.");
    });
  }
  async function updateStatus(job: Job, s: Status) {
    await run(async () => {
      const patch = {
        status: s,
        appliedDate: job.appliedDate || (s === "Applied" ? today() : ""),
      };
      if (demo)
        setStore((st) => ({
          ...st,
          jobs: st.jobs.map((j) =>
            j.id === job.id
              ? { ...j, ...patch, updatedAt: new Date().toISOString() }
              : j,
          ),
          activities: log(st, `Moved ${job.title} at ${job.company} to ${s}`),
        }));
      else {
        await request("/api/jobs/" + job.id, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        await refresh();
      }
      setDetail((d) => (d?.id === job.id ? { ...d, ...patch } : d));
      setToast("Application status updated.");
    });
  }
  async function deleteJob(job: Job) {
    if (demo)
      setStore((s) => ({
        ...s,
        jobs: s.jobs.filter((j) => j.id !== job.id),
        activities: log(s, `Removed ${job.title} at ${job.company}`),
      }));
    else {
      await request("/api/jobs/" + job.id, { method: "DELETE" });
      await refresh();
    }
    setDetail(null);
    setToast("Opportunity deleted.");
  }
  async function openDetail(j: Job) {
    setDetail(j);
    setNote("");
    setNotes(demo ? store.notes[j.id] || [] : []);
    if (!demo)
      await run(async () =>
        setNotes(await request("/api/jobs/" + j.id + "/notes")),
      );
  }
  async function addNote() {
    if (!detail || !note.trim()) return;
    await run(async () => {
      const n = {
        id: uid(),
        body: note.trim(),
        createdAt: new Date().toISOString(),
      };
      if (demo)
        setStore((s) => ({
          ...s,
          notes: {
            ...s.notes,
            [detail.id]: [n, ...(s.notes[detail.id] || [])],
          },
          activities: log(s, `Added a note for ${detail.company}`),
        }));
      else
        await request("/api/jobs/" + detail.id + "/notes", {
          method: "POST",
          body: JSON.stringify({ body: note }),
        });
      setNotes((ns) => [n, ...ns]);
      setNote("");
      setToast("Note added to the timeline.");
    });
  }
  async function validateFile(file: File) {
    if (file.size > 4 * 1024 * 1024)
      throw new Error("Your PDF must be smaller than 4 MB.");
    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== "%PDF-"
    )
      throw new Error("Please select a valid PDF document.");
  }
  async function uploadCV(file: File) {
    await run(async () => {
      await validateFile(file);
      if (demo) {
        const buf = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (const b of buf) binary += String.fromCharCode(b);
        const digest = crypto.subtle
          ? await crypto.subtle.digest("SHA-256", buf)
          : null;
        const hash = digest
          ? Array.from(new Uint8Array(digest))
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("")
          : "demo-device-" + uid();
        setStore((s) => ({
          ...s,
          cv: {
            id: uid(),
            name: file.name,
            size: file.size,
            sha256: hash,
            createdAt: new Date().toISOString(),
            data: btoa(binary),
          },
        }));
        setToast(
          "PDF saved on this device for the demo. Text extraction requires the connected backend.",
        );
      } else {
        const f = new FormData();
        f.append("cv", file);
        setCV(await request("/api/cv", { method: "POST", body: f }));
        setToast("Main CV updated. Previous analysis versions are preserved.");
      }
    });
  }
  async function viewCV() {
    if (!mainCV) return;
    await run(async () => {
      let blob: Blob;
      if (demo) {
        if (mainCV.data) {
          blob = new Blob(
            [Uint8Array.from(atob(mainCV.data), (x) => x.charCodeAt(0))],
            { type: "application/pdf" },
          );
        } else {
          const { jsPDF } = await import("jspdf");
          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.text("Sara Morgan", 20, 25);
          doc.setFontSize(12);
          doc.text("FICTIONAL DEMONSTRATION CV", 20, 36);
          doc.text(doc.splitTextToSize(sampleText, 165), 20, 55);
          blob = doc.output("blob");
        }
      } else {
        const r = await fetch(api + "/api/cv/" + mainCV.id + "/file", {
          credentials: "include",
        });
        if (!r.ok) throw new Error("CV is no longer available.");
        blob = await r.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  }
  async function submitAnalysis(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (demo)
        throw new Error(
          "Live AI analysis needs a connected Express API and AI provider. Use “Open fictional example” to explore a clearly labeled sample report.",
        );
      if (source === "main" && !mainCV)
        throw new Error(
          "Upload your main CV first, or select an alternative PDF.",
        );
      if (source === "alternative" && !alt)
        throw new Error("Select an alternative PDF first.");
      const f = new FormData();
      f.append("jobDescription", jd);
      f.append("title", analysisTitle || "CV analysis");
      f.append("source", source);
      if (source === "alternative" && alt) {
        await validateFile(alt);
        f.append("cv", alt);
      }
      const r = await request("/api/analyses", { method: "POST", body: f });
      setReport(r);
      setReportTab("report");
      await refresh();
      setToast("Analysis complete. Your report has been saved.");
    });
  }
  async function exportReport(a: Analysis) {
    await run(async () => {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(11);
      const line = (t: string) => {
        for (const s of doc.splitTextToSize(t, 170)) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(s, 20, y);
          y += 6;
        }
        y += 4;
      };
      line("CareerTech | CV analysis");
      line(a.title);
      line(`${a.cvName} | ${fmt(a.createdAt)} | ${a.model}`);
      line(`${a.report.category} · ${a.report.score}/100`);
      line(a.report.summary);
      line(a.report.scoreExplanation);
      for (const r of a.report.requirements)
        line(
          `${r.status}: ${r.requirement}\n${r.evidence || "No confirming evidence"}\n${r.explanation}`,
        );
      for (const x of a.report.relevantExperience)
        line(`${x.title}\n${x.evidence}\n${x.relevance}`);
      for (const x of a.report.suggestions)
        line(
          `${x.section}: ${x.suggestion}\n${x.rationale}\nEvidence: ${x.evidence}`,
        );
      line(a.report.disclaimer);
      line("Original job description");
      line(a.jobDescription);
      doc.save("CareerTech_Analysis.pdf");
    });
  }
  async function authenticate(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setUser(
        await request("/api/auth/" + authMode, {
          method: "POST",
          body: JSON.stringify(auth),
        }),
      );
      await refresh();
      setToast("Welcome to your workspace.");
    });
  }
  const counts = Object.fromEntries(
    statuses.map((s) => [s, allJobs.filter((j) => j.status === s).length]),
  );
  const month = today().slice(0, 7);
  const previous = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  );
  const prevMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = allJobs.filter((j) =>
      j.appliedDate.startsWith(month),
    ).length,
    lastMonth = allJobs.filter((j) =>
      j.appliedDate.startsWith(prevMonth),
    ).length;
  const activities = demo ? store.activities : dashboard?.recentActivity || [];
  const upcoming = allJobs
    .flatMap((j) => [
      { type: "Interview", date: j.interviewDate, job: j },
      { type: "Follow up", date: j.followUpDate, job: j },
    ])
    .filter((x) => x.date && x.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date));
  const filtered = allJobs
    .filter(
      (j) =>
        (j.title + " " + j.company)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All statuses" || j.status === status) &&
        (!addedFrom || j.createdAt.slice(0, 10) >= addedFrom) &&
        (!appliedFrom || j.appliedDate >= appliedFrom),
    )
    .sort((a, b) =>
      sort === "company"
        ? a.company.localeCompare(b.company)
        : sort === "oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
    );
  const showSample = () => {
    setReport({
      id: "fictional-example",
      title: "Frontend Developer · Fictional example",
      jobDescription: sampleJD,
      cvId: "sample",
      cvName: "Sara_Morgan_CV.pdf",
      cvHash: "fictional-sample-v1",
      report: sampleReport,
      createdAt: new Date().toISOString(),
      model: "Fictional example — not a live AI response",
    });
    setReportTab("report");
  };
  const SectionHead = ({
    eyebrow,
    title,
    text,
    action,
  }: {
    eyebrow?: string;
    title: string;
    text: string;
    action?: ReactNode;
  }) => (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
  const buttonAdd = (
    <button className="btn primary" onClick={() => setEditor(blankJob())}>
      <Plus size={17} />
      Add opportunity
    </button>
  );
  if (!ready)
    return (
      <div className="loading-screen">
        <LoaderCircle className="spin" /> Opening your workspace…
      </div>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-symbol">
            <TrendingUp size={23} />
          </span>
          Career<span>Tech</span>
          <span className="brand-dot" />
        </a>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              {n.name}
              {n.id === "analysis" && <span className="new-tag">AI</span>}
              {n.id === "applications" && (
                <span className="nav-count">{allJobs.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span className="tip-icon">
            <Sparkles size={18} />
          </span>
          <h4>Small steps. Big possibilities.</h4>
          <p>Every application is a step toward your next chapter.</p>
          <button onClick={() => navigate("analysis")}>
            Strengthen your CV <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className={
              "settings-nav " + (page === "settings" ? "selected" : "")
            }
            onClick={() => navigate("settings")}
          >
            <Settings size={18} />
            Settings
          </button>
          <div className="user-menu">
            <span className="avatar">
              {(currentUser?.name || "Your workspace")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{currentUser?.name || "Welcome"}</strong>
              <small>{demo ? "Demo workspace" : "Personal account"}</small>
            </div>
            <button
              aria-label="Account settings"
              onClick={() => navigate("settings")}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {nav.find((n) => n.id === page)?.name || "Settings"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="today">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-btn notification-btn"
              aria-label="View upcoming actions"
              onClick={() => {
                navigate("dashboard");
                setTimeout(
                  () =>
                    document
                      .getElementById("upcoming")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  100,
                );
              }}
            >
              <Bell size={19} />
              {upcoming.length > 0 && <i />}
            </button>
            <span className="avatar small">
              {(currentUser?.name || "CT")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <span className="demo-dot" /> Interactive demo · Fictional data,
              saved on this device. Live accounts and AI require the backend.
            </span>
            <button onClick={() => navigate("settings")}>
              Connect backend <ArrowRight size={13} />
            </button>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}
        {api && !user ? (
          <main className="auth-wrap">
            <div className="auth-card">
              <span className="auth-mark">
                <ShieldCheck size={27} />
              </span>
              <div className="eyebrow">YOUR PRIVATE WORKSPACE</div>
              <h1>
                {authMode === "login"
                  ? "Welcome back."
                  : "Start your next chapter."}
              </h1>
              <p>Keep your opportunities, CV and next steps together.</p>
              <form onSubmit={authenticate}>
                {authMode === "register" && (
                  <label>
                    Full name
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={auth.name}
                      onChange={(e) =>
                        setAuth({ ...auth, name: e.target.value })
                      }
                    />
                  </label>
                )}
                <label>
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={auth.email}
                    onChange={(e) =>
                      setAuth({ ...auth, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={10}
                    maxLength={72}
                    value={auth.password}
                    onChange={(e) =>
                      setAuth({ ...auth, password: e.target.value })
                    }
                  />
                  <small>At least 10 characters.</small>
                </label>
                <button disabled={busy} className="btn primary full">
                  {busy ? <LoaderCircle size={17} className="spin" /> : null}
                  {authMode === "login" ? "Log in" : "Create account"}
                  <ArrowRight size={16} />
                </button>
              </form>
              <button
                className="text-btn"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
              >
                {authMode === "login"
                  ? "New here? Create an account"
                  : "Already have an account? Log in"}
              </button>
              <button
                className="text-btn muted"
                onClick={() => {
                  setApi("");
                  setApiDraft("");
                  localStorage.removeItem("careertech-api");
                }}
              >
                Return to demo
              </button>
            </div>
          </main>
        ) : (
          <main className="content">
            {page === "dashboard" && (
              <>
                <SectionHead
                  eyebrow="A LITTLE PROGRESS, EVERY DAY"
                  title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${currentUser?.name.split(" ")[0] || "there"} ☀`}
                  text="Your next chapter starts here. Let’s keep things moving."
                  action={buttonAdd}
                />
                <div className="stats-grid">
                  {[
                    {
                      label: "Total opportunities",
                      value: allJobs.length,
                      icon: BriefcaseBusiness,
                      color: "purple",
                      sub: counts.Saved + " saved for later",
                    },
                    {
                      label: "Applications sent",
                      value: allJobs.filter((j) => j.status !== "Saved").length,
                      icon: Send,
                      color: "blue",
                      sub: thisMonth + " this month",
                    },
                    {
                      label: "In conversation",
                      value: counts.Interview,
                      icon: MessageSquare,
                      color: "amber",
                      sub: "Interview stage",
                    },
                    {
                      label: "Offers received",
                      value: counts.Offer,
                      icon: Gift,
                      color: "green",
                      sub: counts.Offer
                        ? "Your hard work is paying off"
                        : "Your next opportunity awaits",
                    },
                  ].map((x) => (
                    <div className="stat-card" key={x.label}>
                      <div className="stat-top">
                        <span>{x.label}</span>
                        <span className={"stat-icon " + x.color}>
                          <x.icon size={17} />
                        </span>
                      </div>
                      <strong>
                        {x.value}
                        <span className="stat-dot" />
                      </strong>
                      <small>
                        {x.color === "blue" ? (
                          <TrendingUp size={12} />
                        ) : (
                          <span className={"tiny-dot " + x.color} />
                        )}{" "}
                        {x.sub}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="dashboard-columns">
                  <div className="dashboard-left">
                    <section className="card pipeline-card">
                      <div className="card-heading">
                        <div>
                          <h2>Application pipeline</h2>
                          <p>A clear view of where you stand.</p>
                        </div>
                        <span className="subtle-label">
                          {allJobs.length} opportunities
                        </span>
                      </div>
                      <div className="pipeline-track">
                        {statuses.map((s) => (
                          <div
                            key={s}
                            className={"segment " + s.toLowerCase()}
                            style={{ flex: counts[s] || 0.12 }}
                            title={`${s}: ${counts[s]}`}
                          />
                        ))}
                      </div>
                      <div className="pipeline-legend">
                        {statuses.map((s) => (
                          <button
                            onClick={() => {
                              setStatus(s);
                              navigate("applications");
                            }}
                            key={s}
                          >
                            <span className={"legend-dot " + s.toLowerCase()} />
                            <span>{s}</span>
                            <strong>{counts[s]}</strong>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="card recent-card">
                      <div className="card-heading">
                        <div>
                          <h2>Recent opportunities</h2>
                          <p>Good things take a little follow-through.</p>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => {
                            setStatus("All statuses");
                            navigate("applications");
                          }}
                        >
                          View all <ArrowRight size={15} />
                        </button>
                      </div>
                      {allJobs.length ? (
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>OPPORTUNITY</th>
                                <th>STATUS</th>
                                <th>DATE ADDED</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {[...allJobs]
                                .sort((a, b) =>
                                  b.createdAt.localeCompare(a.createdAt),
                                )
                                .slice(0, 5)
                                .map((j) => (
                                  <tr key={j.id} onClick={() => openDetail(j)}>
                                    <td>
                                      <div className="job-cell">
                                        <Company name={j.company} />
                                        <div>
                                          <strong>{j.title}</strong>
                                          <small>{j.company}</small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <Badge status={j.status} />
                                    </td>
                                    <td className="muted">
                                      {fmt(j.createdAt)}
                                    </td>
                                    <td>
                                      <button
                                        aria-label={"View " + j.title}
                                        className="icon-btn"
                                      >
                                        <ArrowUpRight size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <Empty
                          title="A fresh start"
                          text="Save your first opportunity to start building your pipeline."
                          action={buttonAdd}
                        />
                      )}
                    </section>
                    <section className="card activity-card">
                      <div className="card-heading">
                        <div>
                          <h2>Recent activity</h2>
                          <p>Your progress, one step at a time.</p>
                        </div>
                        <span className="icon-square">
                          <History size={16} />
                        </span>
                      </div>
                      {activities.length ? (
                        <div className="activity-list">
                          {activities.slice(0, 4).map((a: any, i: number) => (
                            <div className="activity-row" key={a.id}>
                              <span
                                className={
                                  "activity-marker " + (i === 0 ? "latest" : "")
                                }
                              >
                                <Check size={12} />
                              </span>
                              <span>{a.message}</span>
                              <small>{fmt(a.createdAt)}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="padded muted">
                          Your application activity will appear here.
                        </p>
                      )}
                    </section>
                  </div>
                  <aside className="dashboard-right">
                    <section className="ai-card">
                      <div className="ai-card-top">
                        <span>
                          <Sparkles size={18} />
                        </span>
                        <small>YOUR AI CAREER COMPANION</small>
                      </div>
                      <h2>
                        A stronger CV.
                        <br />A clearer next step.
                      </h2>
                      <p>
                        See how your experience connects to your next
                        opportunity.
                      </p>
                      <button
                        className="btn ai-button"
                        onClick={() => navigate("analysis")}
                      >
                        Analyze my CV <ArrowUpRight size={16} />
                      </button>
                      <div className="ai-footer">
                        <ShieldCheck size={13} /> Your experience. Never
                        invented.
                      </div>
                      <span className="ai-orbit one" />
                      <span className="ai-orbit two" />
                    </section>
                    <section className="card cv-mini">
                      <div className="card-heading">
                        <h2>Your main CV</h2>
                        <button
                          className="icon-btn"
                          aria-label="Manage CV"
                          onClick={() => navigate("cv")}
                        >
                          <MoreHorizontal size={19} />
                        </button>
                      </div>
                      {mainCV ? (
                        <>
                          <div className="cv-mini-file">
                            <span className="pdf-icon">
                              <FileText size={22} />
                              <small>PDF</small>
                            </span>
                            <div>
                              <strong>{mainCV.name}</strong>
                              <small>
                                Updated {fmt(mainCV.createdAt)} ·{" "}
                                {Math.round(mainCV.size / 1024)} KB
                              </small>
                            </div>
                            <span className="check-round">
                              <Check size={12} />
                            </span>
                          </div>
                          <button
                            className="btn secondary full"
                            onClick={() => navigate("cv")}
                          >
                            Manage CV <ArrowRight size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          className="upload-mini"
                          onClick={() => navigate("cv")}
                        >
                          <Upload size={20} />
                          Upload your main CV
                        </button>
                      )}
                    </section>
                    <section className="card goal-card">
                      <div className="card-heading">
                        <h2>Monthly goal</h2>
                        <Target size={18} />
                      </div>
                      <div className="goal-value">
                        <strong>
                          {thisMonth}
                          <span> / {currentUser?.monthlyGoal || 12}</span>
                        </strong>
                        <span>applications</span>
                      </div>
                      <div className="progress">
                        <span
                          style={{
                            width:
                              Math.min(
                                100,
                                (thisMonth / (currentUser?.monthlyGoal || 12)) *
                                  100,
                              ) + "%",
                          }}
                        />
                      </div>
                      <p>
                        {thisMonth >= (currentUser?.monthlyGoal || 12)
                          ? "Goal reached. Take a moment to celebrate."
                          : "Consistency creates opportunities. You’ve got this."}
                      </p>
                      <button
                        className="text-btn muted"
                        onClick={() => navigate("settings")}
                      >
                        Edit goal <Pencil size={11} />
                      </button>
                    </section>
                    <section className="card upcoming-card" id="upcoming">
                      <div className="card-heading">
                        <h2>Coming up</h2>
                        <CalendarDays size={17} />
                      </div>
                      {upcoming.length ? (
                        upcoming.slice(0, 3).map((x, i) => (
                          <button
                            className="upcoming-row"
                            key={i}
                            onClick={() => openDetail(x.job)}
                          >
                            <span className="date-box">
                              <small>
                                {new Date(
                                  x.date + "T12:00:00",
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                })}
                              </small>
                              <strong>{Number(x.date.slice(-2))}</strong>
                            </span>
                            <span>
                              <strong>
                                {x.type} · {x.job.company}
                              </strong>
                              <small>{x.job.title}</small>
                            </span>
                            <ChevronRight size={14} />
                          </button>
                        ))
                      ) : (
                        <p className="muted padded">
                          No upcoming dates. Add a follow-up or interview date
                          to an opportunity.
                        </p>
                      )}
                    </section>
                  </aside>
                </div>
                <section className="monthly-summary">
                  <TrendingUp size={16} />
                  <span>
                    {thisMonth} applications this month · {lastMonth} last month
                    · {thisMonth - lastMonth >= 0 ? "+" : ""}
                    {thisMonth - lastMonth} change
                  </span>
                  <span>One thoughtful application at a time.</span>
                </section>
              </>
            )}
            {page === "applications" && (
              <>
                <SectionHead
                  eyebrow="MAKE ROOM FOR WHAT’S NEXT"
                  title="Your opportunities"
                  text="From the first bookmark to the final offer. Keep every step in view."
                  action={buttonAdd}
                />
                <div className="filter-bar">
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Search opportunities"
                      placeholder="Search role or company…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>All statuses</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Sort opportunities"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="company">Company A–Z</option>
                  </select>
                  <div className="view-switch">
                    <button
                      aria-label="List view"
                      className={view === "list" ? "active" : ""}
                      onClick={() => setView("list")}
                    >
                      <List size={18} />
                    </button>
                    <button
                      aria-label="Board view"
                      className={view === "board" ? "active" : ""}
                      onClick={() => setView("board")}
                    >
                      <Columns3 size={18} />
                    </button>
                  </div>
                </div>
                <div className="date-filters">
                  <label>
                    Added from{" "}
                    <input
                      type="date"
                      value={addedFrom}
                      onChange={(e) => setAddedFrom(e.target.value)}
                    />
                  </label>
                  <label>
                    Applied from{" "}
                    <input
                      type="date"
                      value={appliedFrom}
                      onChange={(e) => setAppliedFrom(e.target.value)}
                    />
                  </label>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setQuery("");
                      setStatus("All statuses");
                      setAddedFrom("");
                      setAppliedFrom("");
                    }}
                  >
                    Clear filters
                  </button>
                  <span>
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                </div>
                {filtered.length ? (
                  view === "list" ? (
                    <section className="card">
                      <div className="table-scroll">
                        <table className="jobs-table">
                          <thead>
                            <tr>
                              <th>OPPORTUNITY</th>
                              <th>STATUS</th>
                              <th>APPLIED</th>
                              <th>NEXT FOLLOW-UP</th>
                              <th>ADDED</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((j) => (
                              <tr key={j.id}>
                                <td>
                                  <button
                                    className="job-cell job-button"
                                    onClick={() => openDetail(j)}
                                  >
                                    <Company name={j.company} />
                                    <span>
                                      <strong>{j.title}</strong>
                                      <small>{j.company}</small>
                                    </span>
                                  </button>
                                </td>
                                <td>
                                  <select
                                    className={
                                      "status-select " + j.status.toLowerCase()
                                    }
                                    aria-label={
                                      "Status for " +
                                      j.title +
                                      " at " +
                                      j.company
                                    }
                                    value={j.status}
                                    onChange={(e) =>
                                      updateStatus(j, e.target.value as Status)
                                    }
                                  >
                                    {statuses.map((s) => (
                                      <option key={s}>{s}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>{fmt(j.appliedDate)}</td>
                                <td>{fmt(j.followUpDate)}</td>
                                <td>{fmt(j.createdAt)}</td>
                                <td>
                                  <button
                                    aria-label={"Edit " + j.title}
                                    className="icon-btn"
                                    onClick={() => setEditor(j)}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : (
                    <div className="kanban">
                      {statuses.map((s) => (
                        <section className="kanban-column" key={s}>
                          <h3>
                            <span className={"legend-dot " + s.toLowerCase()} />
                            {s}
                            <small>
                              {filtered.filter((j) => j.status === s).length}
                            </small>
                          </h3>
                          {filtered
                            .filter((j) => j.status === s)
                            .map((j) => (
                              <button
                                className="kanban-job"
                                key={j.id}
                                onClick={() => openDetail(j)}
                              >
                                <Company name={j.company} />
                                <strong>{j.title}</strong>
                                <span>{j.company}</span>
                                <small>
                                  <Clock size={12} />
                                  {fmt(j.createdAt)}
                                </small>
                              </button>
                            ))}
                          <button
                            className="kanban-add"
                            onClick={() =>
                              setEditor({ ...blankJob(), status: s })
                            }
                          >
                            <Plus size={14} />
                            Add opportunity
                          </button>
                        </section>
                      ))}
                    </div>
                  )
                ) : (
                  <section className="card">
                    <Empty
                      title="No opportunities here yet"
                      text="Save a new role or adjust your filters to find what you’re looking for."
                      action={buttonAdd}
                    />
                  </section>
                )}
              </>
            )}
            {page === "cv" && (
              <>
                <SectionHead
                  eyebrow="YOUR EXPERIENCE, WELL PRESENTED"
                  title="A home for your CV"
                  text="Keep your main CV ready. Your next opportunity could be one click away."
                />
                <div className="two-col cv-page">
                  <section className="card">
                    <div className="card-heading">
                      <div>
                        <h2>Main CV</h2>
                        <p>Your default document for CV analysis.</p>
                      </div>
                      {mainCV && <Badge status="Ready" />}
                    </div>
                    {mainCV ? (
                      <div className="cv-document">
                        <div className="paper-preview">
                          <div className="paper-top">
                            <span />
                            <i />
                            <i />
                          </div>
                          <div className="paper-columns">
                            <div>
                              {Array.from({ length: 12 }, (_, i) => (
                                <i
                                  key={i}
                                  style={{
                                    width: i % 3 === 0 ? "65%" : "100%",
                                  }}
                                />
                              ))}
                            </div>
                            <aside>
                              {Array.from({ length: 9 }, (_, i) => (
                                <i key={i} />
                              ))}
                            </aside>
                          </div>
                          <span className="paper-watermark">PDF DOCUMENT</span>
                        </div>
                        <h3>{mainCV.name}</h3>
                        <p>
                          {Math.round(mainCV.size / 1024)} KB · Uploaded{" "}
                          {fmt(mainCV.createdAt)}
                        </p>
                        <div className="row-buttons">
                          <button className="btn secondary" onClick={viewCV}>
                            <ExternalLink size={16} />
                            View PDF
                          </button>
                          <button
                            className="btn primary"
                            onClick={() => fileRef.current?.click()}
                          >
                            <Upload size={16} />
                            Replace CV
                          </button>
                        </div>
                        <small className="hash-info">
                          Version fingerprint: {mainCV.sha256.slice(0, 20)}…
                        </small>
                      </div>
                    ) : (
                      <div
                        className="upload-zone"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files[0])
                            uploadCV(e.dataTransfer.files[0]);
                        }}
                      >
                        <span className="empty-icon">
                          <Upload size={27} />
                        </span>
                        <h3>Your experience starts here</h3>
                        <p>Drag and drop your CV, or choose a PDF.</p>
                        <button
                          className="btn primary"
                          onClick={() => fileRef.current?.click()}
                        >
                          Choose PDF
                        </button>
                        <small>
                          PDF only · Up to 4 MB · Text-based documents
                        </small>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      className="sr-only"
                      type="file"
                      accept="application/pdf,.pdf"
                      aria-label="Upload main CV"
                      onChange={(e) => {
                        if (e.target.files?.[0]) uploadCV(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </section>
                  <aside className="stack">
                    <section className="card info-card">
                      <span className="feature-icon">
                        <ShieldCheck size={24} />
                      </span>
                      <h2>Private by design</h2>
                      <p>
                        Your CV belongs to your account. Connected accounts use
                        owner checks for every document and report.
                      </p>
                      <div className="check-list">
                        <span>
                          <CheckCircle2 size={16} />
                          One main CV, always up to date
                        </span>
                        <span>
                          <CheckCircle2 size={16} />
                          Earlier reports keep their CV version
                        </span>
                        <span>
                          <CheckCircle2 size={16} />
                          Alternative uploads stay separate
                        </span>
                      </div>
                    </section>
                    <section className="card info-card">
                      <span className="feature-icon warm">
                        <FileCheck2 size={24} />
                      </span>
                      <h2>A small tip for a better analysis</h2>
                      <p>
                        Use a PDF with selectable text. Scanned images and
                        password-protected PDFs cannot be analyzed without
                        readable text.
                      </p>
                      {demo && (
                        <p className="notice">
                          Demo uploads stay on this device. Full PDF text
                          validation runs in the connected backend.
                        </p>
                      )}
                    </section>
                    <button
                      className="btn primary full"
                      onClick={() => navigate("analysis")}
                    >
                      Put your CV to work <Sparkles size={16} />
                    </button>
                  </aside>
                </div>
              </>
            )}
            {page === "analysis" && !report && (
              <>
                <SectionHead
                  eyebrow="CLARITY BEFORE YOUR NEXT MOVE"
                  title="See the connection."
                  text="Discover how your real experience aligns with a role, and how to tell your story better."
                />
                <div className="two-col analysis-page">
                  <form
                    className="card analysis-form"
                    onSubmit={submitAnalysis}
                  >
                    <div className="form-step">
                      <span>1</span>
                      <div>
                        <h2>Choose your CV</h2>
                        <p>The experience you want to put forward.</p>
                      </div>
                    </div>
                    <div className="cv-choice">
                      <button
                        type="button"
                        className={source === "main" ? "selected" : ""}
                        onClick={() => setSource("main")}
                      >
                        <FileText size={21} />
                        <span>
                          <strong>My main CV</strong>
                          <small>
                            {mainCV?.name || "Upload your main CV first"}
                          </small>
                        </span>
                        <i>{source === "main" && <Check size={11} />}</i>
                      </button>
                      <button
                        type="button"
                        className={source === "alternative" ? "selected" : ""}
                        onClick={() => setSource("alternative")}
                      >
                        <Upload size={21} />
                        <span>
                          <strong>A different CV</strong>
                          <small>Just for this analysis</small>
                        </span>
                        <i>{source === "alternative" && <Check size={11} />}</i>
                      </button>
                    </div>
                    {source === "alternative" && (
                      <label className="file-field">
                        Alternative CV (PDF, up to 4 MB)
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => setAlt(e.target.files?.[0] || null)}
                        />
                        <small>This will not replace your main CV.</small>
                      </label>
                    )}
                    <div className="form-divider" />
                    <div className="form-step">
                      <span>2</span>
                      <div>
                        <h2>Add the opportunity</h2>
                        <p>No saved application needed.</p>
                      </div>
                    </div>
                    <label>
                      Report title <span className="optional">optional</span>
                      <input
                        maxLength={200}
                        value={analysisTitle}
                        onChange={(e) => setAnalysisTitle(e.target.value)}
                        placeholder="e.g. Frontend Developer at Linear"
                      />
                    </label>
                    <label>
                      Job description
                      <textarea
                        required
                        minLength={40}
                        maxLength={30000}
                        rows={9}
                        placeholder="Paste the role, responsibilities and qualifications here…"
                        value={jd}
                        onChange={(e) => setJD(e.target.value)}
                      />
                      <small>
                        {jd.length.toLocaleString()} / 30,000 characters ·
                        Minimum 40
                      </small>
                    </label>
                    <div className="privacy-note">
                      <Lock size={13} /> Your CV and job description are sent to
                      the configured AI provider for this analysis.
                    </div>
                    <button disabled={busy} className="btn primary full big">
                      {busy ? (
                        <>
                          <LoaderCircle size={18} className="spin" />
                          Reading and comparing your experience…
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Analyze my CV
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                    {demo && (
                      <p className="demo-help">
                        Live AI is unavailable in the demo.{" "}
                        <button type="button" onClick={showSample}>
                          Open fictional example <ArrowUpRight size={12} />
                        </button>
                      </p>
                    )}
                  </form>
                  <aside className="stack">
                    <section className="analysis-guide">
                      <span className="guide-spark">
                        <Sparkles size={26} />
                      </span>
                      <div className="eyebrow">
                        EVIDENCE. INSIGHT. DIRECTION.
                      </div>
                      <h2>
                        Your experience.
                        <br />A fresh perspective.
                      </h2>
                      <p>
                        A useful assessment starts with what you’ve actually
                        done.
                      </p>
                      <div className="guide-item">
                        <CheckCircle2 size={19} />
                        <div>
                          <strong>What already connects</strong>
                          <p>
                            Qualifications supported by specific CV evidence.
                          </p>
                        </div>
                      </div>
                      <div className="guide-item">
                        <Search size={19} />
                        <div>
                          <strong>What needs more clarity</strong>
                          <p>
                            Requirements the document doesn’t clearly confirm.
                          </p>
                        </div>
                      </div>
                      <div className="guide-item">
                        <Pencil size={19} />
                        <div>
                          <strong>How to tell it better</strong>
                          <p>
                            Practical ways to present your existing experience.
                          </p>
                        </div>
                      </div>
                      <div className="guide-bottom">
                        <ShieldCheck size={18} />
                        <p>
                          No invented qualifications.
                          <br />
                          No predictions of hiring success.
                        </p>
                      </div>
                    </section>
                    <div className="card info-card">
                      <h3>Tracking and analysis stay independent.</h3>
                      <p>
                        An analysis never applies to a job or changes your
                        application status. You stay in control of every next
                        step.
                      </p>
                    </div>
                    {!demo && (
                      <button className="btn secondary" onClick={showSample}>
                        Explore a fictional example
                      </button>
                    )}
                  </aside>
                </div>
              </>
            )}
            {(page === "analysis" || page === "history") && report && (
              <>
                <div className="report-toolbar">
                  <button
                    className="text-btn muted"
                    onClick={() => setReport(null)}
                  >
                    <ArrowLeft size={16} />
                    Back to {page === "history" ? "history" : "analysis"}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => exportReport(report)}
                  >
                    <Download size={15} />
                    Download PDF
                  </button>
                </div>
                <SectionHead
                  eyebrow="YOUR CV, IN CONTEXT"
                  title={report.title}
                  text={`${report.cvName} · ${fmt(report.createdAt)} · ${report.model}`}
                />
                <div className="report-tabs">
                  <button
                    className={reportTab === "report" ? "active" : ""}
                    onClick={() => setReportTab("report")}
                  >
                    Analysis report
                  </button>
                  <button
                    className={reportTab === "description" ? "active" : ""}
                    onClick={() => setReportTab("description")}
                  >
                    Original job description
                  </button>
                  <button
                    className={reportTab === "version" ? "active" : ""}
                    onClick={() => setReportTab("version")}
                  >
                    CV version
                  </button>
                </div>
                {reportTab === "description" ? (
                  <section className="card readable">
                    <h2>Original job description</h2>
                    <p className="preserve">{report.jobDescription}</p>
                  </section>
                ) : reportTab === "version" ? (
                  <section className="card readable">
                    <h2>CV snapshot</h2>
                    <p>File: {report.cvName}</p>
                    <p>
                      Version: <code>{report.cvHash}</code>
                    </p>
                    <p>
                      Report created:{" "}
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <p>
                      This report retains its original CV reference and
                      generated results even when your main CV changes.
                    </p>
                    {!demo && report.cvId !== "sample" && (
                      <a
                        className="btn secondary"
                        href={api + "/api/cv/" + report.cvId + "/file"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open original CV
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </section>
                ) : (
                  <>
                    <section className="report-summary card">
                      <div
                        className="score-ring"
                        style={{ "--score": report.report.score + "%" } as any}
                      >
                        <span>
                          <strong>{report.report.score}</strong>
                          <small>/ 100</small>
                        </span>
                      </div>
                      <div>
                        <div className="report-category">
                          <Sparkles size={17} />
                          {report.report.category}
                        </div>
                        <h2>Overall assessment</h2>
                        <p>{report.report.summary}</p>
                      </div>
                    </section>
                    <details className="score-explanation">
                      <summary>
                        How this score is calculated <ChevronDown size={14} />
                      </summary>
                      <p>{report.report.scoreExplanation}</p>
                    </details>
                    <div className="report-grid">
                      <section className="card report-section">
                        <h2>
                          <span className="feature-icon small green">
                            <CheckCircle2 size={18} />
                          </span>
                          Matching qualifications{" "}
                          <small>
                            {
                              report.report.requirements.filter(
                                (x) => x.status === "demonstrated",
                              ).length
                            }
                          </small>
                        </h2>
                        {report.report.requirements
                          .filter((x) => x.status === "demonstrated")
                          .map((r, i) => (
                            <div className="evidence-item" key={i}>
                              <h3>
                                {r.requirement}
                                <span>{r.weight} pts</span>
                              </h3>
                              <blockquote>“{r.evidence}”</blockquote>
                              <p>{r.explanation}</p>
                            </div>
                          ))}
                      </section>
                      <section className="card report-section">
                        <h2>
                          <span className="feature-icon small warm">
                            <Search size={18} />
                          </span>
                          Unconfirmed requirements
                        </h2>
                        <p className="muted">
                          Not mentioned does not mean not qualified.
                        </p>
                        {report.report.requirements
                          .filter((x) => x.status !== "demonstrated")
                          .map((r, i) => (
                            <div className="evidence-item" key={i}>
                              <h3>{r.requirement}</h3>
                              <span className="unconfirmed-label">
                                {r.status === "unsupported"
                                  ? "Unsupported by supplied evidence"
                                  : "Not clearly described"}
                              </span>
                              <p>{r.explanation}</p>
                              {r.evidence && (
                                <blockquote>“{r.evidence}”</blockquote>
                              )}
                            </div>
                          ))}
                        {!report.report.requirements.some(
                          (x) => x.status !== "demonstrated",
                        ) && (
                          <p>
                            All identified requirements have supporting CV
                            evidence.
                          </p>
                        )}
                      </section>
                      <section className="card report-section">
                        <h2>
                          <span className="feature-icon small">
                            <BriefcaseBusiness size={18} />
                          </span>
                          Relevant experience
                        </h2>
                        {report.report.relevantExperience.map((x, i) => (
                          <div className="evidence-item" key={i}>
                            <h3>{x.title}</h3>
                            <blockquote>“{x.evidence}”</blockquote>
                            <p>{x.relevance}</p>
                          </div>
                        ))}
                      </section>
                      <section className="card report-section">
                        <h2>
                          <span className="feature-icon small">
                            <Pencil size={18} />
                          </span>
                          Make your CV stronger
                        </h2>
                        {report.report.suggestions.map((x, i) => (
                          <div className="evidence-item" key={i}>
                            <span className="section-tag">{x.section}</span>
                            <h3>{x.suggestion}</h3>
                            <p>{x.rationale}</p>
                            <details>
                              <summary>Supporting CV evidence</summary>
                              <blockquote>“{x.evidence}”</blockquote>
                            </details>
                          </div>
                        ))}
                      </section>
                    </div>
                    <div className="report-disclaimer">
                      <ShieldCheck size={18} />
                      {report.report.disclaimer}
                    </div>
                  </>
                )}
              </>
            )}
            {page === "history" && !report && (
              <>
                <SectionHead
                  eyebrow="INSIGHT YOU CAN RETURN TO"
                  title="Your analysis history"
                  text="Every report, with the CV and job description that shaped it."
                  action={
                    <button
                      className="btn primary"
                      onClick={() => navigate("analysis")}
                    >
                      <Sparkles size={17} />
                      New analysis
                    </button>
                  }
                />
                {allAnalyses.length ? (
                  <div className="history-grid">
                    {allAnalyses.map((a) => (
                      <article className="card history-card" key={a.id}>
                        <div className="history-card-top">
                          <span className="feature-icon">
                            <Sparkles size={20} />
                          </span>
                          <button
                            className="icon-btn"
                            aria-label={"Delete report " + a.title}
                            onClick={() =>
                              setConfirm({
                                text: "Delete this analysis? This removes the saved report permanently.",
                                action: async () => {
                                  if (demo)
                                    setStore((s) => ({
                                      ...s,
                                      analyses: s.analyses.filter(
                                        (x) => x.id !== a.id,
                                      ),
                                    }));
                                  else {
                                    await request("/api/analyses/" + a.id, {
                                      method: "DELETE",
                                    });
                                    await refresh();
                                  }
                                  setToast("Analysis deleted.");
                                },
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className="history-date">
                          {fmt(a.createdAt)} ·{" "}
                          {new Date(a.createdAt).getFullYear()}
                        </span>
                        <h2>{a.title}</h2>
                        <p>
                          <FileText size={13} />
                          {a.cvName}
                        </p>
                        <div className="history-match">
                          <Badge status={a.report.category} />
                          <strong>
                            {a.report.score}
                            <small>/100</small>
                          </strong>
                        </div>
                        <p className="clamp">{a.report.summary}</p>
                        <button
                          className="btn secondary full"
                          onClick={() => {
                            setReport(a);
                            setReportTab("report");
                          }}
                        >
                          Open report
                          <ArrowUpRight size={15} />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <section className="card">
                    <Empty
                      icon={History}
                      title="Your insights will live here"
                      text="Run your first CV analysis and return to the original report anytime."
                      action={
                        <button
                          className="btn primary"
                          onClick={() => navigate("analysis")}
                        >
                          Analyze my CV
                          <Sparkles size={16} />
                        </button>
                      }
                    />
                  </section>
                )}
              </>
            )}
            {page === "settings" && (
              <>
                <SectionHead
                  eyebrow="MAKE THIS SPACE YOURS"
                  title="Workspace settings"
                  text="A few personal details. A clear goal. Your search, your way."
                />
                <div className="two-col settings-page">
                  <form
                    className="card settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(async () => {
                        if (demo)
                          setStore((s) => ({
                            ...s,
                            user: { ...s.user, ...profile },
                          }));
                        else {
                          setUser(
                            await request("/api/profile", {
                              method: "PATCH",
                              body: JSON.stringify(profile),
                            }),
                          );
                          await refresh();
                        }
                        setToast("Profile and goal updated.");
                      });
                    }}
                  >
                    <div className="card-heading">
                      <h2>Personal profile</h2>
                      <UserIcon size={19} />
                    </div>
                    <label>
                      Full name
                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Email address
                      <input readOnly value={currentUser?.email || ""} />
                      <small>Your account email is used to sign in.</small>
                    </label>
                    <div className="form-divider" />
                    <h3>Monthly application goal</h3>
                    <p className="muted">
                      Choose a realistic target for thoughtful applications.
                    </p>
                    <label>
                      Applications per month
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        required
                        value={profile.monthlyGoal}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            monthlyGoal: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <button className="btn primary" disabled={busy}>
                      Save changes
                      <Check size={16} />
                    </button>
                  </form>
                  <aside className="stack">
                    <section className="card settings-form">
                      <div className="card-heading">
                        <h2>Backend connection</h2>
                        <span
                          className={
                            "connection-dot " + (!demo ? "connected" : "")
                          }
                        />
                      </div>
                      <p className="muted">
                        {demo
                          ? "You are exploring fictional sample data. Connect your deployed Express API to use private accounts, PostgreSQL and live AI."
                          : "Connected mode uses your Express API. Your server handles accounts, file storage, analysis and history."}
                      </p>
                      <label>
                        Express API origin
                        <input
                          type="url"
                          placeholder="https://your-careertech-api.example.com"
                          value={apiDraft}
                          onChange={(e) => setApiDraft(e.target.value)}
                        />
                        <small>
                          Use HTTPS in production. No trailing /api.
                        </small>
                      </label>
                      <button
                        className="btn secondary full"
                        onClick={() => {
                          try {
                            const url = new URL(apiDraft);
                            if (
                              url.protocol !== "https:" &&
                              !["localhost", "127.0.0.1"].includes(url.hostname)
                            )
                              throw new Error();
                            const value = url.origin;
                            localStorage.setItem("careertech-api", value);
                            setApi(value);
                            setApiDraft(value);
                            setUser(null);
                            setError("");
                          } catch {
                            setError(
                              "Enter a valid HTTPS API origin, or http://localhost:4000 for development.",
                            );
                          }
                        }}
                      >
                        Connect API
                        <ArrowRight size={15} />
                      </button>
                      {!demo && (
                        <button
                          className="text-btn muted"
                          onClick={() => {
                            setApi("");
                            setApiDraft("");
                            setUser(null);
                            localStorage.removeItem("careertech-api");
                          }}
                        >
                          Disconnect and return to demo
                        </button>
                      )}
                      <div className="notice">
                        Server setup and deployment instructions are included in
                        the source project. API keys belong on the server, never
                        in this field.
                      </div>
                    </section>
                    <section className="card settings-form">
                      <h2>{demo ? "Demo workspace" : "Your session"}</h2>
                      <p className="muted">
                        {demo
                          ? "Demo data is saved only in this browser. Use fictional documents here. Resetting will restore the sample workspace."
                          : "Sign out when using a shared device."}
                      </p>
                      <button
                        className="btn secondary full"
                        onClick={() =>
                          demo
                            ? setConfirm({
                                text: "Reset the demo? All opportunities, uploads, notes and changes saved on this device will be replaced with fictional sample data.",
                                action: async () => {
                                  setStore(seed());
                                  setToast("Demo reset.");
                                },
                              })
                            : run(async () => {
                                await request("/api/auth/logout", {
                                  method: "POST",
                                });
                                setUser(null);
                                setJobs([]);
                                setCV(null);
                                setAnalyses([]);
                              })
                        }
                      >
                        {demo ? <History size={16} /> : <LogOut size={16} />}{" "}
                        {demo ? "Reset demo data" : "Log out"}
                      </button>
                    </section>
                  </aside>
                </div>
              </>
            )}
            <footer className="page-footer">
              <span className="footer-brand">CareerTech</span>
              <span>A little clarity. A lot of possibility.</span>
              <span>
                <Lock size={11} />
                {demo ? "Demo · Device-local data" : "Your private workspace"}
              </span>
            </footer>
          </main>
        )}
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {editor && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditor(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={editor.id ? "Edit opportunity" : "Add opportunity"}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">ONE MORE POSSIBILITY</div>
                <h2>{editor.id ? "Edit opportunity" : "Add an opportunity"}</h2>
              </div>
              <button
                className="icon-btn"
                aria-label="Close editor"
                onClick={() => setEditor(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveJob}>
              <div className="form-grid">
                <label>
                  Job title
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder="e.g. Frontend Developer"
                    value={editor.title}
                    onChange={(e) =>
                      setEditor({ ...editor, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Company
                  <input
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder="e.g. Linear"
                    value={editor.company}
                    onChange={(e) =>
                      setEditor({ ...editor, company: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Job description
                <textarea
                  required
                  minLength={20}
                  maxLength={30000}
                  rows={5}
                  placeholder="The role, responsibilities and requirements…"
                  value={editor.description}
                  onChange={(e) =>
                    setEditor({ ...editor, description: e.target.value })
                  }
                />
              </label>
              <label>
                Original job link <span className="optional">optional</span>
                <input
                  type="url"
                  placeholder="https://…"
                  value={editor.link}
                  onChange={(e) =>
                    setEditor({ ...editor, link: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Status
                  <select
                    value={editor.status}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        status: e.target.value,
                        appliedDate:
                          editor.appliedDate ||
                          (e.target.value === "Applied" ? today() : ""),
                      })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Application date
                  <input
                    type="date"
                    value={editor.appliedDate}
                    onChange={(e) =>
                      setEditor({ ...editor, appliedDate: e.target.value })
                    }
                  />
                </label>
                <label>
                  Follow-up date
                  <input
                    type="date"
                    value={editor.followUpDate}
                    onChange={(e) =>
                      setEditor({ ...editor, followUpDate: e.target.value })
                    }
                  />
                </label>
                <label>
                  Interview date
                  <input
                    type="date"
                    value={editor.interviewDate}
                    onChange={(e) =>
                      setEditor({ ...editor, interviewDate: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Personal notes <span className="optional">optional</span>
                <textarea
                  rows={3}
                  maxLength={10000}
                  placeholder="Anything you want to remember…"
                  value={editor.notes}
                  onChange={(e) =>
                    setEditor({ ...editor, notes: e.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </button>
                <button className="btn primary" disabled={busy}>
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  Save opportunity
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detail && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <section
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Opportunity details"
          >
            <div className="modal-header">
              <div className="job-cell">
                <Company name={detail.company} />
                <div>
                  <small>{detail.company}</small>
                  <h2>{detail.title}</h2>
                </div>
              </div>
              <button
                className="icon-btn"
                aria-label="Close details"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="detail-toolbar">
              <select
                className={"status-select " + detail.status.toLowerCase()}
                aria-label="Application status"
                value={detail.status}
                onChange={(e) => updateStatus(detail, e.target.value as Status)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button
                className="btn secondary"
                onClick={() => {
                  setEditor(detail);
                  setDetail(null);
                }}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                className="icon-btn danger"
                aria-label="Delete opportunity"
                onClick={() =>
                  setConfirm({
                    text: `Delete ${detail.title} at ${detail.company}? This also removes its notes.`,
                    action: () => deleteJob(detail),
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="detail-dates">
              <span>
                <small>APPLIED</small>
                {fmt(detail.appliedDate)}
              </span>
              <span>
                <small>FOLLOW-UP</small>
                {fmt(detail.followUpDate)}
              </span>
              <span>
                <small>INTERVIEW</small>
                {fmt(detail.interviewDate)}
              </span>
            </div>
            {detail.link && /^https?:\/\//.test(detail.link) && (
              <a
                className="text-btn"
                href={detail.link}
                target="_blank"
                rel="noreferrer"
              >
                Open original posting
                <ExternalLink size={14} />
              </a>
            )}
            <h3>Job description</h3>
            <p className="preserve detail-description">{detail.description}</p>
            {detail.notes && (
              <>
                <h3>Personal notes</h3>
                <p className="preserve">{detail.notes}</p>
              </>
            )}
            <button
              className="btn secondary full"
              onClick={() => {
                setJD(detail.description);
                setAnalysisTitle(detail.title + " at " + detail.company);
                setDetail(null);
                navigate("analysis");
              }}
            >
              <Sparkles size={16} />
              Analyze my CV for this role
            </button>
            <div className="form-divider" />
            <h3>Notes & updates</h3>
            <div className="note-form">
              <textarea
                rows={2}
                maxLength={5000}
                placeholder="Add an update or employer interaction…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                className="btn primary"
                disabled={busy || !note.trim()}
                onClick={addNote}
              >
                <Plus size={15} />
                Add note
              </button>
            </div>
            {notes.map((n) => (
              <div className="note-item" key={n.id}>
                <small>{fmt(n.createdAt)}</small>
                <p className="preserve">{n.body}</p>
              </div>
            ))}
          </section>
        </div>
      )}
      {confirm && (
        <div className="modal-overlay confirm-overlay">
          <section
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm deletion"
          >
            <span className="feature-icon warm">
              <AlertCircle size={25} />
            </span>
            <h2>Are you sure?</h2>
            <p>{confirm.text}</p>
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="btn danger-btn"
                onClick={() =>
                  run(async () => {
                    await confirm.action();
                    setConfirm(null);
                  })
                }
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
