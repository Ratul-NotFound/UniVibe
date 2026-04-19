import React from 'react';
import { User as UserIcon, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import MatchScoreBadge from './MatchScoreBadge';

interface ProfileCardProps {
  user: any; // User type to be defined in types/
  matchScore?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, matchScore }) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
      {/* Background/Photo Area */}
      <div className="relative h-[70%] w-full bg-zinc-100 dark:bg-zinc-800">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
            <UserIcon size={120} strokeWidth={1} />
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Info Overlay (Bottom Pin) */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight">
                {user.name}, {user.year}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium opacity-90">
                <GraduationCap size={16} />
                {user.department}
              </div>
            </div>
            
            {matchScore !== undefined && (
              <div className="mb-2">
                <MatchScoreBadge score={matchScore} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 pb-8">
        <div className="flex flex-wrap gap-1.5">
          {user.lookingFor && (
            <span className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary dark:bg-primary/20">
              Looking for {user.lookingFor}
            </span>
          )}
        </div>
        
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {user.bio || "No bio yet. Ask me something!"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.values(user.interests || {})
            .flat()
            .slice(0, 4)
            .map((interest: any) => (
              <span 
                key={interest} 
                className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400"
              >
                {interest}
              </span>
            ))}
          {(Object.values(user.interests || {}).flat().length > 4) && (
            <span className="px-1 text-[10px] font-bold text-zinc-400">
              +{Object.values(user.interests || {}).flat().length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
