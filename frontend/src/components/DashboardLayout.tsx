import { useState, useEffect } from "react";
import { Brain, LogOut, User, ChevronDown, Menu, Moon, Sun } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}


const DashboardLayout = ({ children, onLogout }: DashboardLayoutProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const username = localStorage.getItem("username") || "User";

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile menu button — kept for potential future use */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-base font-bold gradient-text">IntelliLearn</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium hidden sm:block">{username}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-44 bg-card border border-border rounded-xl shadow-lg py-2 animate-fade-in z-50">
                <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border mb-1">
                  {username}
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
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
  );
};

export default DashboardLayout;
