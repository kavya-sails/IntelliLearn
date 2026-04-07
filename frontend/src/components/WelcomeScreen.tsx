import { Brain, FileText, Map, ClipboardCheck, Sparkles } from "lucide-react";

const features = [
  { icon: FileText, title: "Resume Analysis", desc: "Upload your resume for AI-powered skill extraction" },
  { icon: Map, title: "Learning Roadmap", desc: "Get personalized learning paths based on your goals" },
  { icon: ClipboardCheck, title: "Skill Assessment", desc: "Test your knowledge with interactive quizzes" },
  { icon: Sparkles, title: "AI Recommendations", desc: "Discover skills and courses tailored to you" },
];

const WelcomeScreen = () => {
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

      </div>
    </div>
  );
};

export default WelcomeScreen;