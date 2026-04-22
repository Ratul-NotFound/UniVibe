import { User as UserIcon, MapPin, GraduationCap, Briefcase, Sparkles, CalendarDays, Phone, CheckCircle } from 'lucide-react';
import MatchScoreBadge from './MatchScoreBadge';

interface ProfileCardProps {
  user: any; // User type to be defined in types/
  matchScore?: number;
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, matchScore, className }) => {
  const interestCount = Object.values(user.interests || {}).flat().length;

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age > 0 ? age : null;
  };

  const age = getAge(user.birthDate);
  const showAge = user.privacy?.birthdate !== 'private';
  const showPhone = user.privacy?.phone === 'public' || (user.privacy?.phone === 'friends' && user.isFriend);

  return (
    <div className={`group relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all hover:shadow-primary/10 dark:bg-zinc-900 ${className || ''}`}>
      {/* Public Preview Badge */}
      {!matchScore && (
        <div className="absolute left-6 top-6 z-50 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md ring-1 ring-white/20">
          Public Preview
        </div>
      )}
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
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {user.name}{showAge && age ? `, ${age}` : ''}
                </h3>
                <CheckCircle size={18} className="fill-emerald-500/20 text-emerald-500" />
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold opacity-90">
                <GraduationCap size={16} className="text-primary-foreground/70" />
                {user.department} • {user.year} Year
              </div>
            </div>

            {/* Live Vibe Badge */}
            {user.currentVibe && (
              <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {user.currentVibe}
                  </span>
                </div>
              </div>
            )}
            
            {matchScore !== undefined && (
              <div className="mb-2">
                <MatchScoreBadge score={matchScore} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          {user.lookingFor && (
            <span className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary dark:bg-primary/20">
              Looking for {user.lookingFor}
            </span>
          )}
          {user.gender && (
            <span className="mb-2 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {user.gender}
            </span>
          )}
        </div>
        
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {user.bio || "No bio yet. Ask me something!"}
        </p>

        {(user.currentCity || user.hometown || user.engagementType || (showPhone && user.phone)) && (
          <div className="mt-4 space-y-2">
            {(user.currentCity || user.hometown) && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <MapPin size={14} className="text-primary/60" />
                <span>
                  {user.currentCity ? `Lives in ${user.currentCity}` : ''}
                  {user.currentCity && user.hometown ? ' • ' : ''}
                  {user.hometown ? `From ${user.hometown}` : ''}
                </span>
              </div>
            )}
            {showPhone && user.phone && (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <Phone size={14} className="text-primary" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.engagementType && user.engagementType !== 'None' && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Briefcase size={14} className="text-secondary/60" />
                <span className="capitalize">
                  {user.engagementType.toLowerCase()}
                  {user.engagementDetails ? ` • ${user.engagementDetails}` : ''}
                </span>
              </div>
            )}
          </div>
        )}

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
          {(interestCount > 4) && (
            <span className="px-1 text-[10px] font-bold text-zinc-400">
              +{interestCount - 4} more
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Sparkles size={12} /> Profile vibe
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{interestCount} interests</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
