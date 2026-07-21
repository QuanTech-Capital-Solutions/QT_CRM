import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AppShell, type PageId } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { FinancePage } from './pages/FinancePage';
import { TradingPage } from './pages/TradingPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import Logo from './components/fulllogo.png';

type AppState = 'landing' | 'auth' | 'app';

function AppContent() {
  const { session, user, loading, signOut } = useAuth();
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  // If a Supabase session exists, force the app view
  const effectiveState: AppState = session ? 'app' : appState;

  const handleSignOut = async () => {
    await signOut();
    setAppState('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-canvas dark:bg-dark-canvas flex items-center justify-center">
        <div className="animate-pulse">
          <img src={Logo} alt="QuanTech logo" className="h-30 w-auto" />
        </div>
      </div>
    );
  }

  if (effectiveState === 'landing') {
    return <LandingPage onSignIn={() => setAppState('auth')} />;
  }

  if (effectiveState === 'auth') {
    return <AuthPage onBack={() => setAppState('landing')} />;
  }

  return (
    <AppShell
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onSignOut={handleSignOut}
      userEmail={user?.email ?? ''}
    >
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'clients' && <ClientsPage />}
      {currentPage === 'projects' && <ProjectsPage />}
      {currentPage === 'finance' && <FinancePage />}
      {currentPage === 'trading' && <TradingPage />}
      {currentPage === 'admin' && <AdminProfilePage />}
    </AppShell>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
