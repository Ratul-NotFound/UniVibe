import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const MobileHeader = () => {
  const { unreadCount } = useNotifications();
  const location = useLocation();
  
  const isChatRoom = location.pathname.startsWith('/chat/');
  if (isChatRoom) return null;

  // Adaptive Title logic
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'UniVibe';
    if (path === '/search') return 'Discovery';
    if (path === '/matches') return 'Circle';
    if (path === '/chat') return 'Inbox';
    if (path === '/profile') return 'Profile';
    if (path === '/notifications') return 'Alerts';
    return 'UniVibe';
  };

  return (
    <header className="lg:hidden sticky top-0 z-[60] flex h-16 items-center justify-between px-6 bg-[#020202]/95 backdrop-blur-xl border-b border-white/[0.03]">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
          {getPageTitle()}
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link 
          to="/notifications" 
          className="relative p-2 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white transition-all"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white ring-2 ring-[#020202]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
