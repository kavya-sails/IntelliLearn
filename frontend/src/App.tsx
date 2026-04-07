import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import ChatInterface from "./components/ChatInterface";
import SkillAnalysis from "./components/SkillAnalysis";
import AssessmentPage from "./components/AssessmentPage";
import LearningRoadmap from "./components/LearningRoadmap";
import ProgressTracking from "./components/ProgressTracking";
import SettingsPage from "./components/SettingsPage";
import DashboardOverview from "./components/DashboardOverview";

const API_BASE = "http://localhost:8000/api";

const routeToTab = (path: string) => {
  if (path.startsWith("/app/chat")) return "chat";
  if (path.startsWith("/app/dashboard")) return "dashboard";
  if (path.startsWith("/app/skills")) return "skills";
  if (path.startsWith("/app/roadmap")) return "roadmap";
  if (path.startsWith("/app/assessments")) return "assessments";
  if (path.startsWith("/app/progress")) return "progress";
  if (path.startsWith("/app/settings")) return "settings";
  return "chat";
};

const AppRoutes = ({ authenticated, setAuthenticated }: { authenticated: boolean; setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>; }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(routeToTab(location.pathname));
  const [isNewChat, setIsNewChat] = useState(true);
  const [chatInstanceKey, setChatInstanceKey] = useState(0);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const tab = routeToTab(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  useEffect(() => {
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
      setIsNewChat(false);
    }
  }, []);

  useEffect(() => {
    setCurrentSessionId(localStorage.getItem("session_id"));
  }, [chatInstanceKey, sessionRefreshKey]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/app/${tab}`);
  };

  const handleStartChat = async () => {
    setIsNewChat(false);
    setChatInstanceKey((k) => k + 1);
    navigate("/app/chat");
    localStorage.removeItem("session_id");
    setCurrentSessionId(null);

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/chat/new?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Failed to start new chat: ${res.status}`);
      }

      const data = await res.json();
      if (data?.session_id) {
        localStorage.setItem("session_id", String(data.session_id));
        setCurrentSessionId(String(data.session_id));
      }
      
      setSessionRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to start new chat session:", error);
    }
  };

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSessionClick = (sessionId: number) => {
    localStorage.setItem("session_id", String(sessionId));
    setCurrentSessionId(String(sessionId));
    setIsNewChat(false);
    setChatInstanceKey((k) => k + 1);
    navigate("/app/chat");
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={() => {
        setAuthenticated(false);
        localStorage.removeItem("user_id");
        localStorage.removeItem("session_id");
        navigate("/auth");
      }}
      onNewChat={handleStartChat}
      onSessionClick={handleSessionClick}
      refreshKey={sessionRefreshKey}
      currentSessionId={currentSessionId}
    >
      <Routes>
        <Route path="chat" element={<ChatInterface key={chatInstanceKey} showWelcome={isNewChat} />} />
        <Route path="dashboard" element={<DashboardOverview onNavigate={handleTabChange} />} />
        <Route path="skills" element={<SkillAnalysis />} />
        <Route path="assessments" element={<AssessmentPage />} />
        <Route path="roadmap" element={<LearningRoadmap />} />
        <Route path="progress" element={<ProgressTracking />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="chat" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);

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
