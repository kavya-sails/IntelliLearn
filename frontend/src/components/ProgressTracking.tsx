import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Flame, Target, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const progressData = [
  { week: "W1", score: 45 },
  { week: "W2", score: 52 },
  { week: "W3", score: 58 },
  { week: "W4", score: 63 },
  { week: "W5", score: 71 },
  { week: "W6", score: 68 },
  { week: "W7", score: 75 },
  { week: "W8", score: 82 },
];

const stats = [
  { label: "Overall Score", value: "82%", icon: Target, color: "text-primary", change: "+7% this week" },
  { label: "Current Streak", value: "12 days", icon: Flame, color: "text-warning", change: "Best: 18 days" },
  { label: "Skills Improved", value: "6/10", icon: TrendingUp, color: "text-success", change: "+2 this month" },
  { label: "Assessments", value: "8 done", icon: Award, color: "text-accent", change: "Avg: 74%" },
];

const ProgressTracking = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">Your learning journey at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 hover-lift animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            <p className={cn("text-xs mt-2", stat.color)}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Score Progress Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(234, 85%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(234, 85%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(220, 15%, 90%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(234, 85%, 60%)"
                strokeWidth={3}
                fill="url(#scoreGradient)"
                dot={{ fill: "hsl(234, 85%, 60%)", strokeWidth: 2, r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion & Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Completion Rate</h3>
          <div className="flex items-center justify-center py-8">
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(220, 15%, 90%)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="hsl(234, 85%, 60%)"
                  strokeWidth="10"
                  strokeDasharray={`${65 * 3.14} ${100 * 3.14}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">65%</span>
                <span className="text-xs text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Learning Streak</h3>
          <div className="grid grid-cols-7 gap-1.5 mt-4">
            {Array.from({ length: 28 }, (_, i) => {
              const active = i < 12 || (i > 14 && i < 22);
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-sm transition-colors",
                    active ? "gradient-primary opacity-80" : "bg-secondary"
                  )}
                  title={active ? "Active" : "Missed"}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-muted-foreground">
            <span>4 weeks ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;
