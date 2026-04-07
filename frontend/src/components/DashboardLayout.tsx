import { useState, useEffect } from "react";
import { Brain, BarChart3, Search, Plus, LogOut, User, ChevronDown, Menu, Moon, Sun, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onNewChat?: () => void;
  onSessionClick?: (sessionId: number) => void;
  refreshKey?: number;
  currentSessionId?: number | null;
}

const navItems = [
  { id: "chat", label: "About IntelliLearn", icon: Brain },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
];

const tabLabels: Record<string, string> = {
  chat: "About IntelliLearn",
  dashboard: "Dashboard",
};

const DashboardLayout = ({ children, activeTab, onTabChange, onLogout, onNewChat, onSessionClick, refreshKey, currentSessionId }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<{ id: number; status: string }[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const fetchSessions = () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    
    const url = `http://localhost:8000/api/user/${userId}/sessions?size=10`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setSessions(data.sessions || []);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const handleDeleteSession = async (sessionId: number) => {
    const ok = window.confirm("Delete this chat session? This action cannot be undone.");
    if (!ok) return;
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/user/${userId}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete session");
      }

      // If deleted session was active in localStorage, clear it
      const current = localStorage.getItem("session_id");
      if (current === String(sessionId)) {
        localStorage.removeItem("session_id");
      }

      // Refresh sessions list
      fetchSessions();
    } catch (e) {
      console.error(e);
      alert("Could not delete session. See console for details.");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  useEffect(() => {
    const storedDark = localStorage.getItem("darkMode");
    if (storedDark !== null) {
      setDarkMode(storedDark === "true");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  const statusBadge = (status: string): { label: string; color: string } => {
    const map: Record<string, { label: string; color: string }> = {
      COLLECTING_GOAL:        { label: "New",            color: "bg-primary/20 text-primary" },
      COLLECTING_RESUME:      { label: "Resume",         color: "bg-primary/20 text-primary" },
      PARSING_SKILLS:         { label: "Parsing",        color: "bg-warning/20 text-warning" },
      AWAITING_QUIZ:          { label: "Quiz Ready",     color: "bg-warning/20 text-warning" },
      QUIZ_IN_PROGRESS:       { label: "Quiz",           color: "bg-warning/20 text-warning" },
      QUIZ_DONE:              { label: "Done",           color: "bg-success/20 text-success" },
      GAP_ANALYSIS_IN_PROGRESS: { label: "Analyzing",   color: "bg-warning/20 text-warning" },
      GAP_ANALYSIS_COMPLETE:  { label: "Complete",       color: "bg-success/20 text-success" },
      LEARNING_PATH_COMPLETE: { label: "Complete",       color: "bg-success/20 text-success" },
    };
    return map[status] ?? { label: status.replace(/_/g, " "), color: "bg-secondary text-muted-foreground" };
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-30 h-screen flex flex-col bg-card border-r border-border transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 lg:w-16 overflow-hidden"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Brain className="h-7 w-7 text-primary shrink-0" />
          {sidebarOpen && <span className="text-lg font-bold gradient-text">IntelliLearn</span>}
        </div>

        {/* New Chat */}
        <div className="p-3">
          <Button
            variant="gradient"
            className={cn("w-full", !sidebarOpen && "px-2")}
            onClick={() => {
              onNewChat?.();
            }}
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>New Chat</span>}
          </Button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        {sidebarOpen && (
          <div className="px-3 pb-3">
            <p className="text-xs text-muted-foreground font-medium mb-2 px-2">Recent</p>
            <div className="space-y-0.5">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2">No sessions available</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onSessionClick?.(session.id)}
                      className={cn(
                        "flex-1 text-left text-sm rounded-lg px-3 py-2 transition-colors",
                        currentSessionId === session.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">Chat #{session.id}</span>
                        <span className={cn("shrink-0 text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(session.status).color)}>
                          {statusBadge(session.status).label}
                        </span>
                      </div>
                    </button>
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      title="Delete session"
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="border-t border-border my-1" />

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold">
              {tabLabels[activeTab] || "About IntelliLearn"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-lg py-2 animate-fade-in">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
