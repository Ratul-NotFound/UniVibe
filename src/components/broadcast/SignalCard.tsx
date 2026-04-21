import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Clock, MapPin, Users, 
  MessageSquare, Ghost, Share2, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SIGNAL_THEMES } from '@/hooks/useBroadcasts';

interface SignalCardProps {
  signal: any;
  onJoin: (id: string) => void;
  onOpenPortal: (id: string) => void;
  onIgnite: (id: string) => void;
  currentUser: any;
}

export const SignalCard: React.FC<SignalCardProps> = ({ 
  signal, onJoin, onOpenPortal, onIgnite, currentUser 
}) => {
  const theme = SIGNAL_THEMES[signal.category as keyof typeof SIGNAL_THEMES] || SIGNAL_THEMES.broadcast;
  const isJoined = signal.interactors?.includes(currentUser?.uid);
  const isOwner = signal.fromUid === currentUser?.uid;

  // Calculate life remaining
  const [percentLeft, setPercentLeft] = useState(100);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = signal.createdAt?.toMillis() || now;
      const end = signal.expiresAt?.toMillis() || now;
      const total = end - start;
      const left = end - now;
      
      const p = Math.max(0, Math.min(100, (left / total) * 100));
      setPercentLeft(p);

      const mins = Math.max(0, Math.floor(left / 60000));
      if (mins > 60) {
        setTimeLeft(`${Math.floor(mins/60)}h ${mins%60}m`);
      } else {
        setTimeLeft(`${mins}m`);
      }
    };

    update();
    const interval = setInterval(update, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [signal]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group p-6 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 hover:scale-[1.01] ${
        signal.priority > 0 
          ? 'bg-gradient-to-br from-primary/10 via-zinc-900/40 to-primary/5 border-primary/40 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' 
          : 'bg-zinc-900/40 border-white/[0.03] hover:border-white/[0.08]'
      }`}
    >
      {/* Priority Glow */}
      {signal.priority > 0 && (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-transparent to-primary/50 rounded-[2.5rem] -z-10 blur-sm opacity-50 block" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full overflow-hidden border border-white/10 ${signal.isAnonymous ? 'bg-zinc-800 flex items-center justify-center p-2' : ''}`}>
            {signal.isAnonymous ? (
              <Ghost size={20} className="text-zinc-500" />
            ) : signal.fromPhotoURL ? (
              <img src={signal.fromPhotoURL} alt={signal.fromName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-black italic text-primary text-xs bg-zinc-800">
                {signal.fromName?.[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-white uppercase tracking-widest">{signal.fromName}</span>
              {signal.priority > 0 && <Flame size={12} className="text-orange-500 animate-pulse fill-orange-500" />}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${theme.bg} ${theme.color}`}>
                {theme.icon} {theme.label}
              </span>
              <span className="flex items-center gap-1 text-[8px] font-bold text-zinc-500 uppercase">
                <MapPin size={8} /> {signal.zone}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase">
            <Clock size={10} className={percentLeft < 20 ? 'text-rose-500 animate-pulse' : ''} />
            <span className={percentLeft < 20 ? 'text-rose-500' : ''}>{timeLeft} left</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6 pl-[52px]">
        <p className="text-sm text-zinc-200 font-medium leading-relaxed italic opacity-90 break-words">
          "{signal.content}"
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pl-[52px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 group/stat">
            <div className={`h-8 px-3 rounded-xl flex items-center gap-2 transition-colors ${isJoined ? 'bg-primary/20 text-primary' : 'bg-white/[0.03] text-zinc-500 hover:bg-white/[0.05]'}`}>
               <Users size={12} className={isJoined ? 'fill-primary' : ''} />
               <span className="text-[10px] font-black uppercase">{signal.interestCount || 0}</span>
            </div>
          </div>
          <button className="text-zinc-600 hover:text-primary transition-colors">
            <Share2 size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isOwner && signal.priority === 0 && (
             <Button variant="ghost" size="sm" onClick={() => onIgnite(signal.id)} className="h-9 px-3 rounded-xl border border-white/[0.03] hover:bg-orange-500 group/ignite">
                <Flame size={14} className="text-orange-500 group-hover/ignite:text-white transition-colors" />
             </Button>
          )}
          
          {signal.isPortal ? (
            <Button 
              size="sm"
              onClick={() => isJoined ? onOpenPortal(signal.id) : onJoin(signal.id)}
              className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isJoined 
                  ? 'bg-zinc-800 text-white hover:bg-primary border border-primary/20' 
                  : 'bg-primary text-white shadow-lg shadow-primary/20'
              }`}
            >
              {isJoined ? 'Enter Portal' : 'I\'m Interested'}
            </Button>
          ) : (
            <Button 
              variant={isJoined ? "outline" : "primary"}
              size="sm"
              onClick={() => onJoin(signal.id)}
              disabled={isJoined}
              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              {isJoined ? 'Joined' : 'Wave Back'}
            </Button>
          )}
        </div>
      </div>

      {/* Energy Burn Bar */}
      <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-white/[0.03] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentLeft}%` }}
          className={`h-full rounded-full ${percentLeft < 25 ? 'bg-rose-500 animate-pulse' : 'bg-primary'}`}
          transition={{ duration: 1 }}
        />
      </div>
    </motion.div>
  );
};
