import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Users, MessageCircle, User, Zap, Bell } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const { userData } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { icon: Home, path: '/', label: 'Home', badge: 0 },
    {
      icon: userData?.role === 'admin' ? Zap : Search,
      path: userData?.role === 'admin' ? '/admin' : '/search',
      label: userData?.role === 'admin' ? 'Command' : 'Search',
      badge: 0,
    },
    { icon: Users, path: '/matches', label: 'Circle', badge: 0 },
    { icon: MessageCircle, path: '/chat', label: 'Inbox', badge: 0 },
    { icon: User, path: '/profile', label: 'Profile', badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-white/[0.06] bg-[#020202]/97 pb-[env(safe-area-inset-bottom,16px)] backdrop-blur-xl">
      {navItems.map(({ icon: Icon, path, label }) => {
        // Show notification badge on Profile tab
        const showBadge = label === 'Profile' && unreadCount > 0;

        return (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 transition-all duration-300 px-3 py-1',
                isActive
                  ? 'text-primary scale-110'
                  : 'text-zinc-500 hover:text-zinc-200'
              )
            }
          >
            <div className="relative">
              <Icon size={22} />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-white text-[8px] font-black border-2 border-[#020202]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
