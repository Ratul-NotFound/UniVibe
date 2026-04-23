import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, CheckCheck, Trash2, Clock, 
  MessageCircle, UserPlus, Zap, ShieldAlert,
  ChevronRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const formatTimeAgo = (date: number | Date) => {
  const now = new Date();
  const diff = now.getTime() - (date instanceof Date ? date.getTime() : date);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Mark as read when entering the page?
    // markAllAsRead();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <UserPlus size={16} className="text-primary" />;
      case 'requestAccepted':
        return <Zap size={16} className="text-yellow-500" />;
      case 'message':
        return <MessageCircle size={16} className="text-secondary" />;
      case 'system':
        return <ShieldAlert size={16} className="text-rose-500" />;
      default:
        return <Bell size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] pt-6 pb-24 lg:pt-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Campus Alerts
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-1">
              {unreadCount} New Signals Received
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button 
                  onClick={markAllAsRead}
                  className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck size={18} />
                </button>
                <button 
                  onClick={clearNotifications}
                  className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-rose-500/50 hover:text-rose-500 transition-all"
                  title="Clear all"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => notif.link && navigate(notif.link)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead 
                      ? 'bg-zinc-900/20 border-white/[0.03] grayscale-[0.5] opacity-60' 
                      : 'bg-zinc-900/60 border-primary/20 shadow-[0_0_20px_rgba(212,83,126,0.05)]'
                  } hover:bg-zinc-900/80 hover:border-primary/30`}
                >
                  {!notif.isRead && (
                    <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${
                      notif.isRead ? 'bg-zinc-800 border-white/5' : 'bg-primary/10 border-primary/20'
                    }`}>
                      {getIcon(notif.type || '')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-[13px] font-black uppercase tracking-tight ${notif.isRead ? 'text-zinc-400' : 'text-white'}`}>
                          {notif.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-600 uppercase">
                          <Clock size={10} />
                          {formatTimeAgo(notif.receivedAt)}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                    </div>

                    <div className="flex items-center text-zinc-800 group-hover:text-primary transition-colors">
                       <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="h-20 w-20 mx-auto rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-800 mb-6">
                  <Bell size={40} className="opacity-20" />
                </div>
                <h3 className="text-sm font-black italic uppercase tracking-widest text-zinc-500">
                  Frequency is clear
                </h3>
                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-2">
                  No new alerts detected in the nexus
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 rounded-[2rem] bg-zinc-900/30 border border-white/5 text-center">
           <Info size={24} className="mx-auto text-primary/20 mb-4" />
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Operational Note</h4>
           <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
              Alerts are ephemeral and will expire after 30 days of inactivity. Stay connected to maintain synergy across the campus frequency.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
