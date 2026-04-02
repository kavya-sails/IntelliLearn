import { CheckCircle2, Circle, Clock, ExternalLink, Play, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const weeks = [
  {
    week: 1,
    title: "Core Java Fundamentals",
    status: "completed" as const,
    topics: ["OOP Concepts", "Collections Framework", "Exception Handling"],
    resources: ["Java Tutorial - Oracle Docs", "Effective Java - Book", "HackerRank Java Practice"],
    problems: 12,
  },
  {
    week: 2,
    title: "Advanced Java & Multithreading",
    status: "in-progress" as const,
    topics: ["Threads & Concurrency", "Streams API", "Lambda Expressions"],
    resources: ["Java Concurrency in Practice", "Baeldung Multithreading Guide"],
    problems: 8,
  },
  {
    week: 3,
    title: "Spring Boot & REST APIs",
    status: "not-started" as const,
    topics: ["Spring Core", "REST Controllers", "JPA & Hibernate"],
    resources: ["Spring Boot Docs", "Building REST APIs - YouTube"],
    problems: 10,
  },
  {
    week: 4,
    title: "Database & SQL Mastery",
    status: "not-started" as const,
    topics: ["Complex Queries", "Indexing & Optimization", "Database Design"],
    resources: ["SQL Zoo", "LeetCode SQL Problems"],
    problems: 15,
  },
  {
    week: 5,
    title: "System Design Basics",
    status: "not-started" as const,
    topics: ["Scalability", "Load Balancing", "Caching Strategies"],
    resources: ["System Design Primer - GitHub", "Grokking System Design"],
    problems: 5,
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed": return { icon: CheckCircle2, color: "text-success", bg: "bg-success", label: "Completed" };
    case "in-progress": return { icon: Play, color: "text-primary", bg: "gradient-primary", label: "In Progress" };
    default: return { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Not Started" };
  }
};

const LearningRoadmap = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Learning Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">Your personalized 5-week learning plan</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed", value: "1/5 weeks", color: "text-success" },
          { label: "In Progress", value: "Week 2", color: "text-primary" },
          { label: "Problems Solved", value: "12/50", color: "text-accent" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {weeks.map((week, i) => {
          const config = getStatusConfig(week.status);
          const StatusIcon = config.icon;

          return (
            <div
              key={week.week}
              className="relative flex gap-6 pb-8 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10",
                  week.status === "completed" && "bg-success text-success-foreground",
                  week.status === "in-progress" && "gradient-primary text-primary-foreground animate-pulse-glow",
                  week.status === "not-started" && "bg-secondary text-muted-foreground"
                )}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                {i < weeks.length - 1 && (
                  <div className={cn(
                    "w-0.5 flex-1 mt-2",
                    week.status === "completed" ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 bg-card border rounded-2xl p-5 hover-lift",
                week.status === "in-progress" && "border-primary/30 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Week {week.week}</span>
                    <h3 className="text-base font-semibold">{week.title}</h3>
                  </div>
                  <span className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium",
                    week.status === "completed" && "bg-success/10 text-success",
                    week.status === "in-progress" && "bg-primary/10 text-primary",
                    week.status === "not-started" && "bg-secondary text-muted-foreground"
                  )}>
                    {config.label}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Topics
                    </p>
                    <ul className="space-y-1">
                      {week.topics.map((topic) => (
                        <li key={topic} className="text-sm flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Resources
                    </p>
                    <ul className="space-y-1">
                      {week.resources.map((res) => (
                        <li key={res} className="text-sm text-primary hover:underline cursor-pointer">{res}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {week.problems} practice problems
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningRoadmap;
