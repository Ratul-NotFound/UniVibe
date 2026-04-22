import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: Heart, path: '/matches', label: 'Matches' },
    { icon: MessageCircle, path: '/chat', label: 'Chat' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-zinc-100 bg-white/80 pb-[env(safe-area-inset-bottom,16px)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      {navItems.map(({ icon: Icon, path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 transition-all duration-300',
              isActive 
                ? 'text-primary scale-110' 
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            )
          }
        >
          <div className="relative">
            <Icon size={24} />
            {/* Notification Dot example */}
            {label === 'Chat' && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
