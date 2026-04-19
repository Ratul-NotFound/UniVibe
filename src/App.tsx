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
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminReports from '@/pages/admin/Reports';
import AppLayout from '@/components/layout/AppLayout';

// Placeholder Pages
const Chat = () => <div className="p-8 text-center pt-20">Chat rooms coming soon...</div>;

// Route Guard Component
const ProtectedRoute = ({ children, requireVerified = true, requireOnboarded = true, requireRole }: { 
  children: React.ReactNode, 
  requireVerified?: boolean, 
  requireOnboarded?: boolean,
  requireRole?: 'admin' | 'moderator' | 'user'
}) => {
  const { user, userData, loading, isVerified, isOnboarded } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (requireVerified && !isVerified) return <Navigate to="/verify-email" />;
  if (requireOnboarded && !isOnboarded) return <Navigate to="/onboarding" />;
  if (requireRole && userData?.role !== requireRole) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
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
          <Route path="/admin/logs" element={
            <ProtectedRoute requireRole="admin">
              <AdminLayout><div className="p-8">Admin Logs coming soon...</div></AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
