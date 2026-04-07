import { Brain, FileText, ClipboardCheck, BarChart2, Map } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Resume & Goal Analysis",
    desc: "Upload your resume and set your career goals for AI-powered skill extraction",
  },
  {
    icon: ClipboardCheck,
    title: "Skill Assessment",
    desc: "Test your knowledge with interactive quizzes",
  },
  {
    icon: BarChart2,
    title: "Gap Analysis Report",
    desc: "View your skill gaps and areas that need improvement",
  },
  {
    icon: Map,
    title: "Learning Roadmap",
    desc: "Get personalized learning paths based on your goals",
  },
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
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl text-left"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
