import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import ChatInterface from "./components/ChatInterface";
import SkillAnalysis from "./components/SkillAnalysis";
import AssessmentPage from "./components/AssessmentPage";
import LearningRoadmap from "./components/LearningRoadmap";
import ProgressTracking from "./components/ProgressTracking";
import SettingsPage from "./components/SettingsPage";
import DashboardOverview from "./components/DashboardOverview";

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  if (!authenticated) {
    return <AuthPage onAuth={() => setAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "chat": return <ChatInterface />;
      case "dashboard": return <DashboardOverview onNavigate={setActiveTab} />;
      case "skills": return <SkillAnalysis />;
      case "assessments": return <AssessmentPage />;
      case "roadmap": return <LearningRoadmap />;
      case "progress": return <ProgressTracking />;
      case "settings": return <SettingsPage />;
      default: return <ChatInterface />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => setAuthenticated(false)}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default App;
