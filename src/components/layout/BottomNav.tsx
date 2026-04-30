import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, User, Users, Bell, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const { userData } = useAuth();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: userData?.role === 'admin' ? Zap : Search, path: userData?.role === 'admin' ? '/admin' : '/search', label: userData?.role === 'admin' ? 'Command' : 'Search' },
    { icon: Users, path: '/matches', label: 'Circle' },
    { icon: MessageCircle, path: '/chat', label: 'Inbox' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-white/[0.06] bg-[#020202]/95 pb-[env(safe-area-inset-bottom,16px)] backdrop-blur-xl">
      {navItems.map(({ icon: Icon, path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 transition-all duration-300',
              isActive 
                ? 'text-primary scale-110' 
                : 'text-zinc-500 hover:text-zinc-200'
            )
          }
        >
          <div className="relative">
            <Icon size={22} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
