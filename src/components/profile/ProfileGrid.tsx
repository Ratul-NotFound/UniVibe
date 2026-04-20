import React from 'react';
import { motion } from 'framer-motion';

interface ProfileGridProps {
  profiles: any[];
  onProfileClick: (profile: any) => void;
}

const ProfileGrid: React.FC<ProfileGridProps> = ({ profiles, onProfileClick }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {profiles.map((profile, index) => (
        (() => {
          const displayName = profile.name || profile.username || 'Student';
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onProfileClick(profile)}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-card bg-zinc-100 dark:bg-zinc-800"
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={displayName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                  <span className="text-4xl font-black">{initial}</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

              {/* Info */}
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <p className="text-xs font-black tracking-tight">{displayName}</p>
                <p className="text-[10px] font-medium opacity-80">{profile.department || 'Department not set'}</p>
              </div>

              {/* Match Pill */}
              <div className="absolute right-2 top-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white backdrop-blur-md">
                  {profile.matchScore}%
                </div>
              </div>
            </motion.div>
          );
        })()
      ))}
    </div>
  );
};

export default ProfileGrid;
