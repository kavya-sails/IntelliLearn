import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  FileText,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Upload,
  X,
  Loader2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizItem = {
  id: number;
  question: string;
  options: string[];
  skill_tested_on: string;
};

type QuizResult = {
  question: string;
  options?: string[];
  answer: string;
  user_response: string;
  skill_tested_on: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusToStep = (status: string): number => {
  switch (status) {
    case "COLLECTING_GOAL":
    case "":
      return 1;
    case "COLLECTING_RESUME":
    case "PARSING_SKILLS":
      return 2;
    case "AWAITING_QUIZ":
    case "QUIZ_IN_PROGRESS":
      return 3;
    case "QUIZ_DONE":
    case "GAP_ANALYSIS_IN_PROGRESS":
    case "GAP_ANALYSIS_COMPLETE":
    case "GENERATING_PATH":
    case "LEARNING_PATH_COMPLETE":
      return 4;
    default:
      return 1;
  }
};

function normalizeQuiz(raw: unknown): QuizItem[] {
  const items = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.quiz as unknown[];
  if (!Array.isArray(items)) return [];
  return items
    .map((it, idx) => {
      if (!it || typeof it !== "object") return null;
      const r = it as Record<string, unknown>;
      const question = typeof r.question === "string" ? r.question : "";
      const options = Array.isArray(r.options) ? r.options.map(String) : [];
      const skill =
        typeof r.skill_tested_on === "string"
          ? r.skill_tested_on
          : typeof r.skill === "string"
          ? r.skill
          : "";
      if (!question || options.length === 0) return null;
      return {
        id: typeof r.id === "number" ? r.id : idx + 1,
        question,
        options,
        skill_tested_on: skill,
      } satisfies QuizItem;
    })
    .filter((x): x is QuizItem => x !== null);
}

function isMultiSelect(question: string) {
  const s = question.toLowerCase();
  return (
    s.includes("select all") ||
    s.includes("choose all") ||
    s.includes("select any") ||
    s.includes("choose any") ||
    s.includes("multiple answers") ||
    s.includes("more than one")
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Career Goal", icon: Target },
  { id: 2, label: "Resume", icon: FileText },
  { id: 3, label: "Assessment", icon: ClipboardList },
  { id: 4, label: "Gap Analysis", icon: BarChart3 },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                step.id < current
                  ? "gradient-primary border-primary text-primary-foreground"
                  : step.id === current
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground bg-background"
              )}
            >
              {step.id < current ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium text-center leading-tight",
                step.id === current
                  ? "text-primary"
                  : step.id < current
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-12 md:w-16 lg:w-24 mb-5 mx-1 transition-all duration-300",
                step.id < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Goal ─────────────────────────────────────────────────────────────

function GoalStep({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (goal: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [goal, setGoal] = useState("");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Target className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold">What's your career goal?</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Tell us where you want to be, and we'll build a personalized learning plan.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <label className="text-sm font-medium text-foreground">Career Goal</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Backend Engineer, Full-Stack Developer, Data Scientist, Cloud Architect..."
          className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all min-h-[100px] placeholder:text-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (goal.trim()) onSubmit(goal.trim());
            }
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          variant="gradient"
          className="w-full"
          disabled={!goal.trim() || isLoading}
          onClick={() => onSubmit(goal.trim())}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Continue
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Resume ───────────────────────────────────────────────────────────

function ResumeStep({
  onUpload,
  isLoading,
  error,
  goal,
}: {
  onUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  goal: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.name.toLowerCase().endsWith(".pdf")) {
      setFile(f);
    } else {
      alert("Only PDF files are supported.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <FileText className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Upload your resume</h2>
        <p className="text-muted-foreground text-sm mt-2">
          We'll analyze your skills based on your goal:{" "}
          <span className="font-medium text-foreground">{goal}</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/40"
          )}
          onClick={() => !file && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drag & drop your resume here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse — PDF only</p>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={() => setFile(null)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your resume and extracting skills…</p>
          </div>
        ) : (
          <Button
            variant="gradient"
            className="w-full"
            disabled={!file || isLoading}
            onClick={() => file && onUpload(file)}
          >
            Upload & Analyze
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Quiz ─────────────────────────────────────────────────────────────

type QuizPhase = "ready" | "loading" | "active" | "submitted";

function QuizStep({
  phase,
  quiz,
  quizSelections,
  quizResults,
  isLoading,
  error,
  onStartQuiz,
  onSelectOption,
  onSubmitQuiz,
  onViewGapAnalysis,
}: {
  phase: QuizPhase;
  quiz: QuizItem[];
  quizSelections: Record<number, number[]>;
  quizResults: QuizResult[];
  isLoading: boolean;
  error: string | null;
  onStartQuiz: () => void;
  onSelectOption: (qi: number, oi: number, multi: boolean) => void;
  onSubmitQuiz: () => void;
  onViewGapAnalysis: () => void;
}) {
  const allAnswered = quiz.every((_, qi) => (quizSelections[qi] ?? []).length > 0);

  if (phase === "ready" || phase === "loading") {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Skill Assessment</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Answer a few questions to gauge your current skill level.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center gap-5 text-center">
          {phase === "loading" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your personalized quiz…</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ready to test your knowledge? We'll ask you a set of multiple-choice questions
                based on the skills found in your resume.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button variant="gradient" onClick={onStartQuiz} className="px-8">
                Start Assessment
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Skill Assessment Quiz</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Select the correct option(s) for each question.
          </p>
        </div>

        <div className="space-y-4">
          {quiz.map((q, qi) => {
            const selected = quizSelections[qi] ?? [];
            const multi = isMultiSelect(q.question);
            return (
              <div key={qi} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold leading-relaxed">
                    {qi + 1}. {q.question}
                  </p>
                  {q.skill_tested_on && (
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {q.skill_tested_on}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected.includes(oi);
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => onSelectOption(qi, oi, multi)}
                        className={cn(
                          "w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-all flex items-start gap-2",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/40 hover:bg-secondary/60"
                        )}
                      >
                        <span className="shrink-0 mt-0.5 text-muted-foreground">
                          {multi ? (isSelected ? "▣" : "▢") : isSelected ? "◉" : "○"}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button
          variant="gradient"
          className="w-full"
          disabled={!allAnswered || isLoading}
          onClick={onSubmitQuiz}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit Quiz
        </Button>
      </div>
    );
  }

  // phase === "submitted" — show results
  const correctCount = quizResults.filter(
    (r) => r.user_response?.trim() === r.answer?.trim()
  ).length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
            correctCount / quizResults.length >= 0.6
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          <ClipboardList className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        <p className="text-muted-foreground text-sm mt-2">
          You answered{" "}
          <span className="font-semibold text-foreground">
            {correctCount} of {quizResults.length}
          </span>{" "}
          correctly.
        </p>
      </div>

      <div className="space-y-3">
        {quizResults.map((result, idx) => {
          const userAns = result.user_response?.trim();
          const correctAns = result.answer?.trim();
          const isCorrect = userAns === correctAns;
          return (
            <div
              key={idx}
              className={cn(
                "rounded-2xl border p-5 shadow-sm",
                isCorrect
                  ? "border-success/40 bg-success/5"
                  : "border-destructive/40 bg-destructive/5"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold">{idx + 1}. {result.question}</p>
                {result.skill_tested_on && (
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {result.skill_tested_on}
                  </span>
                )}
              </div>
              {result.options && (
                <div className="space-y-1 mb-2">
                  {result.options.map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const isUserAns = letter === userAns;
                    const isCorrectAns = letter === correctAns;
                    return (
                      <div
                        key={oi}
                        className={cn(
                          "text-sm px-3 py-1.5 rounded-lg",
                          isCorrectAns && "bg-success/20 text-success font-medium",
                          isUserAns && !isCorrectAns && "bg-destructive/20 text-destructive"
                        )}
                      >
                        {opt}
                        {isCorrectAns && " ✓ (Correct)"}
                        {isUserAns && !isCorrectAns && " (Your answer)"}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className={cn("text-sm font-medium", isCorrect ? "text-success" : "text-destructive")}>
                {isCorrect
                  ? "✓ Correct"
                  : `✗ Your answer: ${userAns} | Correct: ${correctAns}`}
              </p>
            </div>
          );
        })}
      </div>

      <Button variant="gradient" className="w-full" onClick={onViewGapAnalysis}>
        <BarChart3 className="h-4 w-4 mr-2" />
        View Gap Analysis
      </Button>
    </div>
  );
}

// ─── Main FlowPage ─────────────────────────────────────────────────────────────

const FlowPage = () => {
  const navigate = useNavigate();

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [goal, setGoal] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initDone, setInitDone] = useState(false);

  // Quiz state
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("ready");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizSelections, setQuizSelections] = useState<Record<number, number[]>>({});
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // ── On mount: restore session if exists ────────────────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const sid = localStorage.getItem("session_id");

    if (!userId || !sid) {
      setInitDone(true);
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/chat/${userId}/${sid}/status`).then((r) => r.json()),
      fetch(`${API_BASE}/chat/${userId}/${sid}/history`).then((r) => r.json()),
    ])
      .then(([statusData, historyData]) => {
        const status: string = statusData?.status ?? "";
        setSessionId(Number(sid));
        setSessionStatus(status);
        if (historyData?.goal) setGoal(historyData.goal);

        // If quiz was already submitted, we can show the "View Gap Analysis" step
        const step = statusToStep(status);
        if (step >= 4) {
          setQuizPhase("submitted");
        }
      })
      .catch(() => {
        localStorage.removeItem("session_id");
      })
      .finally(() => setInitDone(true));
  }, []);

  const currentStep = statusToStep(sessionStatus);

  // ── Step 1: Submit goal ────────────────────────────────────────────────────
  const handleSubmitGoal = async (goalText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem("user_id")!;

      // Create new session
      const createRes = await fetch(`${API_BASE}/chat/new?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
      });
      if (!createRes.ok) throw new Error("Failed to create session");
      const createData = await createRes.json();
      const sid: number = createData.session_id;

      localStorage.setItem("session_id", String(sid));
      setSessionId(sid);
      setGoal(goalText);

      // Set goal directly via new endpoint
      const goalRes = await fetch(`${API_BASE}/session/${encodeURIComponent(userId)}/${sid}/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalText),
      });
      if (!goalRes.ok) throw new Error("Failed to set goal");

      setSessionStatus("COLLECTING_RESUME");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit goal");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Upload resume ──────────────────────────────────────────────────
  const handleUploadResume = async (file: File) => {
    const userId = localStorage.getItem("user_id")!;
    const sid = sessionId!;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/chat/${userId}/${sid}/upload-resume`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Resume upload failed");
      }
      const data = await res.json();
      if (data?.status) setSessionStatus(data.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Resume upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3a: Start quiz ────────────────────────────────────────────────────
  const handleStartQuiz = async () => {
    const userId = localStorage.getItem("user_id")!;
    const sid = sessionId!;
    setQuizPhase("loading");
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sid)}/start_quiz`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to start quiz");
      const data = await res.json();

      // Extract quiz from response
      const rawQuiz = data.quiz && data.quiz.length > 0 ? data.quiz : data.message;
      const questions = normalizeQuiz(rawQuiz);

      if (questions.length === 0) throw new Error("No quiz questions returned. Please try again.");

      setQuiz(questions);
      setQuizSelections({});
      setSessionStatus("QUIZ_IN_PROGRESS");
      setQuizPhase("active");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start quiz");
      setQuizPhase("ready");
    }
  };

  // ── Step 3b: Select option ─────────────────────────────────────────────────
  const handleSelectOption = (qi: number, oi: number, multi: boolean) => {
    setQuizSelections((prev) => {
      const curr = prev[qi] ?? [];
      let next: number[];
      if (multi) {
        next = curr.includes(oi) ? curr.filter((x) => x !== oi) : [...curr, oi];
      } else {
        next = [oi];
      }
      return { ...prev, [qi]: next };
    });
  };

  // ── Step 3c: Submit quiz ───────────────────────────────────────────────────
  const handleSubmitQuiz = async () => {
    const userId = localStorage.getItem("user_id")!;
    const sid = sessionId!;
    setIsLoading(true);
    setError(null);
    try {
      const payload = quiz.map((q, qi) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        skill_tested_on: q.skill_tested_on,
        selected_options: (quizSelections[qi] ?? []).map((oi) => q.options[oi]).filter(Boolean),
      }));

      const res = await fetch(
        `${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sid)}/done_quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Quiz submission failed");

      const data = await res.json();
      const results: QuizResult[] = Array.isArray(data.message) ? data.message : [];
      setQuizResults(results);
      if (data?.status) setSessionStatus(data.status);
      setQuizPhase("submitted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Quiz submission failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 4: Navigate to gap analysis ──────────────────────────────────────
  const handleViewGapAnalysis = () => {
    const sid = sessionId || localStorage.getItem("session_id");
    navigate(`/app/skills/${sid}`);
  };

  // ── New session ────────────────────────────────────────────────────────────
  const handleNewSession = () => {
    localStorage.removeItem("session_id");
    setSessionId(null);
    setSessionStatus("");
    setGoal("");
    setError(null);
    setQuizPhase("ready");
    setQuiz([]);
    setQuizSelections({});
    setQuizResults([]);
  };

  // ── Loading init state ─────────────────────────────────────────────────────
  if (!initDone) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="flex-1 p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold gradient-text">IntelliLearn</h1>
              <p className="text-xs text-muted-foreground">Personalized skill development</p>
            </div>
            {sessionId && (
              <Button variant="outline" size="sm" onClick={handleNewSession} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                New Session
              </Button>
            )}
          </div>

          {/* Stepper */}
          <Stepper current={currentStep} />

          <div className="mt-8">
            {/* Step 1 */}
            {currentStep === 1 && (
              <GoalStep
                onSubmit={handleSubmitGoal}
                isLoading={isLoading}
                error={error}
              />
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <ResumeStep
                onUpload={handleUploadResume}
                isLoading={isLoading}
                error={error}
                goal={goal}
              />
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <QuizStep
                phase={quizPhase}
                quiz={quiz}
                quizSelections={quizSelections}
                quizResults={quizResults}
                isLoading={isLoading}
                error={error}
                onStartQuiz={handleStartQuiz}
                onSelectOption={handleSelectOption}
                onSubmitQuiz={handleSubmitQuiz}
                onViewGapAnalysis={handleViewGapAnalysis}
              />
            )}

            {/* Step 4: after quiz done, prompt gap analysis */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="text-center">
                  <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Ready for Gap Analysis</h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    Your quiz is complete. View your personalized skill gap analysis.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center gap-5 text-center">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    We've processed your quiz results. Click below to see your skill gaps,
                    strengths, and weaknesses — and generate your learning roadmap.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="gradient" onClick={handleViewGapAnalysis} className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      View Gap Analysis
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      {currentStep === 3 && quizPhase === "submitted" && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-6 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              After gap analysis, we'll generate your personalized learning roadmap.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowPage;
