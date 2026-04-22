import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, Search, Heart, MessageCircle, User, 
  Settings, LogOut, Compass, Sparkles, Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DesktopSidebar = () => {
    const { user, userData } = useAuth();

  const navItems = [
    { icon: Home, path: '/', label: 'Frequency', desc: 'Main Discovery' },
    { icon: Search, path: '/search', label: 'Signal', desc: 'Search Platform' },
    { icon: Heart, path: '/matches', label: 'Circle', desc: 'Your Connections' },
    { icon: MessageCircle, path: '/chat', label: 'Encrypted', desc: 'Private Inbox' },
    { icon: User, path: '/profile', label: 'Identity', desc: 'Personal Profile' },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden lg:flex h-screen w-80 flex-col border-r border-white/5 bg-[#020202] py-10 px-8 z-50">
      {/* Editorial Logo */}
      <div className="mb-14 px-2">
        <Link to="/" className="group inline-flex flex-col">
          <span className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none group-hover:text-primary transition-colors">
            UniVibe
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-1">
            Terminal v0.2
          </span>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-6">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-4 px-2">
          Operations
        </div>
        {navItems.map(({ icon: Icon, path, label, desc }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-5 p-4 rounded-2xl border border-transparent transition-all duration-300',
                isActive 
                  ? 'bg-zinc-900 border-white/5 shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
                  : 'hover:bg-zinc-900/50 hover:border-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-3 rounded-xl transition-all duration-500",
                  isActive ? "bg-primary text-black" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest transition-colors",
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                  )}>
                    {label}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-tighter mt-0.5">
                    {desc}
                  </span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center gap-4 p-2">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
             {user?.photoURL ? (
               <img src={user.photoURL} alt={userData?.name} className="h-full w-full object-cover grayscale opacity-60" />
             ) : (
               <div className="flex h-full w-full items-center justify-center text-zinc-600">
                 <User size={18} />
               </div>
             )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black uppercase text-white truncate max-w-[120px]">
              {userData?.name || 'Authorized'}
            </span>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter truncate">
              {userData?.role || 'Operator'}
            </span>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="ml-auto h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 hover:text-rose-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
