import React from 'react';
import { motion } from 'framer-motion';

interface MatchScoreBadgeProps {
  score: number;
}

const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ score }) => {
  // Color based on score range
  const getColor = (s: number) => {
    if (s >= 80) return 'from-pink-500 to-rose-500';
    if (s >= 50) return 'from-primary to-secondary';
    return 'from-zinc-400 to-zinc-500';
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br p-1 shadow-lg ${getColor(score)}`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-zinc-900">
          <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            {score}%
          </span>
        </div>
        
        {/* Animated ring for high scores */}
        {score >= 80 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute -inset-1 rounded-full bg-gradient-to-br opacity-50 blur-sm ${getColor(score)}`}
          />
        )}
      </motion.div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Match</span>
    </div>
  );
};

export default MatchScoreBadge;
