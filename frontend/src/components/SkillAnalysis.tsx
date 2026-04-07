import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart3, Sparkles } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API_BASE = "http://localhost:8000/api";

type SkillGapSkill = {
  name: string;
  score: number; // 0-100
  status: "strength" | "missing" | "medium" | string;
};

export type SkillGapAnalysisData = {
  overall_score: number; // 0-100
  skills: SkillGapSkill[];
  strengths?: string[];
  weaknesses?: string[];
  missing_skills?: string[];
  overestimated_skills?: string[];
  goal?: string;
  readiness_level?: string;
};

const DEMO_DATA: SkillGapAnalysisData = {
  overall_score: 64,
  skills: [
    { name: "Java", score: 100, status: "strength" },
    { name: "Spring Boot", score: 100, status: "strength" },
    { name: "Hibernate", score: 100, status: "strength" },
    { name: "MySQL", score: 100, status: "strength" },
    { name: "Git", score: 100, status: "strength" },
    { name: "REST APIs", score: 0, status: "missing" },
    { name: "HTML", score: 0, status: "missing" },
    { name: "CSS", score: 0, status: "missing" },
    { name: "JavaScript", score: 0, status: "missing" },
    { name: "Docker", score: 0, status: "missing" },
    { name: "Unit Testing", score: 0, status: "missing" },
    { name: "Cloud", score: 0, status: "missing" },
  ],
  strengths: ["Java", "Spring Boot", "Hibernate", "MySQL", "Git"],
  weaknesses: ["CSS", "JavaScript"],
  missing_skills: ["REST APIs", "HTML", "Docker", "Unit Testing", "Cloud"],
  overestimated_skills: ["AWS"],
  goal: "Backend Engineer",
  readiness_level: "medium",
};

function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function readinessLabel(score: number) {
  if (score >= 80) return { text: "High Readiness", tone: "success" as const };
  if (score >= 40) return { text: "Medium Readiness", tone: "warning" as const };
  return { text: "Low Readiness", tone: "destructive" as const };
}

function toneClasses(tone: "strength" | "medium" | "missing") {
  return cn(
    "text-xs px-2.5 py-1 rounded-full font-medium",
    tone === "strength" && "bg-success/10 text-success",
    tone === "medium" && "bg-warning/10 text-warning",
    tone === "missing" && "bg-destructive/10 text-destructive"
  );
}

function pillToneClasses(tone: "strength" | "weakness" | "missing" | "overestimated") {
  return cn(
    "text-xs px-2.5 py-1 rounded-full font-medium",
    tone === "strength" && "bg-success/10 text-success",
    tone === "weakness" && "bg-warning/10 text-warning",
    tone === "missing" && "bg-destructive/10 text-destructive",
    tone === "overestimated" && "bg-primary/10 text-primary"
  );
}

function toneColor(score: number) {
  if (score >= 80) return "hsl(145, 65%, 42%)"; // green
  if (score >= 40) return "hsl(40, 95%, 55%)"; // yellow
  return "hsl(0, 72%, 55%)"; // red
}

