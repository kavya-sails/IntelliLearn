import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const skillData = [
  { name: "Java", score: 85, level: "strong" },
  { name: "Spring Boot", score: 70, level: "medium" },
  { name: "SQL", score: 78, level: "strong" },
  { name: "React", score: 45, level: "weak" },
  { name: "System Design", score: 35, level: "weak" },
  { name: "Docker", score: 60, level: "medium" },
  { name: "AWS", score: 40, level: "weak" },
  { name: "Git", score: 90, level: "strong" },
  { name: "REST APIs", score: 82, level: "strong" },
  { name: "Multithreading", score: 30, level: "weak" },
];

const getColor = (level: string) => {
  switch (level) {
    case "strong": return "hsl(145, 65%, 42%)";
    case "medium": return "hsl(40, 95%, 55%)";
    case "weak": return "hsl(0, 72%, 55%)";
    default: return "hsl(234, 85%, 60%)";
  }
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case "strong": return TrendingUp;
    case "medium": return Minus;
    case "weak": return TrendingDown;
    default: return Minus;
  }
};

const SkillAnalysis = () => {
  const strong = skillData.filter((s) => s.level === "strong");
  const medium = skillData.filter((s) => s.level === "medium");
  const weak = skillData.filter((s) => s.level === "weak");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skill Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Based on your resume and assessments</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI-Powered Insights
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">AI Insight</h3>
            <p className="text-sm opacity-90">
              You are strong in Java and REST APIs but weak in Multithreading and System Design.
              Focus on these areas to become a well-rounded full-stack developer. I recommend spending
              2 weeks on System Design fundamentals and 1 week on Java concurrency patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Skill Proficiency</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(220, 15%, 90%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [`${value}/100`, "Score"]}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                {skillData.map((entry) => (
                  <Cell key={entry.name} fill={getColor(entry.level)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4 justify-center">
          {[
            { label: "Strong (70+)", color: "bg-success" },
            { label: "Medium (50-69)", color: "bg-warning" },
            { label: "Weak (<50)", color: "bg-destructive" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={cn("h-3 w-3 rounded-full", item.color)} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillData.map((skill, i) => {
          const Icon = getLevelIcon(skill.level);
          return (
            <div
              key={skill.name}
              className="bg-card border border-border rounded-xl p-4 hover-lift animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{skill.name}</h4>
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    skill.level === "strong" && "bg-success/10 text-success",
                    skill.level === "medium" && "bg-warning/10 text-warning",
                    skill.level === "weak" && "bg-destructive/10 text-destructive"
                  )}
                >
                  {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${skill.score}%`,
                      backgroundColor: getColor(skill.level),
                    }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: getColor(skill.level) }}>
                  {skill.score}
                </span>
                <Icon className="h-4 w-4" style={{ color: getColor(skill.level) }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillAnalysis;
