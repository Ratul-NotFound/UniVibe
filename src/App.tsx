import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';
import Discovery from '@/pages/home/Discovery';
import Search from '@/pages/search/Search';
import Matches from '@/pages/matches/Matches';
import ChatRoom from '@/pages/chat/ChatRoom';
import ChatList from '@/pages/chat/ChatList';
import Profile from '@/pages/profile/Profile';
import Notifications from '@/pages/notifications/Notifications';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminReports from '@/pages/admin/Reports';
import AdminLogs from '@/pages/admin/Logs';
import AdminContent from '@/pages/admin/Content';
import AppLayout from '@/components/layout/AppLayout';
import About from '@/pages/info/About';
import Terms from '@/pages/info/Terms';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';
import { useNotifications } from '@/hooks/useNotifications';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import SplashScreen from '@/components/ui/SplashScreen';
import PwaInstallPrompt from '@/components/layout/PwaInstallPrompt';

// Placeholder Pages
const Chat = () => <div className="p-8 text-center pt-20">Chat rooms coming soon...</div>;

// Banned Page
const BannedPage = () => {
  const { userData } = useAuth();
  
  if (!userData?.isBanned) return <Navigate to="/" />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#020202]">
      <div className="rounded-full bg-red-500/10 p-4 mb-4">
        <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Account Suspended</h1>
      <p className="text-zinc-400 max-w-md">
        Your account has been suspended for violating our community guidelines.
      </p>
      {userData?.banUntil && userData.banUntil !== 'permanent' && (
        <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-sm font-bold text-amber-500">Ban expires on:</p>
          <p className="text-lg text-white">{new Date(userData.banUntil).toLocaleString()}</p>
        </div>
      )}
      {userData?.banUntil === 'permanent' && (
        <div className="mt-4 p-4 rounded-xl border border-red-900/50 bg-red-900/10">
          <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Permanent Ban</p>
        </div>
      )}
    </div>
  );
};

// Route Guard Component
const ProtectedRoute = ({ children, requireVerified = true, requireOnboarded = true, requireRole }: { 
  children: React.ReactNode, 
  requireVerified?: boolean, 
  requireOnboarded?: boolean,
  requireRole?: 'admin' | 'moderator' | 'user'
}) => {
  const { user, userData, loading, isVerified, isOnboarded } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) return <Navigate to="/login" />;
  if (userData?.isBanned) return <Navigate to="/banned" />;
  if (requireVerified && !isVerified) return <Navigate to="/verify-email" />;
  if (requireOnboarded && !isOnboarded) return <Navigate to="/onboarding" />;
  if (requireRole && userData?.role !== requireRole) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  const { user } = useAuth();
  usePresenceTracker();
  useNotifications();

  // Show PWA install prompt once per session after login
  React.useEffect(() => {
    if (user) {
      const sessionKey = `univibe_prompt_shown_${user.uid}`;
      const alreadyShown = sessionStorage.getItem(sessionKey);
      
      if (!alreadyShown) {
        // Short delay to let the app settle
        const timer = setTimeout(() => {
          import('@/components/layout/PwaInstallPrompt').then(module => {
            if (!module.isPwaInstalled()) {
              module.requestPwaInstallPrompt();
              sessionStorage.setItem(sessionKey, 'true');
            }
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  return (
    <Router>
      <div className="min-h-screen bg-[#020202] text-zinc-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Information Routes (Public) */}
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/banned" element={<BannedPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Discovery /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute>
              <AppLayout><Search /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/matches" element={
            <ProtectedRoute>
              <AppLayout><Matches /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout><ChatList /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <AppLayout><Notifications /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarded={false}>
              <OnboardingWizard />
            </ProtectedRoute>
          } />
          
          <Route path="/verify-email" element={
            <ProtectedRoute requireVerified={false} requireOnboarded={false}>
              <VerifyEmail />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><AdminUsers /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><AdminReports /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/content" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><AdminContent /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><AdminLogs /></AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
        <PwaInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
