import { Brain, FileText, Map, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStartChat: (type: string) => void;
}

const features = [
  { icon: FileText, title: "Resume Analysis", desc: "Upload your resume for AI-powered skill extraction" },
  { icon: Map, title: "Learning Roadmap", desc: "Get personalized learning paths based on your goals" },
  { icon: ClipboardCheck, title: "Skill Assessment", desc: "Test your knowledge with interactive quizzes" },
  { icon: Sparkles, title: "AI Recommendations", desc: "Discover skills and courses tailored to you" },
];

const WelcomeScreen = ({ onStartChat }: WelcomeScreenProps) => {
  const userId = localStorage.getItem("user_id");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="h-12 w-12 text-primary" />
          <span className="text-4xl font-bold gradient-text">Welcome to IntelliLearn</span>
        </div>
        
        <p className="text-lg text-muted-foreground">
          Your AI-powered learning companion that analyzes your skills, 
          creates personalized roadmaps, and helps you become industry-ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {features.map((feature, i) => (
            <button
              key={i}
              onClick={() => onStartChat(feature.title)}
              className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground mb-4">Or start a conversation...</p>
          <textarea
            placeholder="Tell me about your career goals or what you'd like to learn..."
            className="w-full max-w-lg h-24 resize-none bg-card border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                const target = e.target as HTMLTextAreaElement;
                if (target.value.trim()) {
                  onStartChat(target.value);
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-2">Press Ctrl+Enter to send</p>
        </div>

        {userId && (
          <p className="text-xs text-muted-foreground pt-4">
            Logged in as user #{userId}
          </p>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;