function ProgressBar({ value }: { value: number }) {
  const v = clampScore(value);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Overall Readiness Score</div>
        <div className="text-sm font-semibold">{v}%</div>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${v}%`, backgroundColor: toneColor(v) }}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CategoryList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "strength" | "weakness" | "missing" | "overestimated";
  items: string[];
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className={pillToneClasses(tone)}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((name) => (
            <div
              key={name}
              className="group flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 hover:shadow-sm transition"
            >
              <span className={pillToneClasses(tone)}>
                {tone === "strength"
                  ? "Strength"
                  : tone === "weakness"
                    ? "Weakness"
                    : tone === "overestimated"
                      ? "Overestimated"
                      : "Missing"}
              </span>
              <span className="text-sm font-medium">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightText({ data }: { data: SkillGapAnalysisData }) {
  const strengths = (data.strengths && data.strengths.length > 0) ? data.strengths : [];
  const missing = (data.missing_skills && data.missing_skills.length > 0) ? data.missing_skills : [];

  const backendSignals = ["Python", "Django", "FastAPI", "PostgreSQL", "SQL", "Git"];
  const frontendSignals = ["HTML", "CSS", "JavaScript", "React"];
  const cloudSignals = ["Docker", "Cloud", "AWS", "Azure", "GCP", "Kubernetes"];

  const strongBackend = strengths.some((s) => backendSignals.includes(s));
  const missingFrontend = missing.some((s) => frontendSignals.includes(s));
  const missingCloud = missing.some((s) => cloudSignals.includes(s));

  const sentence =
    strongBackend && (missingFrontend || missingCloud)
      ? `You are strong in backend development but missing ${[missingFrontend ? "frontend" : null, missingCloud ? "cloud" : null]
          .filter(Boolean)
          .join(" and ")} skills.`
      : "Keep strengthening core skills while closing the largest gaps first.";

  return (
    <div className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-1">Insight</h3>
          <p className="text-sm opacity-90">{sentence}</p>
        </div>
      </div>
    </div>
  );
}

function buildChart(data: SkillGapAnalysisData) {
  const skills = data.skills ?? [];
  const labels = skills.map((s) => s.name);
  const scores = skills.map((s) => clampScore(s.score));
  const colors = scores.map((v) => toneColor(v));

  return {
    labels,
    datasets: [
      {
        label: "Score",
        data: scores,
        backgroundColor: colors,
        borderRadius: 10,
        borderSkipped: false as const,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };
}

const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (items: TooltipItem<"bar">[]) => items[0]?.label ?? "",
        label: (item) => `Score: ${item.parsed.y}/100`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "hsl(215, 20%, 45%)", font: { size: 12 } },
    },
    y: {
      min: 0,
      max: 100,
      ticks: { stepSize: 20, color: "hsl(215, 20%, 45%)", font: { size: 12 } },
      grid: { color: "hsl(220, 15%, 90%)" },
    },
  },
};

function normalizeGapAnalysisFromApi(raw: unknown): SkillGapAnalysisData | null {
  const asRecord = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : null;

  const root = asRecord(raw);
  if (!root) return null;

  const analysis = asRecord(root.analysis) ?? root;
  const a = asRecord(analysis);
  if (!a) return null;

  const goal = typeof a.goal === "string" ? a.goal : undefined;

  const metrics = asRecord(a.metrics);
  const overallFromMetrics = metrics && typeof metrics.overall_score === "number" ? metrics.overall_score : undefined;
  const readiness_level = metrics && typeof metrics.readiness_level === "string" ? metrics.readiness_level : undefined;

  const summary = asRecord(a.summary);
  const readStringArray = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : undefined);

  const strengths = summary ? readStringArray(summary.strengths) : undefined;
  const weaknesses = summary ? readStringArray(summary.weaknesses) : undefined;
  const missing_skills = summary ? readStringArray(summary.missing_skills) : undefined;
  const overestimated_skills = summary ? readStringArray(summary.overestimated_skills) : undefined;

  const skillsAnalysisRaw = a.skills_analysis;
  const skills_analysis = Array.isArray(skillsAnalysisRaw) ? skillsAnalysisRaw : [];

  const skills: SkillGapSkill[] = skills_analysis
    .map((row) => {
      const r = asRecord(row);
      if (!r) return null;
      const name = String(r.skill ?? r.name ?? "").trim();
      if (!name) return null;

      const statusRaw = String(r.status ?? "").trim();
      const scoreRaw = r.score;
      const score =
        typeof scoreRaw === "number"
          ? scoreRaw
          : statusRaw === "strength"
            ? 100
            : statusRaw === "supporting_skill"
              ? 60
              : statusRaw === "overestimated_skill"
                ? 0
                : statusRaw === "missing_skill"
                  ? 0
                  : 0;

      const statusTone =
        statusRaw === "strength"
          ? "strength"
          : score >= 80
            ? "strength"
            : score >= 40
              ? "medium"
              : "missing";

      return { name, score, status: statusTone } satisfies SkillGapSkill;
    })
    .filter((x): x is SkillGapSkill => x !== null);

  const overall_score =
    typeof overallFromMetrics === "number"
      ? overallFromMetrics
      : skills.length > 0
        ? Math.round(skills.reduce((acc, s) => acc + clampScore(s.score), 0) / skills.length)
        : 0;

  return {
    goal,
    readiness_level,
    overall_score,
    skills,
    strengths,
    weaknesses,
    missing_skills,
    overestimated_skills,
  };
}

function readGapAnalysisFromStorage(): SkillGapAnalysisData | null {
  try {
    const raw = localStorage.getItem("gap_analysis");
    if (!raw) return null;
    return normalizeGapAnalysisFromApi(JSON.parse(raw));
  } catch {
    return null;
  }
}

const PENDING_STATUSES = new Set([
  "QUIZ_DONE",
  "GAP_ANALYSIS_IN_PROGRESS",
]);

const READY_STATUSES = new Set([
  "GAP_ANALYSIS_COMPLETE",
  "LEARNING_PATH_COMPLETE",
]);

const SkillAnalysis = ({ data }: { data?: SkillGapAnalysisData }) => {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const storageData = useMemo(() => readGapAnalysisFromStorage(), []);
  const [serverData, setServerData] = useState<SkillGapAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchGapAnalysis = (userId: string, sessionId: string) => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/gap_analysis`)
      .then((r) => {
        if (!r.ok) throw new Error(`gap_analysis failed (${r.status})`);
        return r.json();
      })
      .then((json) => {
        const normalized = normalizeGapAnalysisFromApi(json);
        if (normalized) setServerData(normalized);
        else setError("Gap analysis response was not recognized.");
      })
      .catch((e) => setError(e?.message || "Failed to load gap analysis."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const sessionId = sessionIdParam || localStorage.getItem("session_id");
    if (!userId || !sessionId) return;

    // First check current status
    fetch(`${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/status`)
      .then((r) => r.json())
      .then((d) => {
        const status: string = d.status ?? "";
        setAnalysisStatus(status);

        if (READY_STATUSES.has(status)) {
          fetchGapAnalysis(userId, sessionId);
        } else if (PENDING_STATUSES.has(status)) {
          // Poll until ready
          pollRef.current = setInterval(() => {
            fetch(`${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/status`)
              .then((r) => r.json())
              .then((pd) => {
                const ps: string = pd.status ?? "";
                setAnalysisStatus(ps);
                if (READY_STATUSES.has(ps)) {
                  stopPolling();
                  fetchGapAnalysis(userId, sessionId);
                }
              })
              .catch(console.error);
          }, 3000);
        }
      })
      .catch(console.error);

    return () => stopPolling();
  }, [sessionIdParam]);

  // Show pending state while analysis is being generated
  const isPending = sessionIdParam && analysisStatus !== null && PENDING_STATUSES.has(analysisStatus) && !serverData;

  if (isPending) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center animate-pulse">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Analyzing your skill gaps…</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            We're processing your quiz results and building your personalized gap analysis. This usually takes a few seconds.
          </p>
          <div className="flex gap-1.5 mt-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  const resolved = data ?? serverData ?? storageData ?? DEMO_DATA;

  const overall = clampScore(resolved.overall_score ?? 0);
  const readiness = readinessLabel(overall);

  const strengthsList = resolved.strengths ?? [];
  const weaknessesList = resolved.weaknesses ?? [];
  const missingList = resolved.missing_skills ?? [];
  const overestimatedList = resolved.overestimated_skills ?? [];

  const chartData = buildChart(resolved);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Skill Gap Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Dashboard view of your current readiness</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <BarChart3 className="h-4 w-4" />
          Product Insights
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", {
                  "bg-success": readiness.tone === "success",
                  "bg-warning": readiness.tone === "warning",
                  "bg-destructive": readiness.tone === "destructive",
                })}
              />
              <h3 className="font-semibold">Readiness</h3>
            </div>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                readiness.tone === "success" && "bg-success/10 text-success",
                readiness.tone === "warning" && "bg-warning/10 text-warning",
                readiness.tone === "destructive" && "bg-destructive/10 text-destructive"
              )}
            >
              {readiness.text}
            </span>
          </div>

          <ProgressBar value={overall} />

          {resolved.goal && (
            <div className="mt-3 text-sm text-muted-foreground">
              Goal: <span className="font-medium text-foreground">{resolved.goal}</span>
            </div>
          )}
          {loading && <div className="mt-3 text-sm text-muted-foreground">Loading latest analysis…</div>}
          {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Summary</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { label: "Strengths", value: strengthsList.length, pill: "strength" as const },
              { label: "Weaknesses", value: weaknessesList.length, pill: "weakness" as const },
              { label: "Missing", value: missingList.length, pill: "missing" as const },
              { label: "Overestimated", value: overestimatedList.length, pill: "overestimated" as const },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{x.label}</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-lg font-bold">{x.value}</div>
                  <span className={pillToneClasses(x.pill)}>{x.pill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InsightText data={resolved} />

      <ChartCard title="Skill Scores (0–100)">
        <div className="h-[360px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm text-muted-foreground">
          {[
            { label: "Strength (80–100)", color: "bg-success" },
            { label: "Medium (40–79)", color: "bg-warning" },
            { label: "Missing (0–39)", color: "bg-destructive" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", item.color)} />
              {item.label}
            </div>
          ))}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryList title="Strengths" tone="strength" items={strengthsList} />
        <CategoryList title="Weaknesses" tone="weakness" items={weaknessesList} />
        <CategoryList title="Missing Skills" tone="missing" items={missingList} />
        <CategoryList title="Overestimated Skills" tone="overestimated" items={overestimatedList} />
      </div>
    </div>
  );
};

export default SkillAnalysis;
