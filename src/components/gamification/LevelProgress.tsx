import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Trophy, Crown } from 'lucide-react';

interface LevelProgressProps {
  vibePoints: number;
}

const getLevelInfo = (points: number) => {
  const level = Math.floor(points / 1000) + 1;
  const currentLevelProgress = points % 1000;
  const percentage = (currentLevelProgress / 1000) * 100;
  
  let rank = 'Freshman';
  let Icon = Star;
  let color = 'text-blue-400';

  if (level >= 10) {
    rank = 'Campus Legend';
    Icon = Crown;
    color = 'text-yellow-400';
  } else if (level >= 5) {
    rank = 'Vibe Master';
    Icon = Trophy;
    color = 'text-primary';
  } else if (level >= 2) {
    rank = 'Active Viber';
    Icon = Shield;
    color = 'text-emerald-400';
  }

  return { level, percentage, rank, Icon, color, nextLevelPoints: 1000 - currentLevelProgress };
};

export const LevelProgress: React.FC<LevelProgressProps> = ({ vibePoints }) => {
  const { level, percentage, rank, Icon, color, nextLevelPoints } = getLevelInfo(vibePoints);

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-[4rem] border border-white/[0.05] relative overflow-hidden group">
       <div className="relative z-10 flex flex-col items-center">
          <div className="relative h-40 w-40 mb-6">
             {/* Circular SVG Progress */}
             <svg className="h-full w-full -rotate-90">
                <circle 
                  cx="80" cy="80" r="70" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="12" 
                />
                <motion.circle 
                  cx="80" cy="80" r="70" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * percentage) / 100 }}
                  className={color}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black italic tracking-tighter">LVL {level}</span>
                <Icon size={24} className={`${color} mt-1`} />
             </div>
          </div>

          <div className="text-center">
             <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${color}`}>{rank}</h3>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Next rank in {nextLevelPoints} VP</p>
          </div>
       </div>

       {/* Decorative Glow */}
       <div className={`absolute -right-20 -bottom-20 w-64 h-64 opacity-20 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${
          level >= 10 ? 'bg-yellow-400' : level >= 5 ? 'bg-primary' : 'bg-blue-400'
       }`} />
    </div>
  );
};
