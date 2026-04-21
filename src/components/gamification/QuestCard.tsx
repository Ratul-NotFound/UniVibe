import React from 'react';
import { motion } from 'framer-motion';
import { Coins, ChevronRight, CheckCircle2, Zap } from 'lucide-react';

interface QuestCardProps {
  mission: any;
  onAccept: (id: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ mission, onAccept }) => {
  const isCompleted = mission.status === 'Completed';
  const isActive = mission.status === 'Active';
  const isFlash = mission.isFlash || mission.id.startsWith('f');
  const progress = (mission.progress / mission.total) * 100;

  return (
    <div className={`relative p-[1px] rounded-[3.5rem] overflow-hidden transition-all duration-700 ${
      isActive ? 'shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]' : 'shadow-xl'
    }`}>
       {/* Iridescent Animated Border */}
       <motion.div 
         animate={{ rotate: 360 }}
         transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
         className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(var(--primary-rgb),0.3),transparent,rgba(56,189,248,0.3),transparent)] opacity-40"
       />

       <div className="relative bg-[#020202]/80 backdrop-blur-3xl rounded-[3.5rem] p-8 h-full overflow-hidden">
          {/* Glass Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

          <div className="flex justify-between items-start mb-8 relative z-10">
             <div className="flex gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-colors ${
                   isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-primary/5 border-primary/20 text-primary'
                }`}>
                   {isCompleted ? <CheckCircle2 size={24} /> : <Zap size={24} fill={isFlash ? "currentColor" : "none"} className={isFlash ? 'animate-pulse' : ''} />}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 leading-none ${
                    isCompleted ? 'text-emerald-500' : isFlash ? 'text-blue-400' : 'text-zinc-500'
                  }`}>
                    {isCompleted ? 'Mission Logged' : isFlash ? 'Passive Mode' : 'Quest Stream'}
                  </p>
                   <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white/90">
                      {mission.title}
                   </h4>
                </div>
             </div>
             
             <div className="flex flex-col items-end gap-1.5">
                <div className="px-5 py-2.5 bg-zinc-900 border border-white/[0.05] text-white rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-xl">
                   <Coins size={14} className="text-yellow-400" fill="currentColor" /> +{mission.reward}
                </div>
                {mission.vibeReward && (
                   <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic">+{mission.vibeReward} Vibe Energy</span>
                )}
             </div>
          </div>

          {/* Liquid Neon Progress Bar */}
          <div className="space-y-3 mb-6 relative z-10">
             <div className="flex justify-between items-center text-[9px] font-medium text-zinc-500 uppercase tracking-[0.2em] font-mono">
                <span>Phase Link</span>
                <span className={isCompleted ? 'text-emerald-500' : 'text-zinc-300'}>{mission.progress} // {mission.total}</span>
             </div>
             
             <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.03] p-1 shadow-inner relative group">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progress}%` }} 
                  className={`h-full rounded-full relative transition-all duration-1000 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                      : 'bg-gradient-to-r from-primary to-blue-500 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]'
                  }`}
                >
                   {/* Bubbling Liquid Effect */}
                   {!isCompleted && (
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }} 
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-0 bg-white/20 blur-sm opacity-50"
                      />
                   )}
                </motion.div>
             </div>
          </div>

          <div className="flex justify-between items-center pt-2 relative z-10">
             <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                <div className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-primary shadow-[0_0_10px_#ff00ff]'}`} />
                {isCompleted ? 'System Stable' : 'Live Syncing...'}
             </div>
             
             {!isCompleted && !isActive && !isFlash ? (
               <button 
                 onClick={() => onAccept(mission.id)}
                 className="px-6 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
               >
                 Link Quest <ChevronRight size={10} />
               </button>
             ) : (
               <span className={`text-[10px] font-black uppercase tracking-tighter ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                  {isCompleted ? 'VERIFIED' : 'ACTIVE_LOG'}
               </span>
             )
          }
          </div>
       </div>
    </div>
  );
};
