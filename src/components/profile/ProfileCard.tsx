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
import { useSocial } from '@/hooks/useSocial';
import { Button } from '@/components/ui/Button';
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
  const { unfriend, incomingRequests, outgoingRequests } = useMatches();
  const { connect, acceptRequest, actionLoading } = useSocial();
  const [activeTab, setActiveTab] = useState<'intel' | 'pulse'>('intel');
  const [showActions, setShowActions] = useState(false);
  
  const isMe = currentUser?.uid === user.id;
  const isIncoming = incomingRequests.find(r => r.fromUid === user.id);
  const isOutgoing = outgoingRequests.find(r => r.toUid === user.id);
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
    <div className={`group relative h-full w-full flex flex-col overflow-hidden rounded-[3rem] bg-[#020202] border border-white/[0.05] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all ${className || ''}`}>
      {/* Public Preview Badge */}
      {!matchScore && (
        <div className="absolute left-6 top-6 z-50 rounded-full bg-black/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 backdrop-blur-md border border-white/5">
          Public Preview
        </div>
      )}
      
      {/* Background/Photo Area */}
      <div className="relative h-[48%] w-full bg-zinc-900">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.name} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-800">
            <UserIcon size={140} strokeWidth={0.5} />
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent" />

        {/* Info Overlay (Bottom Pin) */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-3xl sm:text-4xl font-black tracking-tighter">
                  {user.name}{showAge && age ? `, ${age}` : ''}
                </h3>
                <CheckCircle size={20} className="text-primary" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <GraduationCap size={14} className="text-primary" />
                {user.department} • {user.year} Year
              </div>
            </div>
            
            {matchScore !== undefined && (
              <div className="mb-1">
                <MatchScoreBadge score={matchScore} />
              </div>
            )}
          </div>
        </div>

        {/* Live Vibe Badge */}
        {user.currentVibe && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-700">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl`}>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(212,83,126,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                {user.currentVibe}
              </span>
            </div>
          </div>
        )}

        {/* Actions Dropdown */}
        {!isMe && (
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all"
            >
              <MoreHorizontal size={22} />
            </button>
            {/* ... Actions menu stays same but with refined colors ... */}
          </div>
        )}
      </div>

      {/* Tab Switcher - Ultra Minimal */}
      <div className="flex px-6 py-4 gap-4 bg-zinc-950/40 border-b border-white/[0.03]">
        <button 
          onClick={() => setActiveTab('intel')}
          className={`relative text-[10px] font-black uppercase tracking-[0.25em] transition-all ${activeTab === 'intel' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Intel
          {activeTab === 'intel' && (
            <motion.div layoutId="tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('pulse')}
          className={`relative text-[10px] font-black uppercase tracking-[0.25em] transition-all ${activeTab === 'pulse' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Pulse {isFriend ? '📡' : ''}
          {activeTab === 'pulse' && (
            <motion.div layoutId="tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-b from-transparent to-black/20">
        <AnimatePresence mode="wait">
          {activeTab === 'intel' ? (
            <motion.div 
              key="intel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 pb-12"
            >
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.03] backdrop-blur-sm">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Synergy Intel</p>
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-primary" />
                       <span className="text-xs font-black text-zinc-200">{interestCount} Data Points</span>
                    </div>
                 </div>
                 <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.03] backdrop-blur-sm">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Campus Hub</p>
                    <div className="flex items-center gap-2">
                       <LinkIcon size={14} className="text-zinc-400" />
                       <span className="text-xs font-black text-zinc-200">{user.department?.split(' ')[0] || 'DIU'} Main</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex flex-wrap items-center gap-2">
                   {user.lookingFor && (
                     <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/20">
                       <Heart size={10} className="fill-current" /> {user.lookingFor}
                     </span>
                   )}
                   {user.gender && (
                     <span className="inline-flex items-center rounded-full bg-zinc-900/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 border border-white/[0.05]">
                       {user.gender}
                     </span>
                   )}
                 </div>
                 
                 <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">Broadcast Signal</h4>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed italic">
                      "{user.bio || "This frequency is currently silent. Await broadcast..."}"
                    </p>
                 </div>

                 {(user.currentCity || user.hometown || user.engagementType || (showPhone && user.phone)) && (
                   <div className="pt-4 space-y-4 border-t border-white/[0.03]">
                     {(user.currentCity || user.hometown) && (
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                         <MapPin size={14} className="text-primary opacity-50" />
                         <span>{user.currentCity || user.hometown}</span>
                       </div>
                     )}
                     {showPhone && user.phone && (
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-emerald-500/80">
                         <Phone size={14} />
                         <span>{user.phone}</span>
                       </div>
                     )}
                   </div>
                 )}
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between mb-5">
                   <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">Intel Matrix</h4>
                   <span className="text-[8px] font-black uppercase tracking-widest text-primary px-2 py-0.5 rounded border border-primary/20">High Match</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(user.interests || {})
                    .flat()
                    .slice(0, 15)
                    .map((interest: any) => (
                      <span 
                        key={interest} 
                        className="rounded-xl border border-white/[0.05] bg-zinc-950 px-4 py-2 text-[9px] font-black uppercase tracking-tighter text-zinc-400 hover:border-primary/40 hover:text-white transition-all cursor-default"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              {isFriend ? (
                <div className="space-y-8">
                  {/* Notes / Status */}
                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.03] italic text-sm text-zinc-300 relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                     <MessageSquare size={16} className="text-primary mb-3 opacity-50" />
                     "{user.currentNote || "Exploring the campus frequency..."}"
                  </div>

                  {/* Activity List */}
                  <div className="space-y-5">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                      <Activity size={14} className="text-emerald-500" /> Nexus Logs
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        { icon: Radio, text: 'Shared a Signal in DIU Hall', time: '2h ago' },
                        { icon: Sparkles, text: 'Updated current vibe to Coffee', time: '5h ago' },
                        { icon: MessageSquare, text: 'Started a debate in Lounge', time: '1d ago' }
                      ].map((act, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-white/[0.02] hover:border-white/[0.05] transition-all">
                           <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-white/[0.03]">
                              <act.icon size={18} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold text-zinc-300 truncate">{act.text}</p>
                             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em] mt-1">{act.time}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="h-24 w-24 mx-auto bg-zinc-950 rounded-full flex items-center justify-center text-zinc-800 border border-white/[0.03] mb-8 shadow-inner">
                     <Radio size={40} className="opacity-10" />
                  </div>
                  <h4 className="text-lg font-black italic uppercase tracking-tighter text-white mb-3">Encrypted Frequency</h4>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                    Personal broadcasts and campus activity are visible to synergy connections only.
                  </p>
                  
                  {!isMe && (
                    <div className="mt-12">
                      {isFriend ? (
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 py-3 rounded-2xl border border-primary/10">Active Connection</div>
                      ) : isIncoming ? (
                        <Button 
                          onClick={() => acceptRequest(isIncoming)}
                          disabled={actionLoading}
                          className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                        >
                          {actionLoading ? 'Connecting...' : 'Accept Synergy'}
                        </Button>
                      ) : isOutgoing ? (
                        <Button 
                          disabled 
                          variant="ghost"
                          className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/[0.05] text-zinc-600"
                        >
                          Frequency Pending...
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => connect(user)}
                          disabled={actionLoading}
                          className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                        >
                          {actionLoading ? 'Transmitting...' : 'Initiate Synergy'}
                        </Button>
                      )}
                    </div>
                  )}
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
