import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Github, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import authIllustration from "@/assets/auth-illustration.jpg";

const API_BASE = "http://localhost:8000/api";

const AuthPage = ({ onAuth }: { onAuth: () => void }) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");

    try {
      let userId = "";
      if (tab === "register") {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setAuthError("Please fill in Full Name, Email, and Password.");
          return;
        }
        const res = await fetch(`${API_BASE}/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          setAuthError("Registration failed. Please try again.");
          return;
        }
        const data = await res.json();
        userId = data.id;
      } else {
        if (!email.trim() || !password.trim()) {
          setAuthError("Email and Password are required.");
          return;
        }
        const res = await fetch(`${API_BASE}/user/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
          method: "POST",
        });
        if (!res.ok) {
          if (res.status === 401) {
            setAuthError("Email or password is incorrect.");
            return;
          }
          setAuthError("Sign in failed. Please try again.");
          return;
        }
        const data = await res.json();
        userId = data.id;
      }
      localStorage.setItem("user_id", userId);
      onAuth();
      navigate("/app/chat");
    } catch (error) {
      console.error("Auth error:", error);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={authIllustration}
          alt="AI Learning Platform"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="h-10 w-10" />
            <span className="text-3xl font-bold">IntelliLearn</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Learn smarter.<br />
            Track your growth.<br />
            Become industry-ready.
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Your AI-powered learning companion that analyzes your skills and creates personalized roadmaps.
          </p>
          <div className="flex gap-4 mt-8">
            {["Resume Analysis", "Skill Tracking", "AI Roadmaps"].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                <Sparkles className="h-3 w-3" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">IntelliLearn</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-secondary rounded-xl p-1 mb-8">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setAuthError("");
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  tab === t
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {tab === "register" && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {tab === "login" && (
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            )}

            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={loading}>
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" size="lg">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <Github className="h-5 w-5 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
