import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020202]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5,
          ease: "easeOut"
        }}
        className="relative"
      >
        <img 
          src="/univibe-logo.png" 
          alt="UniVibe Logo" 
          className="h-24 w-24 object-contain"
        />
        
        {/* Subtle Pulse Effect */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-2xl font-black italic uppercase tracking-[0.3em] text-white">
          UniVibe
        </h1>
        <div className="mt-4 flex items-center justify-center gap-1">
          <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-primary [animation-delay:0.2s]" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-primary [animation-delay:0.4s]" />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
