import { 
  User as UserIcon, MapPin, GraduationCap, Briefcase, Sparkles, 
  CalendarDays, Phone, CheckCircle, Radio, Activity, MessageSquare,
  MoreHorizontal, Shield, UserMinus, AlertTriangle, Flame, Clock, 
  Zap, Heart, Link as LinkIcon, Award
} from 'lucide-react';
import React, { useState } from 'react';
import MatchScoreBadge from './MatchScoreBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafety } from '@/hooks/useSafety';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface ProfileCardProps {
  user: any; // User type to be defined in types/
  matchScore?: number;
  className?: string;
  isFriend?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, matchScore, className, isFriend }) => {
  const { user: currentUser } = useAuth();
  const { blockUser, reportUser } = useSafety();
  const { unfriend } = useMatches();
  const [activeTab, setActiveTab] = useState<'intel' | 'pulse'>('intel');
  const [showActions, setShowActions] = useState(false);
  
  const isMe = currentUser?.uid === user.id;
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
  const showPhone = user.privacy?.phone === 'public' || (user.privacy?.phone === 'friends' && isFriend);

  return (
    <div className={`group relative h-full w-full flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all hover:shadow-primary/10 dark:bg-zinc-900 ${className || ''}`}>
      {/* Public Preview Badge */}
      {!matchScore && (
        <div className="absolute left-6 top-6 z-50 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md ring-1 ring-white/20">
          Public Preview
        </div>
      )}
      {/* Background/Photo Area */}
      <div className="relative h-[45%] w-full bg-zinc-100 dark:bg-zinc-800">
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

        {/* Actions Dropdown */}
        {!isMe && (
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md ring-1 ring-white/20 hover:bg-black/60 transition-all"
            >
              <MoreHorizontal size={20} />
            </button>

            <AnimatePresence>
              {showActions && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowActions(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden p-1.5"
                  >
                    {isFriend && (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Unfriend ${user.name}?`)) unfriend(user.id);
                          setShowActions(false);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <UserMinus size={14} /> Unfriend
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (window.confirm(`Block ${user.name}? This cannot be undone easily.`)) blockUser(user.id);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      <Shield size={14} /> Block User
                    </button>
                    <button 
                      onClick={() => {
                        const reason = window.prompt("Reason for report (Harassment, Inappropriate Content, Spam, etc.):");
                        if (reason) {
                          reportUser(user.id, reason, "User reported from profile view");
                          toast.success("Report submitted to Campus Safety");
                        }
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-all"
                    >
                      <AlertTriangle size={14} /> Report
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex px-4 mt-2 mb-2 gap-1 bg-zinc-950/20 backdrop-blur-md mx-4 rounded-2xl border border-white/[0.03]">
        <button 
          onClick={() => setActiveTab('intel')}
          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${activeTab === 'intel' ? 'text-primary bg-primary/5' : 'text-zinc-600'}`}
        >
          Synergy Intel
        </button>
        <button 
          onClick={() => setActiveTab('pulse')}
          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${activeTab === 'pulse' ? 'text-primary bg-primary/5' : 'text-zinc-600'}`}
        >
          Live Pulse {isFriend ? '• 📡' : ''}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'intel' ? (
            <motion.div 
              key="intel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-5 pb-8"
            >
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="p-3 rounded-2xl bg-zinc-900/40 border border-white/[0.03]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Synergy Stats</p>
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-yellow-500" />
                       <span className="text-xs font-black text-white">{interestCount} Interests</span>
                    </div>
                 </div>
                 <div className="p-3 rounded-2xl bg-zinc-900/40 border border-white/[0.03]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Campus Hub</p>
                    <div className="flex items-center gap-2">
                       <LinkIcon size={14} className="text-primary" />
                       <span className="text-xs font-black text-white">{user.department?.split(' ')[0] || 'DIU'}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex flex-wrap items-center gap-2">
                   {user.lookingFor && (
                     <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/20">
                       <Heart size={10} className="fill-current" /> Looking for {user.lookingFor}
                     </span>
                   )}
                   {user.gender && (
                     <span className="inline-flex items-center rounded-full bg-zinc-800/80 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 border border-white/[0.05]">
                       {user.gender}
                     </span>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Executive Bio</h4>
                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                      {user.bio || "This frequency is currently silent. Await broadcast..."}
                    </p>
                 </div>

                 {(user.currentCity || user.hometown || user.engagementType || (showPhone && user.phone)) && (
                   <div className="pt-2 space-y-2.5">
                     {(user.currentCity || user.hometown) && (
                       <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                         <MapPin size={14} className="text-primary" />
                         <span>
                           {user.currentCity ? user.currentCity : user.hometown}
                         </span>
                       </div>
                     )}
                     {showPhone && user.phone && (
                       <div className="flex items-center gap-3 text-xs font-bold text-white">
                         <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Phone size={14} />
                         </div>
                         <span>{user.phone}</span>
                       </div>
                     )}
                     {user.engagementType && user.engagementType !== 'None' && (
                       <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                         <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                            <Briefcase size={14} />
                         </div>
                         <span className="capitalize">
                           {user.engagementType.toLowerCase()} • {user.engagementDetails || 'Active'}
                         </span>
                       </div>
                     )}
                   </div>
                 )}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Interests Frequency</h4>
                   <span className="text-[8px] font-black uppercase tracking-tighter text-primary px-2 py-0.5 rounded-md bg-primary/10">Active Match</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(user.interests || {})
                    .flat()
                    .slice(0, 12)
                    .map((interest: any) => (
                      <span 
                        key={interest} 
                        className="rounded-lg border border-white/[0.03] bg-zinc-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-tight text-zinc-400 hover:border-primary/30 hover:text-white transition-all cursor-default"
                      >
                        {interest}
                      </span>
                    ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="pulse"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-5"
            >
              {isFriend ? (
                <div className="space-y-6">
                  {/* Notes / Status */}
                  <div className="p-4 rounded-2xl bg-zinc-800/40 border border-white/5 italic text-sm text-zinc-300 relative">
                     <MessageSquare size={12} className="absolute -top-1 -left-1 text-primary opacity-50" />
                     "{user.currentNote || "Exploring the campus frequency..."}"
                  </div>

                  {/* Activity List */}
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                      <Activity size={12} className="text-emerald-500" /> Recent Nexus Activity
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        { icon: Radio, text: 'Shared a Signal in DIU Hall', time: '2h ago' },
                        { icon: Sparkles, text: 'Updated current vibe to Coffee', time: '5h ago' },
                        { icon: MessageSquare, text: 'Started a debate in Lounge', time: '1d ago' }
                      ].map((act, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                           <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <act.icon size={14} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-medium text-zinc-300 truncate">{act.text}</p>
                             <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">{act.time}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 mx-auto bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700 border border-white/5 mb-4">
                     <Radio size={28} className="opacity-20" />
                  </div>
                  <h4 className="text-sm font-black italic uppercase tracking-tight text-white mb-2">Encrypted Broadcast</h4>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                    Personal broadcasts and campus activity are visible to synergy connections only.
                  </p>
                  <button className="mt-8 px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    Send Synergy Spark
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileCard;
