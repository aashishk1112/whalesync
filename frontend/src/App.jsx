import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Traders from './pages/Traders';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Docs from './pages/Docs';
import SubscriptionPage from './pages/SubscriptionPage';
import PerformanceDashboard from './pages/PerformanceDashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Footer from './components/Footer';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Removing Placeholders around line 6-10

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="container mt-4 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Layout = ({ children }) => {
  const { user, logout } = React.useContext(AuthContext);
  return (
    <>
      <header className="app-header border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 py-4">
        <div className="app-container flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to={user ? "/" : "/login"} className="no-underline">
              <h1 className="m-0 text-xl font-black text-primary hover:text-primary-hover transition-colors tracking-tighter">WhaleSync</h1>
            </Link>
            {user && (
              <nav className="flex items-center gap-6">
                <Link to="/" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Dashboard</Link>
                <Link to="/traders" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Leaderboard</Link>
                <Link to="/performance" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Performance</Link>
                <Link to="/simulator" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Simulator</Link>
                <Link to="/subscription" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Subscription</Link>
                <Link to="/settings" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest no-underline transition-colors">Settings</Link>
              </nav>
            )}
          </div>
          <div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {user.picture_url && (
                    <img
                      src={user.picture_url}
                      alt=""
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                  )}
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{user.username}</span>
                </div>
                <button
                  className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border border-white/10 transition-all"
                  onClick={() => { if (window.confirm('Are you sure you want to log out?')) logout(); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-container pb-20">
        {children}
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"}>
      <AuthProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/traders" element={<ProtectedRoute><Traders /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><PerformanceDashboard /></ProtectedRoute>} />
                <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/docs" element={<Docs />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </PortfolioProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
