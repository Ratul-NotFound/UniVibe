import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  History, 
  Settings, 
  ArrowLeft,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (loading) return <div>Loading Admin...</div>;
  if (userData?.role !== 'admin') return <Navigate to="/" />;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Reports', icon: Flag, path: '/admin/reports' },
    { label: 'Logs', icon: History, path: '/admin/logs' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Admin Sidebar (Desktop) */}
      <aside className="fixed bottom-0 left-0 top-0 w-64 border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 max-md:hidden">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-black">UniVibe Admin</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-600">
            <ArrowLeft size={16} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Admin Sidebar (Mobile) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute bottom-0 left-0 top-0 w-64 bg-white p-6 dark:bg-zinc-900">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={24} className="text-primary" />
                <span className="text-xl font-black">Admin</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500">
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-6 sm:p-8 max-md:ml-0">
        {/* Mobile Header */}
        <div className="mb-8 flex items-center justify-between md:hidden">
           <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-primary" />
              <span className="text-xl font-black">Admin Panel</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="rounded-lg bg-white/5 p-2 text-zinc-500">
              <Menu size={24} />
           </button>
        </div>
        
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
