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
      <header className="app-header">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={user ? "/" : "/login"} style={{ textDecoration: 'none' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)', cursor: 'pointer' }}>WhaleSync</h1>
            </Link>
            {user && (
              <nav className="nav-links">
                <Link to="/">Dashboard</Link>
                <Link to="/traders" style={{ opacity: 0.7 }}>Traders <span style={{ fontSize: '0.7rem', verticalAlign: 'top', background: 'var(--primary)', color: 'white', padding: '1px 4px', borderRadius: '4px', marginLeft: '2px' }}>Soon</span></Link>
                <Link to="/simulator">Simulator</Link>
                <Link to="/settings">Settings</Link>
              </nav>
            )}
          </div>
          <div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.picture_url && (
                    <img
                      src={user.picture_url}
                      alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  )}
                  <span className="font-medium" style={{ color: 'white', whiteSpace: 'nowrap' }}>{user.username}</span>
                </div>
                <button
                  className="btn-outline"
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={() => { if (window.confirm('Are you sure you want to log out?')) logout(); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>
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
                <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
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
