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
    <div className={`relative bg-zinc-900 border border-white/[0.05] rounded-[1.5rem] p-6 transition-all duration-300 group ${
      isActive ? 'border-primary/20' : 'hover:border-white/20'
    }`}>
       <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
             <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all ${
                isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-zinc-400'
             }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Zap size={20} className={isFlash ? 'text-primary' : ''} />}
             </div>
             <div>
               <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1.5 font-mono ${
                 isCompleted ? 'text-emerald-500' : isFlash ? 'text-primary' : 'text-zinc-600'
               }`}>
                 {isCompleted ? 'Mission Logged' : isFlash ? 'Passive Mode' : 'Quest Stream'}
               </p>
                <h4 className="text-xl font-black italic uppercase tracking-tighter text-white/90">
                   {mission.title}
                </h4>
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] font-black text-white">
             <Coins size={12} className="text-zinc-500" /> {mission.reward}
          </div>
       </div>

       {/* Sharp Progress Gauge */}
       <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-[7px] font-bold text-zinc-500 uppercase tracking-[0.4em] font-mono">
             <span>Efficiency Link</span>
             <span className={isCompleted ? 'text-emerald-500' : 'text-zinc-400'}>{mission.progress} / {mission.total}</span>
          </div>
          
          <div className="w-full h-[3px] bg-zinc-800 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }} 
               animate={{ width: `${progress}%` }} 
               className={`h-full transition-all duration-1000 ${
                 isCompleted ? 'bg-emerald-500' : 'bg-white'
               }`}
             />
          </div>
       </div>

       <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">
             <div className={`h-1 w-1 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
             {isCompleted ? 'System Stable' : 'Awaiting Data'}
          </div>
          
          {!isCompleted && !isActive && !isFlash ? (
            <button 
              onClick={() => onAccept(mission.id)}
              className="px-5 py-2.5 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              Link <ChevronRight size={10} />
            </button>
          ) : (
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
               {isCompleted ? 'STABLE' : 'LOGGING'}
            </span>
          )
       }
       </div>
    </div>
  );
};
