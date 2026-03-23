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
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

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
                  id="logout-button"
                  style={{
                    position: 'relative',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border border-red-500/20 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLogoutModal(true);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2">Confirm Logout</h2>
            <p className="text-slate-400 mb-6 text-sm">Are you sure you want to log out of WhaleSync?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  logout(); 
                  window.location.href = '/login'; 
                }} 
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
