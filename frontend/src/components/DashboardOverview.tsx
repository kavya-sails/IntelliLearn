import { BarChart3, BookOpen, ClipboardCheck, TrendingUp, Sparkles, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const quickStats = [
  { label: "Overall Score", value: "82%", change: "+7%", icon: TrendingUp, color: "text-success" },
  { label: "Skills Tracked", value: "10", change: "+2", icon: BarChart3, color: "text-primary" },
  { label: "Lessons Done", value: "24", change: "+3", icon: BookOpen, color: "text-accent" },
  { label: "Assessments", value: "8", change: "+1", icon: ClipboardCheck, color: "text-warning" },
];

const DashboardOverview = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="gradient-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Brain className="h-48 w-48 -mt-8 -mr-8" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {username || "there"}! 👋</h1>
          <p className="text-sm opacity-90 max-w-md mb-4">
            You're on a 12-day learning streak. Keep it up! Your Java skills improved by 7% this week.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("chat")}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
          >
            Continue Learning <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 hover-lift animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <stat.icon className={cn("h-5 w-5 mb-3", stat.color)} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            <p className={cn("text-xs mt-1 font-medium", stat.color)}>{stat.change} this week</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Skill Analysis", desc: "View your detailed skill breakdown", icon: TrendingUp, tab: "skills", color: "text-primary" },
          { title: "Assessments", desc: "Take a quiz to test your knowledge", icon: ClipboardCheck, tab: "assessments", color: "text-accent" },
          { title: "Learning Plan", desc: "Follow your personalized roadmap", icon: BookOpen, tab: "roadmap", color: "text-success" },
        ].map((action, i) => (
          <button
            key={action.tab}
            onClick={() => onNavigate(action.tab)}
            className="bg-card border border-border rounded-xl p-5 text-left hover-lift group animate-fade-in transition-all"
            style={{ animationDelay: `${(i + 4) * 0.1}s` }}
          >
            <action.icon className={cn("h-6 w-6 mb-3 group-hover:scale-110 transition-transform", action.color)} />
            <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
            <p className="text-xs text-muted-foreground">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* AI Insight */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
            <p className="text-sm text-muted-foreground">
              Based on your recent assessment, I recommend focusing on <strong className="text-foreground">Multithreading</strong> and{" "}
              <strong className="text-foreground">System Design</strong> this week. These are the two areas with the most room for growth.
            </p>
            <Button variant="link" className="px-0 mt-2 h-auto text-sm" onClick={() => onNavigate("roadmap")}>
              View Learning Plan <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
