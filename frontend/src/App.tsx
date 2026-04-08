import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import WelcomePage from "./pages/WelcomePage";
import DashboardLayout from "./components/DashboardLayout";
import FlowPage from "./components/FlowPage";
import SkillAnalysis from "./components/SkillAnalysis";
import LearningRoadmap from "./components/LearningRoadmap";

const routeToTab = (path: string) => {
  if (path.startsWith("/app/flow")) return "flow";
  if (path.startsWith("/app/skills")) return "skills";
  if (path.startsWith("/app/roadmap")) return "roadmap";
  return "flow";
};

const AppRoutes = ({
  authenticated,
  setAuthenticated,
}: {
  authenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(routeToTab(location.pathname));

  useEffect(() => {
    setActiveTab(routeToTab(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    navigate(`/app/${tab}`);
  };

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

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
    >
      <Routes>
        <Route path="home" element={<WelcomePage />} />
        <Route path="flow" element={<FlowPage />} />
        <Route path="skills/:sessionId" element={<SkillAnalysis />} />
        <Route path="roadmap/:sessionId" element={<LearningRoadmap />} />
        <Route path="*" element={<Navigate to="flow" replace />} />
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
              <Navigate to="/app/flow" replace />
            ) : (
              <AuthPage onAuth={() => setAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/app/*"
          element={<AppRoutes authenticated={authenticated} setAuthenticated={setAuthenticated} />}
        />
        <Route path="*" element={<Navigate to={authenticated ? "/app/flow" : "/auth"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
