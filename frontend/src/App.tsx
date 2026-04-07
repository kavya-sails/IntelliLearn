import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import ChatInterface from "./components/ChatInterface";
import WelcomeScreen from "./components/WelcomeScreen";
import SkillAnalysis from "./components/SkillAnalysis";
import LearningRoadmap from "./components/LearningRoadmap";
import ProgressTracking from "./components/ProgressTracking";
import DashboardOverview from "./components/DashboardOverview";

const API_BASE = "http://localhost:8000/api";

const routeToTab = (path: string) => {
  if (path.startsWith("/app/chat")) return "chat";
  if (path.startsWith("/app/dashboard")) return "dashboard";
  if (path.startsWith("/app/skills")) return "skills";
  if (path.startsWith("/app/roadmap")) return "roadmap";
  return "chat";
};

const AppRoutes = ({ authenticated, setAuthenticated }: { authenticated: boolean; setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>; }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(routeToTab(location.pathname));
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(routeToTab(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    navigate(`/app/${tab}`);
  };

  const handleStartChat = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE}/chat/new?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed to start new chat: ${res.status}`);

      const data = await res.json();
      if (data?.session_id) {
        const sid = Number(data.session_id);
        setCurrentSessionId(sid);
        setSessionRefreshKey((k) => k + 1);
        navigate(`/app/chat/${sid}`);
      }
    } catch (error) {
      console.error("Failed to start new chat session:", error);
    }
  };

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSessionClick = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    navigate(`/app/chat/${sessionId}`);
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={() => {
        setAuthenticated(false);
        localStorage.removeItem("user_id");
        localStorage.removeItem("session_id");
        localStorage.removeItem("username");
        navigate("/auth");
      }}
      onNewChat={handleStartChat}
      onSessionClick={handleSessionClick}
      refreshKey={sessionRefreshKey}
      currentSessionId={currentSessionId}
    >
      <Routes>
        <Route path="chat" element={<WelcomeScreen />} />
        <Route path="chat/:sessionId" element={<ChatInterface />} />
        <Route path="dashboard" element={<DashboardOverview onNavigate={handleTabChange} />} />
        <Route path="skills" element={<SkillAnalysis />} />
        <Route path="skills/:sessionId" element={<SkillAnalysis />} />
        <Route path="roadmap" element={<LearningRoadmap />} />
        <Route path="roadmap/:sessionId" element={<LearningRoadmap />} />
        <Route path="progress" element={<ProgressTracking />} />
        <Route path="*" element={<Navigate to="chat" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem("user_id"));

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            authenticated ? (
              <Navigate to="/app/chat" replace />
            ) : (
              <AuthPage onAuth={() => setAuthenticated(true)} />
            )
          }
        />
        <Route path="/app/*" element={<AppRoutes authenticated={authenticated} setAuthenticated={setAuthenticated} />} />
        <Route path="*" element={<Navigate to={authenticated ? "/app/chat" : "/auth"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
