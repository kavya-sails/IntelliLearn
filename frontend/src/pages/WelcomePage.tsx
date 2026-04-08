import { useNavigate } from "react-router-dom";
import { Target, FileText, BarChart3, BookOpen, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Target,
    title: "Resume & Goal Analysis",
    description: "Set your career goal and upload your resume. Our AI extracts your skills and maps them to your target role.",
    action: "Get Started",
    route: "/app/flow",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "Skill Analysis",
    description: "Take a personalized quiz based on your resume skills and see exactly where you stand today.",
    action: "View Analysis",
    route: "/app/flow",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Gap Analysis Report",
    description: "Understand the gap between your current skills and what your dream role requires.",
    action: "See Report",
    route: "/app/flow",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: BookOpen,
    title: "Learning Roadmap",
    description: "Get a curated, step-by-step learning path with resources tailored to close your skill gaps.",
    action: "View Roadmap",
    route: "/app/flow",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const WelcomePage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "there";
  const sessionId = localStorage.getItem("session_id");

  const handleFeatureClick = (route: string, title: string) => {
    if (title === "Skill Analysis" || title === "Gap Analysis Report") {
      if (sessionId) {
        navigate(`/app/skills/${sessionId}`);
      } else {
        navigate("/app/flow");
      }
    } else if (title === "Learning Roadmap") {
      if (sessionId) {
        navigate(`/app/roadmap/${sessionId}`);
      } else {
        navigate("/app/flow");
      }
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to{" "}
            <span className="gradient-text">IntelliLearn</span>
            {", "}
            <span className="text-foreground">{username}</span>!
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Your AI-powered skill development platform. Here's everything you can do to accelerate your career.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/30 group flex flex-col gap-4"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start gap-2 group-hover:border-primary/50 transition-colors"
                  onClick={() => handleFeatureClick(feature.route, feature.title)}
                >
                  {feature.action}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Quick Start CTA */}
        <div className="mt-10 bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">Ready to begin?</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Start by setting your career goal and uploading your resume — it only takes a minute.
          </p>
          <Button variant="gradient" size="lg" className="gap-2" onClick={() => navigate("/app/flow")}>
            <Target className="h-4 w-4" />
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
