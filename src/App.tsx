import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';

// Placeholder Pages
const Home = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen">
    <h1 className="text-4xl font-black text-primary mb-4">UniVibe</h1>
    <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
    <p className="text-zinc-600 dark:text-zinc-400">Discover swipe cards coming soon...</p>
    <button 
      onClick={() => window.location.href = '/login'} 
      className="mt-8 text-sm font-medium text-zinc-500 hover:text-primary underline"
    >
      Sign out (Mock)
    </button>
  </div>
);

// Route Guard Component
const ProtectedRoute = ({ children, requireVerified = true, requireOnboarded = true }: { 
  children: React.ReactNode, 
  requireVerified?: boolean, 
  requireOnboarded?: boolean 
}) => {
  const { user, loading, isVerified, isOnboarded } = useAuth();

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
              <Home />
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

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
