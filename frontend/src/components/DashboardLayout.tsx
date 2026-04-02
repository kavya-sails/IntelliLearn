import { useState } from "react";
import { Brain, MessageSquare, BarChart3, BookOpen, ClipboardCheck, Settings, Search, Plus, LogOut, User, ChevronDown, Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "skills", label: "Skill Analysis", icon: TrendingUp },
  { id: "roadmap", label: "Learning Plan", icon: BookOpen },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "settings", label: "Settings", icon: Settings },
];

const chatHistory = [
  "Resume Analysis - Apr 1",
  "Java Learning Path",
  "Spring Boot Questions",
  "SQL Practice Session",
];

const DashboardLayout = ({ children, activeTab, onTabChange, onLogout }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
            onClick={() => onTabChange("chat")}
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
              {chatHistory.map((chat, i) => (
                <button
                  key={i}
                  className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg px-3 py-2 transition-colors truncate"
                >
                  {chat}
                </button>
              ))}
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
              {sidebarOpen ? <X className="h-5 w-5 lg:hidden" /> : <Menu className="h-5 w-5" />}
              <Menu className="h-5 w-5 hidden lg:block" />
            </button>
            <h2 className="text-sm font-semibold">
              {navItems.find((i) => i.id === activeTab)?.label || "AI Chat"}
            </h2>
          </div>

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
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
