import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n/config';
import './App.css';

// Eagerly loaded (always needed)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ScenariosPage = lazy(() => import('./pages/ScenariosPage'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const QuizPlayerPage = lazy(() => import('./pages/QuizPlayerPage'));
const SimulationsPage = lazy(() => import('./pages/SimulationsPage'));
const SimulationPlayerPage = lazy(() => import('./pages/SimulationPlayerPage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const InstallerPage = lazy(() => import('./pages/InstallerPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const ScenarioBuilderPage = lazy(() => import('./pages/ScenarioBuilderPage'));
const DebriefPage = lazy(() => import('./pages/DebriefPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-primary font-mono animate-pulse">LOADING...</div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firstRunCompleted, setFirstRunCompleted] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('soceng_token');
    if (token) {
      setIsAuthenticated(true);
    }

    const firstRun = localStorage.getItem('soceng_first_run');
    if (!firstRun && !token) {
      setFirstRunCompleted(false);
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('soceng_theme') || 'dark';
    document.documentElement.classList.toggle('light', savedTheme === 'light');

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">INITIALIZING...</div>
      </div>
    );
  }

  if (!firstRunCompleted) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" />
          <Suspense fallback={<PageLoader />}>
            <InstallerPage onComplete={() => {
              setFirstRunCompleted(true);
              localStorage.setItem('soceng_first_run', 'true');
            }} />
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" />
          {showRegister ? (
            <RegisterPage
              onRegister={() => setIsAuthenticated(true)}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <LoginPage
              onLogin={() => setIsAuthenticated(true)}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" />
        <Layout onLogout={() => setIsAuthenticated(false)}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/scenarios" element={<ScenariosPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/quizzes/:quizId/play" element={<QuizPlayerPage />} />
              <Route path="/simulations" element={<SimulationsPage />} />
              <Route path="/simulations/:simulationId/play" element={<ProtectedRoute><SimulationPlayerPage /></ProtectedRoute>} />
              <Route path="/simulations/:simulationId/debrief" element={<DebriefPage />} />
              <Route path="/simulations/:simulationId/certificate" element={<CertificatePage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/ai-challenge" element={<AIChatPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/scenario-builder" element={<ScenarioBuilderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
