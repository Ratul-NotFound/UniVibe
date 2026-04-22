import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, MapPin, Zap, ChevronRight } from 'lucide-react';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';

interface DiscoveryCardProps {
  user: any;
  synergyScore: number;
  onConnect: (uid: string) => void;
  onViewProfile: (user: any) => void;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ user, synergyScore, onConnect, onViewProfile }) => {
  const { isOnline } = usePresenceStatus(user.id);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-zinc-900 border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col group hover:border-white/20 transition-all duration-500"
    >
       {/* Editorial Content Layout */}
       <div className="p-5 sm:p-8 flex flex-col h-full">
          {/* Top Metadata */}
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-white shadow-[0_0_10px_white]' : 'bg-zinc-800'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 font-mono">
                   {isOnline ? 'Live Connection' : 'Archived'}
                </span>
             </div>
             <div className="px-4 py-1.5 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest">
                {synergyScore}% Synergy
             </div>
          </div>

          {/* Profile Imagery (Editorial Style) */}
          <div className="relative mb-6 sm:mb-8 cursor-pointer overflow-hidden rounded-[1.5rem]" onClick={() => onViewProfile(user)}>
             <div className="h-40 sm:h-48 w-full bg-zinc-800 border border-white/5 relative">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-700">
                     <User size={48} strokeWidth={1} />
                  </div>
                )}
             </div>
             {user.currentVibe && (
                <div className="absolute right-4 bottom-4 px-4 py-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 shadow-2xl">
                   <Zap size={14} className="text-white" fill="white" />
                   <span className="text-[9px] font-black uppercase text-white tracking-widest">{user.currentVibe}</span>
                </div>
             )}
          </div>

          {/* Human-Centric Details */}
          <div className="flex-1 space-y-6">
             <div>
                <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">
                   {user.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                   <MapPin size={10} />
                   <span>{user.department || 'Academic Dept'} // CLASS OF {user.year || '24'}</span>
                </div>
             </div>

             <div className="flex flex-wrap gap-2">
                {Array.isArray(user.interests) && user.interests.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 bg-black border border-white/5 rounded-lg text-[8px] font-black uppercase text-zinc-500 hover:text-white transition-colors cursor-default">
                     #{tag}
                  </span>
                ))}
             </div>
          </div>

          {/* Editorial Actions */}
          <div className="mt-10 flex gap-2">
             <button 
               onClick={() => onConnect(user.id)}
               className="flex-1 h-14 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
             >
                <Sparkles size={14} fill="black" /> Transmit Spark
             </button>
             <button 
               onClick={() => onViewProfile(user)}
               className="h-14 w-14 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-zinc-700 transition-all active:scale-95"
             >
                <ChevronRight size={20} />
             </button>
          </div>
       </div>
    </motion.div>
  );
};
