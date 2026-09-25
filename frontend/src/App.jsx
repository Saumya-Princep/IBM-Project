import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext.jsx";
import NavBar from "./components/NavBar.jsx";
import AppSidebar from "./components/AppSidebar.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import MissionPage from "./pages/MissionPage.jsx";
import MuseumPage from "./pages/MuseumPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StageMapPage from "./pages/StageMapPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import StreakPage from "./pages/StreakPage.jsx";
import DailyChallengePage from "./pages/DailyChallengePage.jsx";
import TopicsPage from "./pages/TopicsPage.jsx";
import TopicQuizPage from "./pages/TopicQuizPage.jsx";
import PostQuizResultsPage from "./pages/PostQuizResultsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FruitNinjaQuizPage from "./pages/FruitNinjaQuizPage.jsx";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/mission" element={<MissionPage />} />
        <Route path="/museum" element={<MuseumPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stages" element={<StageMapPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/streak" element={<StreakPage />} />
        <Route path="/daily-challenge" element={<DailyChallengePage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/quiz/:subtopicId" element={<TopicQuizPage />} />
        <Route path="/quiz-results" element={<PostQuizResultsPage />} />
        <Route path="/fruit-ninja" element={<FruitNinjaQuizPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <NavBar />
          <div className="app-body">
            <AppSidebar />
            <main className="app-main-content">
              <AnimatedRoutes />
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
