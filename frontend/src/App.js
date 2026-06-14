import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import SplashScreen from './components/SplashScreen';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import GroupDetail from './components/GroupDetail';
import Expenses from './components/Expenses';
import SettleUp from './components/SettleUp';
import Chat from './components/Chat';
import Analytics from './components/Analytics';
import Contacts from './components/Contacts';
import Notifications from './components/Notifications';
import About from './components/About';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const isGuest = localStorage.getItem('guest') === '1';
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  return user || isGuest ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  return user ? <Navigate to="/" /> : children;
}

function AppLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        {children}
        <footer className="app-footer">
          <div className="footer-logo-container">
            <img src="/logo.svg" alt="Ledgerly" />
          </div>
          <div className="footer-brand">Ledgerly</div>
          <div className="footer-links">
            <RouterLink to="/about">About</RouterLink>
            <RouterLink to="/privacy">Privacy</RouterLink>
            <RouterLink to="/terms">Terms</RouterLink>
            <RouterLink to="/support">Support</RouterLink>
          </div>
          <div className="footer-copyright">&copy; 2026 Sovereign Technologies, Inc.</div>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}

const PageLayout = AppLayout;

function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashDone'));
  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashDone', '1');
    setShowSplash(false);
  }, []);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><AppLayout><Groups /></AppLayout></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><AppLayout><GroupDetail /></AppLayout></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><AppLayout><Expenses /></AppLayout></PrivateRoute>} />
          <Route path="/settle" element={<PrivateRoute><AppLayout><SettleUp /></AppLayout></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><AppLayout><Chat /></AppLayout></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AppLayout><Analytics /></AppLayout></PrivateRoute>} />
          <Route path="/contacts" element={<PrivateRoute><AppLayout><Contacts /></AppLayout></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><AppLayout><Notifications /></AppLayout></PrivateRoute>} />
          <Route path="/about" element={<PageLayout><About /></PageLayout>} />
          <Route path="/privacy" element={<PageLayout><Privacy /></PageLayout>} />
          <Route path="/terms" element={<PageLayout><Terms /></PageLayout>} />
          <Route path="/support" element={<PageLayout><div style={{ maxWidth: 800, margin: '0 auto' }}><div className="page-header" style={{ marginBottom: 40 }}><a href="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>← Back to Dashboard</a><h2 style={{ fontSize: 28, marginBottom: 8 }}>Support</h2></div><div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}><div className="empty-state"><div className="icon">📧</div><h3>Contact Us</h3><p>Support coming soon.</p></div></div></div></PageLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
