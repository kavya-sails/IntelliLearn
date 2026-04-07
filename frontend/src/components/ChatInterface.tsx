import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, Upload, Sparkles, FileText, Map, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import aiAvatar from "@/assets/ai-avatar.png";
import WelcomeScreen from "./WelcomeScreen";
import { toast } from "@/hooks/use-toast";

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

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  quiz?: QuizItem[];
  quizResults?: QuizResult[];
  showStartQuizButton?: boolean;
  file?: {
    name: string;
    size: number;
    type: string;
  };
}

const suggestedPrompts = [
  { icon: FileText, text: "Analyze my resume", color: "text-primary" },
  { icon: Map, text: "Create learning roadmap", color: "text-success" },
  { icon: ClipboardCheck, text: "Start assessment", color: "text-accent" },
  { icon: Sparkles, text: "Suggest skills to learn", color: "text-warning" },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content: "👋 Hello! I'm your IntelliLearn AI assistant. I can analyze your resume, identify skill gaps, create personalized learning roadmaps, and help you prepare for assessments.\n\nHow can I help you today?",
    timestamp: new Date(),
  },
];

interface ChatInterfaceProps {
  showWelcome?: boolean;
}

const ChatInterface = ({ showWelcome = false }: ChatInterfaceProps) => {
  const navigate = useNavigate();
  const API_BASE = "http://localhost:8000/api";
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<string, number[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    let interval;
    const sessionId = localStorage.getItem("session_id");
    const userId = localStorage.getItem("user_id");

    if (sessionStatus === "GAP_ANALYSIS_IN_PROGRESS") {
      interval = setInterval(async () => {
        const res = await fetch(`${API_BASE}/chat/${userId}/${sessionId}/status`);
        const data = await res.json();

        setSessionStatus(data.status);

        if (data.status === "GAP_ANALYSIS_COMPLETE" || data.status === "LEARNING_PATH_COMPLETE" && !notified) {
          clearInterval(interval);
          toast({
            title: "Gap Analysis Ready 🎉",
            description: "You can now view your gap analysis.",
          });
          setNotified(true);
        }
      }, 2000);
  }

  return () => clearInterval(interval);
}, [sessionStatus]);

  const renderInline = (text: string) => {
    // Supports **bold** and markdown-style links: [label](/app/skills)
    const parts: React.ReactNode[] = [];
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    const renderBold = (s: string) =>
      s.split("**").map((part, k) => (k % 2 === 1 ? <strong key={`b-${k}`}>{part}</strong> : part));

    while ((m = linkRe.exec(text)) !== null) {
      const [full, label, href] = m;
      const start = m.index;
      if (start > lastIdx) {
        parts.push(<span key={`t-${lastIdx}`}>{renderBold(text.slice(lastIdx, start))}</span>);
      }
      parts.push(
        <Link key={`l-${start}`} to={href} className="underline underline-offset-2 font-medium hover:opacity-80">
          {label}
        </Link>
      );
      lastIdx = start + full.length;
    }

    if (lastIdx < text.length) {
      parts.push(<span key={`t-${lastIdx}`}>{renderBold(text.slice(lastIdx))}</span>);
    }

    return parts;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const sessionId = localStorage.getItem("session_id");
    const userId = localStorage.getItem("user_id");
    if (sessionId) {
      fetch(`${API_BASE}/chat/${userId}/${sessionId}/history`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            const historicalMessages: Message[] = data.messages.map((msg: { role: string; content: string; created_at?: string; meta?: Record<string, unknown> | null }, idx: number) => {
              const metaRec = msg.meta && typeof msg.meta === "object" ? msg.meta : null;
              const quiz = Array.isArray(metaRec?.quiz) ? (metaRec.quiz as QuizItem[]) : undefined;
              const quizResults = Array.isArray(metaRec?.quiz_results) ? (metaRec.quiz_results as QuizResult[]) : undefined;
              const message: Message = {
                id: `hist-${idx}`,
                role: msg.role === "user" ? "user" : "ai",
                content: msg.content,
                quiz,
                quizResults,
                timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
              };

              if (msg.meta && typeof msg.meta === "object") {
                const meta = msg.meta as Record<string, unknown>;
                if (meta.action === "generate_quiz" || meta.action === "quiz_response") {
                  const quizMatch = msg.content.match(/\{[^}]+\}/g);
                  if (quizMatch) {
                    try {
                      const parsed = JSON.parse(quizMatch.join(""));
                      if (Array.isArray(parsed)) {
                        message.quiz = parsed.map((q, qi) => ({
                          id: typeof q.id === "number" ? q.id : qi + 1,
                          question: q.question || "",
                          options: Array.isArray(q.options) ? q.options.map(String) : [],
                          skill: q.skill_tested_on || q.skill || "",
                        }));
                      }
                    } catch {
                      // ignore malformed historical payloads
                    }
                  }
                }
              }

              return message;
            });
            setMessages([...initialMessages, ...historicalMessages]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleStartChat = (type: string) => {
    setMessages([
      ...initialMessages,
      {
        id: Date.now().toString(),
        role: "user",
        content: type,
        timestamp: new Date(),
      },
    ]);
    setIsTyping(true);
    
    setTimeout(() => {
      const responses: Record<string, string> = {
        "Resume Analysis": "I'd love to help analyze your resume! Please upload your resume file (PDF, DOCX) using the upload button below, and I'll provide a comprehensive skill analysis.",
        "Learning Roadmap": "Great choice! I'll create a personalized learning roadmap for you. First, tell me about your career goals and current skill level.",
        "Skill Assessment": "Let's assess your skills! I'll create a personalized quiz based on your profile. What area would you like to be assessed on?",
        "AI Recommendations": "Based on current industry trends, I'd be happy to suggest skills to learn. What role are you targeting?",
      };
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: responses[type] || `I understand you want to ${type}. Let me help you with that!`,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  if (showWelcome) {
    return <WelcomeScreen onStartChat={handleStartChat} />;
  }

  const isMultiSelectQuestion = (q: string) => {
    const s = q.toLowerCase();
    return (
      s.includes("select all") ||
      s.includes("choose all") ||
      s.includes("select any") ||
      s.includes("choose any") ||
      s.includes("select two") ||
      s.includes("choose two") ||
      s.includes("multiple answers") ||
      s.includes("more than one")
    );
  };

  const handleStartQuiz = async () => {
    if (isTyping) return;
    const sessionId = localStorage.getItem("session_id");
    const userId = localStorage.getItem("user_id");
    if (!sessionId) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: "Yes",
        timestamp: new Date(),
      },
    ]);
    setIsTyping(true);
    try {
      const res = await fetch(`${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/start_quiz`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`start_quiz failed (${res.status})`);
      }
      const data = (await res.json()) as {
        session_id: number | string;
        status?: string;
        quiz?: QuizItem[];
        message?: unknown;
      };
      if (data.session_id != null) {
        localStorage.setItem("session_id", String(data.session_id));
      }

      const normalizeQuiz = (items: unknown): QuizItem[] => {
        if (!Array.isArray(items)) return [];
        return items
          .map((it, idx) => {
            if (!it || typeof it !== "object") return null;
            const anyIt = it as Record<string, unknown>;
            const question = typeof anyIt.question === "string" ? anyIt.question : "";
            const options = Array.isArray(anyIt.options)
              ? anyIt.options.map((o) => String(o))
              : [];
            const skill =
              typeof anyIt.skill === "string"
                ? anyIt.skill
                : typeof anyIt.skill_tested_on === "string"
                  ? anyIt.skill_tested_on
                  : "";
            if (!question || options.length === 0) return null;
            return {
              id: typeof anyIt.id === "number" ? anyIt.id : idx + 1,
              question,
              options,
              skill_tested_on: skill,
            } satisfies QuizItem;
          })
          .filter((x): x is QuizItem => x !== null);
      };

      const quiz =
        (data.quiz && data.quiz.length > 0 ? data.quiz : undefined) ??
        normalizeQuiz(data.message);

      const intro =
        quiz.length > 0
          ? `📝 **Skill Assessment Quiz**\n\nSelect ${quiz.some((q) => isMultiSelectQuestion(q.question)) ? "the correct option(s)" : "the correct option"} for each question.`
          : "📝 **Skill Assessment Quiz**\n\nNo questions were returned. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: intro,
          timestamp: new Date(),
          quiz: quiz.length > 0 ? quiz : undefined,
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Sorry — I couldn’t start the quiz. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content && !uploadedFile) return;

    const fileToUpload = uploadedFile;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content || (fileToUpload ? `Uploaded file: ${fileToUpload.name}` : ""),
      timestamp: new Date(),
      file: fileToUpload ? {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      } : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setUploadedFile(null);
    setIsTyping(true);

    try {
      // If only a file was provided (no typed message), call upload-resume endpoint.
      if (fileToUpload && !content) {
        const data = await uploadResumeToBackend(fileToUpload);
        const agentText = (data?.message || "").trim();

        const showStartQuiz = data?.status === "AWAITING_QUIZ";

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: agentText,
            timestamp: new Date(),
            showStartQuizButton: showStartQuiz,
          },
        ]);
        return;
      }

      const userId = localStorage.getItem("user_id") || undefined;
      const sessionId = localStorage.getItem("session_id") || undefined;

      const payload: { message: string; user_id?: string; session_id?: string } = {
        message: userMsg.content,
        user_id: userId,
      };
      if (sessionId) {
        payload.session_id = sessionId;
      }

      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data?.session_id) {
        localStorage.setItem("session_id", String(data.session_id));
      }

      if (data?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmitQuiz = async (quizMessage: Message) => {
    if (isTyping) return;
    const sessionId = localStorage.getItem("session_id");
    const userId = localStorage.getItem("user_id");
    if (!sessionId || !quizMessage.quiz || quizMessage.quiz.length === 0) return;

    const quiz_results = quizMessage.quiz.map((q, qi) => {
      const selKey = `${quizMessage.id}:${qi}`;
      const selectedIdx = quizSelections[selKey] ?? [];
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        skill_tested_on: q.skill_tested_on,
        selected_options: selectedIdx.map((oi) => q.options[oi]).filter(Boolean),
      };
    });

    setIsTyping(true);
    try {
      const res = await fetch(`${API_BASE}/chat/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}/done_quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz_results),
      });
      if (!res.ok) {
        throw new Error(`done_quiz failed (${res.status})`);
      }
      const rawData = await res.json();
      const data = rawData as { 
        session_id?: string | number; 
        message?: QuizResult[]; 
        status?: string 
      };
      if (data?.session_id != null) {
        localStorage.setItem("session_id", String(data.session_id));
      }

      let quizResults: QuizResult[] = [];
      let messageContent = "Quiz submitted.";
      
      if (Array.isArray(data?.message)) {
        quizResults = data.message;
        const correctCount = quizResults.filter(r => r.user_response === r.answer).length;
        messageContent = `You answered ${correctCount} out of ${quizResults.length} correctly!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: messageContent,
          timestamp: new Date(),
          quizResults,
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Sorry — I couldn't submit your quiz. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyzeGaps = () => {
    navigate("/skills");
  };

  const uploadResumeToBackend = async (file: File) => {
    const sessionId = localStorage.getItem("session_id");
    const userId = localStorage.getItem("user_id");
    if (!sessionId) {
      console.error("No session_id in localStorage; cannot upload resume.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/chat/${userId}/${sessionId}/upload-resume`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Resume upload failed with status ${res.status}`);
    }

    const data = await res.json();

    if (data?.session_id) {
      localStorage.setItem("session_id", String(data.session_id));
    }

    return data as {
      session_id: string;
      message?: string;
      status?: string;
      skills?: Array<{ skill_name: string; level: string }>;
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const fileExtension = file.name.toLowerCase().split('.').pop();

      if (allowedTypes.includes(file.type) || ['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a PDF or Word document (DOC, DOCX)');
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (allowedTypes.includes(file.type) || ['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a PDF or Word document (DOC, DOCX)');
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 mb-6 animate-fade-in",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {msg.role === "ai" && (
                <img src={aiAvatar} alt="AI" className="h-8 w-8 rounded-full shrink-0 mt-1 bg-secondary p-0.5" />
              )}
              <div className="max-w-[80%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  {msg.file && (
                    <div className="mb-2 p-2 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3" />
                        <span className="font-medium">{msg.file.name}</span>
                        <span className="text-muted-foreground">({(msg.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  )}
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={cn(line === "" && "h-2")}>
                      {renderInline(line)}
                    </p>
                  ))}
                </div>

                {msg.role === "ai" && msg.quiz && msg.quiz.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.quiz.map((q, qi) => {
                      const selKey = `${msg.id}:${qi}`;
                      const selected = quizSelections[selKey] ?? [];
                      const multi = isMultiSelectQuestion(q.question);
                      return (
                        <div key={selKey} className="rounded-xl border border-border bg-background/40 p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="text-sm font-medium">
                              {q.id}. {q.question}
                            </div>
                            {q.skill && (
                              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                                {q.skill}
                              </span>
                            )}
                          </div>
                          <div className="grid gap-2">
                            {q.options.map((opt, oi) => {
                              const isSelected = selected.includes(oi);
                              return (
                                <Button
                                  key={`${selKey}-${oi}`}
                                  type="button"
                                  variant={isSelected ? "secondary" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "justify-start whitespace-normal h-auto py-2 text-left",
                                    isSelected && "ring-1 ring-primary/40"
                                  )}
                                  onClick={() => {
                                    setQuizSelections((prev) => {
                                      const curr = prev[selKey] ?? [];
                                      let next: number[];
                                      if (multi) {
                                        next = curr.includes(oi) ? curr.filter((x) => x !== oi) : [...curr, oi];
                                      } else {
                                        next = [oi];
                                      }
                                      return { ...prev, [selKey]: next };
                                    });
                                  }}
                                >
                                  <span
                                    className={cn(
                                      "mr-2 mt-0.5",
                                      isSelected ? "text-primary" : "text-muted-foreground"
                                    )}
                                  >
                                    {multi ? (isSelected ? "▣" : "▢") : isSelected ? "◉" : "○"}
                                  </span>
                                  <span>{opt}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {(() => {
                      const allAnswered = msg.quiz.every((_, qi) => {
                        const selKey = `${msg.id}:${qi}`;
                        return (quizSelections[selKey] ?? []).length > 0;
                      });

                      return (
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="gradient"
                            size="sm"
                            type="button"
                            disabled={!allAnswered || isTyping}
                            onClick={() => handleSubmitQuiz(msg)}
                          >
                            Submit Quiz
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {msg.role === "ai" && msg.quizResults && msg.quizResults.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.quizResults.map((result, idx) => {
                      const userAnswer = result.user_response?.trim() || result.user_response;
                      const correctAnswer = result.answer?.trim() || result.answer;
                      const isCorrect = userAnswer === correctAnswer;
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "rounded-xl border p-3",
                            isCorrect 
                              ? "border-green-500/50 bg-green-500/10" 
                              : "border-red-500/50 bg-red-500/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="text-sm font-medium">
                              {idx + 1}. {result.question}
                            </div>
                            {result.skill_tested_on && (
                              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                                {result.skill_tested_on}
                              </span>
                            )}
                          </div>
                          {result.options && (
                            <div className="mb-2 space-y-1">
                              {result.options.map((opt, optIdx) => {
                                const optLetter = String.fromCharCode(65 + optIdx);
                                const isUserAnswer = optLetter === userAnswer;
                                const isCorrectAnswer = optLetter === correctAnswer;
                                return (
                                  <div 
                                    key={optIdx}
                                    className={cn(
                                      "text-sm px-2 py-1 rounded",
                                      isCorrectAnswer && "bg-green-100 text-green-800 font-medium",
                                      isUserAnswer && !isCorrectAnswer && "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {opt}
                                    {isCorrectAnswer && " ✓ (Correct)"}
                                    {isUserAnswer && !isCorrectAnswer && " (Your answer)"}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className={cn(
                            "text-sm font-medium",
                            isCorrect ? "text-green-600" : "text-red-600"
                          )}>
                            {isCorrect ? "✓ Correct" : `✗ Your answer: ${userAnswer} | Correct: ${correctAnswer}`}
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="gradient"
                        size="sm"
                        type="button"
                        disabled={isTyping || sessionStatus === "GAP_ANALYSIS_IN_PROGRESS"}
                        onClick={handleAnalyzeGaps}
                      >
                        View your gap analysis
                      </Button>
                    </div>
                  </div>
                )}

                {msg.role === "ai" &&
                  !msg.quiz &&
                  (msg.showStartQuizButton) && (
                    <div className="mt-3 flex gap-2">
                      <Button variant="gradient" size="sm" onClick={handleStartQuiz} disabled={isTyping}>
                        Yes
                      </Button>
                    </div>
                  )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-1 text-primary-foreground text-xs font-bold">
                  U
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 mb-6 animate-fade-in">
              <img src={aiAvatar} alt="AI" className="h-8 w-8 rounded-full shrink-0 mt-1 bg-secondary p-0.5" />
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-4">
                <div className="flex gap-1.5">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Prompts */}
      {showSuggestions && (
        <div className="max-w-3xl mx-auto px-4 pb-4 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt.text}
                onClick={() => handleSend(prompt.text)}
                className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 text-center group"
              >
                <prompt.icon className={cn("h-5 w-5", prompt.color, "group-hover:scale-110 transition-transform")} />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {prompt.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div
          className={cn(
            "max-w-3xl mx-auto relative",
            isDragOver && "ring-2 ring-primary ring-offset-2 rounded-2xl"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm focus-within:border-primary/50 focus-within:shadow-md transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
            </Button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Upload your resume or ask anything..."
              className="flex-1 resize-none bg-transparent border-0 outline-none text-sm py-2 max-h-32 min-h-[40px] placeholder:text-muted-foreground"
              rows={1}
            />
            <Button
              variant="gradient"
              size="icon"
              className="shrink-0"
              onClick={() => handleSend()}
              disabled={!input.trim() && !uploadedFile}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {uploadedFile && (
            <div className="max-w-3xl mx-auto mt-2">
              <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium flex-1">{uploadedFile.name}</span>
                <span className="text-xs text-muted-foreground">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={removeFile}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground mt-2">
            IntelliLearn AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
