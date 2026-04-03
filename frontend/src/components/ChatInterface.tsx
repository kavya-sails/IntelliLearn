import { useState, useRef, useEffect } from "react";
import { Send, Upload, Sparkles, FileText, Map, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import aiAvatar from "@/assets/ai-avatar.png";
import WelcomeScreen from "./WelcomeScreen";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
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
  const API_BASE = "http://localhost:8000/api";
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

        const skills = data?.skills ?? [];
        const skillLines =
          skills.length > 0
            ? skills
                .map((s) => {
                  const level = (s.level || "").trim();
                  const levelPretty = level ? level[0].toUpperCase() + level.slice(1) : "Unknown";
                  return `- **${s.skill_name}** — ${levelPretty}`;
                })
                .join("\n")
            : "- No skills were extracted.";

        const agentText = [
          "📄 **Here are your skills extracted from your resume:**",
          "",
          skillLines,
          "",
          (data?.message || "").trim(),
        ]
          .filter(Boolean)
          .join("\n");

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: agentText,
            timestamp: new Date(),
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

  const uploadResumeToBackend = async (file: File) => {
    const sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      console.error("No session_id in localStorage; cannot upload resume.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/chat/upload-resume?session_id=${encodeURIComponent(sessionId)}`, {
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
                      {line.split("**").map((part, k) =>
                        k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>

                {msg.role === "ai" &&
                  /are you ready to start the skill assessment quiz\\?/i.test(msg.content) && (
                    <div className="mt-3 flex gap-2">
                      <Button variant="gradient" size="sm" onClick={() => handleSend("Yes")}>
                        Yes
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSend("No")}>
                        No
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
