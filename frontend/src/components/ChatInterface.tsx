import { useState, useRef, useEffect } from "react";
import { Send, Upload, Sparkles, FileText, Map, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import aiAvatar from "@/assets/ai-avatar.png";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
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

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        "Analyze my resume": "I'd love to help analyze your resume! Please upload your resume file (PDF, DOCX) using the upload button below, and I'll provide a comprehensive skill analysis with:\n\n📊 **Skill Extraction** — Technologies & frameworks identified\n📈 **Proficiency Assessment** — Estimated levels for each skill\n🎯 **Gap Analysis** — Missing skills for your target role\n📋 **Recommendations** — Personalized improvement plan",
        "Create learning roadmap": "Great choice! Based on your profile, here's what I can create:\n\n🗺️ **Personalized Learning Roadmap**\n\n**Week 1-2:** Core Java & OOP fundamentals\n**Week 3-4:** Spring Boot & REST APIs\n**Week 5-6:** Database & SQL optimization\n**Week 7-8:** System Design basics\n\nEach week includes curated tutorials, practice problems, and mini-projects. Want me to customize this for a specific role?",
        "Start assessment": "Let's assess your skills! I'll create a personalized quiz based on your profile.\n\n📝 **Available Assessments:**\n1. Java Fundamentals (15 questions)\n2. Spring Boot (10 questions)\n3. SQL & Databases (12 questions)\n4. Full Stack Assessment (25 questions)\n\nWhich assessment would you like to start?",
        "Suggest skills to learn": "Based on current industry trends, here are my top recommendations:\n\n🔥 **High Demand Skills:**\n- **System Design** — Essential for senior roles\n- **Cloud (AWS/GCP)** — 78% of job postings require it\n- **Docker & Kubernetes** — DevOps is critical\n- **TypeScript** — Growing rapidly in frontend\n\n💡 **Emerging Skills:**\n- AI/ML fundamentals\n- GraphQL\n- Rust (systems programming)\n\nWant me to create a learning plan for any of these?",
      };

      const response = aiResponses[content] ||
        `I understand you're asking about "${content}". Let me help you with that!\n\nI can assist with:\n- **Resume analysis** and skill extraction\n- **Personalized learning paths** based on your goals\n- **Practice assessments** to test your knowledge\n- **Progress tracking** and recommendations\n\nCould you be more specific about what you'd like to explore?`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: response,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1500);
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
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                )}
              >
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={cn(line === "" && "h-2")}>
                    {line.split("**").map((part, k) =>
                      k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                    )}
                  </p>
                ))}
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
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        >
          <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm focus-within:border-primary/50 focus-within:shadow-md transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-primary"
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
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            IntelliLearn AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
