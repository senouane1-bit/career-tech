export const statuses = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;
export type Status = (typeof statuses)[number];
export type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  link: string;
  status: Status;
  appliedDate: string;
  followUpDate: string;
  interviewDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
export type CV = {
  id: string;
  name: string;
  size: number;
  sha256: string;
  createdAt: string;
  data?: string;
};
export type Requirement = {
  requirement: string;
  weight: number;
  status: "demonstrated" | "unsupported" | "not_clearly_described";
  evidence: string;
  explanation: string;
};
export type Report = {
  summary: string;
  category: string;
  score: number;
  scoreExplanation: string;
  requirements: Requirement[];
  relevantExperience: { title: string; evidence: string; relevance: string }[];
  suggestions: {
    section: string;
    suggestion: string;
    rationale: string;
    evidence: string;
  }[];
  disclaimer: string;
};
export type Analysis = {
  id: string;
  title: string;
  jobDescription: string;
  cvId: string;
  cvName: string;
  cvHash: string;
  report: Report;
  createdAt: string;
  model: string;
};
export type Activity = { id: string; message: string; createdAt: string };
export type Note = { id: string; body: string; createdAt: string };
export type User = {
  id: string;
  name: string;
  email: string;
  monthlyGoal: number;
};
export type Store = {
  user: User;
  jobs: Job[];
  cv: CV | null;
  analyses: Analysis[];
  activities: Activity[];
  notes: Record<string, Note[]>;
};
export const sampleJD =
  "We are looking for a Frontend Developer with React, Next.js, TypeScript, REST API integration, and PostgreSQL experience. You will build accessible interfaces, collaborate with designers, and explain your technical contributions. A degree in Computer Science or equivalent experience is preferred.";
export const sampleText =
  "Sara Morgan — Junior Full Stack Developer. BSc Computer Science, 2025. Built a job board with React, Next.js, and TypeScript. Developed REST APIs with Express.js. Collaborated with a designer to improve navigation. Built reusable components and wrote project documentation.";
export const sampleReport: Report = {
  category: "Strong Match",
  score: 86,
  summary:
    "The fictional CV demonstrates React, Next.js, TypeScript and REST API experience through a practical job-board project. Express.js provides relevant evidence of Node.js development. PostgreSQL experience is not clearly documented and cannot be confirmed.",
  scoreExplanation:
    "12 of 14 weighted points are supported by CV evidence. Core framework requirements receive 3 points, API experience 2, and education 1. PostgreSQL receives 0 of 2 points because it is unconfirmed. This is documented alignment, not a prediction of hiring success.",
  requirements: [
    {
      requirement: "React and Next.js",
      weight: 3,
      status: "demonstrated",
      evidence: "Built a job board with React, Next.js, and TypeScript.",
      explanation:
        "The project explicitly names both requested frontend technologies.",
    },
    {
      requirement: "TypeScript",
      weight: 3,
      status: "demonstrated",
      evidence: "Built a job board with React, Next.js, and TypeScript.",
      explanation: "TypeScript is directly supported by the described project.",
    },
    {
      requirement: "REST API integration",
      weight: 2,
      status: "demonstrated",
      evidence: "Developed REST APIs with Express.js.",
      explanation:
        "API development is documented. Clarifying how the frontend consumed these APIs would strengthen this evidence.",
    },
    {
      requirement: "Collaboration with designers",
      weight: 3,
      status: "demonstrated",
      evidence: "Collaborated with a designer to improve navigation.",
      explanation: "The CV gives a specific example of design collaboration.",
    },
    {
      requirement: "Computer Science degree",
      weight: 1,
      status: "demonstrated",
      evidence: "BSc Computer Science, 2025.",
      explanation: "The education requirement is directly demonstrated.",
    },
    {
      requirement: "PostgreSQL",
      weight: 2,
      status: "not_clearly_described",
      evidence: "",
      explanation:
        "PostgreSQL is not mentioned. This does not mean the candidate lacks this skill; the document does not confirm it.",
    },
  ],
  relevantExperience: [
    {
      title: "Full stack job-board project",
      evidence: "Built a job board with React, Next.js, and TypeScript.",
      relevance:
        "Directly relevant to the required interface development stack.",
    },
    {
      title: "API development",
      evidence: "Developed REST APIs with Express.js.",
      relevance:
        "Express.js is part of the Node.js ecosystem and supports the backend collaboration expected in this role.",
    },
  ],
  suggestions: [
    {
      section: "Projects",
      suggestion:
        "Group the React, Next.js and TypeScript work under a clearly named project, and explain your personal contribution.",
      rationale: "This makes the existing technical evidence easier to find.",
      evidence: "Built a job board with React, Next.js, and TypeScript.",
    },
    {
      section: "Experience",
      suggestion:
        "Explain the REST endpoints you developed and how they were used. Add PostgreSQL only if you actually used it.",
      rationale:
        "The API work is relevant, while database technology is currently unconfirmed.",
      evidence: "Developed REST APIs with Express.js.",
    },
  ],
  disclaimer:
    "Fictional demonstration report, not a live AI response. Unconfirmed does not mean unqualified. Never add experience or qualifications you do not possess.",
};
export function seed(): Store {
  const now = new Date();
  const d = (offset: number) =>
    new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10);
  const defs: [string, string, Status, number][] = [
    ["Frontend Developer", "Linear", "Interview", -3],
    ["Product Engineer", "Notion", "Applied", -5],
    ["Full Stack Developer", "Vercel", "Saved", -1],
    ["Software Engineer", "Stripe", "Applied", -7],
    ["UI Engineer", "Figma", "Offer", -10],
    ["Frontend Engineer", "Framer", "Rejected", -14],
  ];
  const jobs = defs.map(([title, company, status, offset], i) => ({
    id: "demo-job-" + i,
    title,
    company,
    status,
    description: sampleJD,
    link: "",
    notes:
      i === 0
        ? "Discuss the job-board project and prepare questions about the team."
        : "",
    appliedDate: status === "Saved" ? "" : d(offset),
    followUpDate: status === "Applied" ? d(i === 1 ? 1 : 3) : "",
    interviewDate: status === "Interview" ? d(2) : "",
    createdAt: d(offset) + "T09:00:00Z",
    updatedAt: d(offset) + "T09:00:00Z",
  }));
  return {
    user: {
      id: "demo",
      name: "Sara Morgan",
      email: "sara@example.com",
      monthlyGoal: 12,
    },
    jobs,
    cv: {
      id: "demo-cv",
      name: "Sara_Morgan_CV.pdf",
      size: 68422,
      sha256: "fictional-sample-v1",
      createdAt: d(-5) + "T10:00:00Z",
    },
    analyses: [
      {
        id: "demo-report",
        title: "Frontend Developer",
        jobDescription: sampleJD,
        cvId: "demo-cv",
        cvName: "Sara_Morgan_CV.pdf",
        cvHash: "fictional-sample-v1",
        report: sampleReport,
        model: "Fictional sample — no model called",
        createdAt: d(-2) + "T11:00:00Z",
      },
    ],
    activities: jobs
      .slice(0, 4)
      .map((j, i) => ({
        id: "activity-" + i,
        message: `${j.status === "Saved" ? "Saved" : "Updated"} ${j.title} at ${j.company}${j.status === "Saved" ? "" : ` to ${j.status}`}`,
        createdAt: j.updatedAt,
      })),
    notes: {},
  };
}
export const blankJob = (): Omit<Job, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  company: "",
  description: "",
  link: "",
  status: "Saved",
  appliedDate: "",
  followUpDate: "",
  interviewDate: "",
  notes: "",
});
