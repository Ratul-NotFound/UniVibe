import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { PollBattle } from '@/hooks/usePolls';

interface PollCardProps {
  poll: PollBattle;
  onVote: (side: 'left' | 'right') => void;
  currentUser: any;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote, currentUser }) => {
  const hasVoted = poll.voters?.includes(currentUser?.uid);
  const totalVotes = (poll.left?.votes || 0) + (poll.right?.votes || 0);
  
  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const leftPercent = getPercentage(poll.left?.votes || 0);
  const rightPercent = getPercentage(poll.right?.votes || 0);

  return (
    <div className="bg-zinc-900/50 p-10 rounded-[4rem] border border-white/[0.03] relative group overflow-hidden transition-all hover:border-white/10 hover:bg-zinc-900">
       <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
             <div className="px-5 py-2 bg-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-white/[0.02]">
                {poll.category || 'Debate'}
             </div>
             <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {totalVotes} Votes Cast
             </div>
          </div>

          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-12 px-4 leading-tight">
            {poll.title}
          </h3>

          <div className="flex items-center justify-center gap-10 relative mb-12">
             {/* Left Option */}
             <div className="flex-1 flex flex-col items-center gap-6">
                <button 
                  onClick={() => !hasVoted && onVote('left')}
                  disabled={hasVoted}
                  className={`h-28 w-28 rounded-full flex items-center justify-center text-5xl transition-all relative ${
                    hasVoted ? 'cursor-default' : 'hover:scale-110 active:scale-95 shadow-2xl shadow-primary/20'
                  } bg-primary/10 border-2 border-primary/20 text-white`}
                >
                   {poll.left?.icon}
                   {hasVoted && leftPercent >= rightPercent && (
                     <div className="absolute -right-2 -top-2 bg-emerald-500 rounded-full p-1 border-4 border-zinc-900 scale-110 shadow-lg">
                        <Trophy size={16} fill="white" className="text-white" />
                     </div>
                   )}
                </button>
                <span className="text-[12px] font-black uppercase text-center tracking-tighter text-zinc-400">
                  {poll.left?.name}
                </span>
             </div>

             {/* VS Divider */}
             <div className="h-14 w-14 bg-black border-2 border-white/10 rounded-full flex items-center justify-center text-[11px] font-black italic shrink-0 z-10 shadow-xl shadow-black/50">
                VS
             </div>

             {/* Right Option */}
             <div className="flex-1 flex flex-col items-center gap-6">
                <button 
                  onClick={() => !hasVoted && onVote('right')}
                  disabled={hasVoted}
                  className={`h-28 w-28 rounded-full flex items-center justify-center text-5xl transition-all relative ${
                    hasVoted ? 'cursor-default' : 'hover:scale-110 active:scale-95 shadow-2xl shadow-amber-500/20'
                  } bg-amber-500/10 border-2 border-amber-500/20 text-white`}
                >
                   {poll.right?.icon}
                   {hasVoted && rightPercent > leftPercent && (
                     <div className="absolute -left-2 -top-2 bg-emerald-500 rounded-full p-1 border-4 border-zinc-900 scale-110 shadow-lg">
                        <Trophy size={16} fill="white" className="text-white" />
                     </div>
                   )}
                </button>
                <span className="text-[12px] font-black uppercase text-center tracking-tighter text-zinc-400">
                  {poll.right?.name}
                </span>
             </div>
          </div>

          <AnimatePresence>
             {hasVoted && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-4 pt-4"
               >
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                     <span className="text-primary">{leftPercent}%</span>
                     <span className="text-amber-500">{rightPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/[0.03]">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${leftPercent}%` }}
                       className="h-full bg-primary"
                     />
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${rightPercent}%` }}
                       className="h-full bg-amber-500"
                     />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest pt-2">
                     <CheckCircle2 size={12} /> Vote Registered
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
       </div>

       {/* Back Decor */}
       <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
};
