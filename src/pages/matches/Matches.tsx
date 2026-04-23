import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, where, limit, getDocs, 
  doc, onSnapshot, orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageCircle, Heart, ChevronRight, Mail, X, 
  Search, Filter, Users, Zap, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';

import { NotesRail } from '@/components/social/NotesRail';
import { useNotes } from '@/hooks/useNotes';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { useCircleActivity } from '@/hooks/useCircleActivity';

const PresenceDot = ({ isOnline, className = "" }: { isOnline: boolean; className?: string }) => {
  if (!isOnline) return null;
  return (
    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-500 ${className}`} />
  );
};

const MatchItem = ({ match, onAvatarClick }: { match: any; onAvatarClick: (user: any) => void }) => {
  const navigate = useNavigate();
  const { isOnline } = usePresenceStatus(match.otherUserId);
  const otherUser = match.otherUser;

  if (!otherUser) return null;

  const isSoulmate = match.matchScore >= 90;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-5 py-6 group border-b border-white/[0.03] last:border-0"
    >
      <div 
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(otherUser);
        }}
      >
        <div className={`h-16 w-16 overflow-hidden rounded-[1.5rem] p-0.5 ${isSoulmate ? 'bg-gradient-to-tr from-primary to-blue-500' : 'bg-white/5 border border-white/10'}`}>
          <div className="h-full w-full overflow-hidden rounded-[1.4rem] bg-[#020202]">
            {otherUser.photoURL ? (
              <img src={otherUser.photoURL} alt={otherUser.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-700">
                <Users size={28} />
              </div>
            )}
          </div>
        </div>
        <PresenceDot isOnline={isOnline} className="-bottom-1 -right-1" />
      </div>

      <div 
        className="flex-1 cursor-pointer"
        onClick={() => navigate(`/chat/${match.chatId}`)}
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">{otherUser.name}</h3>
          {isSoulmate && (
            <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
              <Sparkles size={8} fill="currentColor" /> Soulmate
            </div>
          )}
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {otherUser.department || 'Diu'} // {(Array.isArray(match.commonInterests) ? match.commonInterests.slice(0, 2).join(', ') : 'Connected')}
        </p>
      </div>

      <button 
        onClick={() => navigate(`/chat/${match.chatId}`)}
        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 transition-all hover:bg-primary/20 hover:text-primary active:scale-95"
      >
        <MessageCircle size={20} />
      </button>
    </motion.div>
  );
};

const Matches = () => {
  const {
    matches,
    incomingRequests,
    outgoingRequests,
    loading: matchesLoading,
    acceptRequest,
    declineRequest,
    cancelRequest,
  } = useMatches();
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'activity' | 'mutual' | 'incoming' | 'sent'>('activity');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);
  const [activeNoteUid, setActiveNoteUid] = useState<string | null>(null);
  const { notes, myNote } = useNotes();
  const { items: circleItems, loading: circleLoading } = useCircleActivity();
  
  // Friends' live vibes from RTDB
  const [friendVibes, setFriendVibes] = useState<Record<string, { vibe: string; name: string; photoURL: string | null; isOnline?: boolean }>>({});

  useEffect(() => {
    if (!rtdb || matches.length === 0) return;
    const listeners: Array<() => void> = [];

    matches.forEach(match => {
      const uid = match.otherUserId;
      if (!uid) return;
      // Read from presence/{uid} - this path has rules allowing any auth user to read
      const presenceRef = ref(rtdb, `presence/${uid}`);
      const handler = onValue(presenceRef, (snap) => {
        const data = snap.val();
        if (data?.vibe) {
          setFriendVibes(prev => ({
            ...prev,
            [uid]: {
              vibe: data.vibe,
              name: data.name || match.otherUser?.name || 'Friend',
              photoURL: data.photoURL || match.otherUser?.photoURL || null,
              isOnline: data.online === true,
            }
          }));
        } else {
          setFriendVibes(prev => { const n = { ...prev }; delete n[uid]; return n; });
        }
      });
      listeners.push(() => off(presenceRef, 'value', handler));
    });

    return () => listeners.forEach(fn => fn());
  }, [matches]);

  const filteredMatches = matches.filter(m => {
    const name = (m.otherUser?.name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const TabButton = ({ id, label, icon: Icon, count }: { id: typeof activeTab; label: string; icon: any; count?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-1.5 lg:gap-2 px-2 lg:px-4 py-3 lg:py-2.5 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'text-white bg-zinc-800 shadow-md border border-white/[0.08]' 
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon size={16} strokeWidth={activeTab === id ? 2.5 : 1.8} className="flex-shrink-0" />
      <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.12em]">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 lg:static lg:ml-1 h-4 w-4 lg:h-5 lg:w-auto lg:px-1.5 flex items-center justify-center rounded-full text-[8px] font-black bg-primary text-white">
          {count}
        </span>
      )}
    </button>
  );

   return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020202]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-3 border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-3">
           <div>
             <h1 className="text-lg sm:text-xl lg:text-2xl font-black italic uppercase tracking-tighter text-white">Synergy Engine</h1>
             <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest hidden sm:block">Your social circle</p>
           </div>
           <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-500">
              <Filter size={15} />
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-zinc-900/60 p-1 rounded-xl border border-white/[0.05] flex gap-1">
           <TabButton id="activity" label="Radar" icon={Activity} count={circleItems.length} />
           <TabButton id="mutual" label="Friends" icon={Users} count={matches.length} />
           <TabButton id="incoming" label="Requests" icon={Mail} count={incomingRequests.length} />
           <TabButton id="sent" label="Pending" icon={Zap} count={outgoingRequests.length} />
        </div>
      </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 lg:pb-8">
        <AnimatePresence mode="wait">

          {activeTab === 'mutual' && (
             <motion.div
              key="mutual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Circle Activity — Live Friend Vibes */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={12} className="text-primary animate-pulse" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-mono">Circle Activity</h2>
                  <div className="flex-1 h-[1px] bg-white/[0.04]" />
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                    {Object.keys(friendVibes).length > 0 ? `${Object.keys(friendVibes).length} vibing` : 'No active vibes'}
                  </span>
                </div>
                {Object.keys(friendVibes).length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {Object.entries(friendVibes).map(([uid, data]) => {
                      const vibeEmojis: Record<string, string> = {
                        Gaming: '🎮', Studying: '📚', Coffee: '☕',
                        Party: '🎵', Library: '📖', Incognito: '👻'
                      };
                      const emoji = vibeEmojis[data.vibe] || '📡';
                      const matchEntry = matches.find(m => m.otherUserId === uid);
                      return (
                        <button
                          key={uid}
                          onClick={() => matchEntry?.chatId && navigate(`/chat/${matchEntry.chatId}`)}
                          className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.05] hover:border-primary/30 hover:bg-zinc-800/60 transition-all group"
                        >
                          <div className="relative">
                            <div className="h-11 w-11 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                              {data.photoURL ? (
                                <img src={data.photoURL} alt={data.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center font-black text-xs text-primary">{data.name?.[0]}</div>
                              )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-sm leading-none drop-shadow-sm">{emoji}</span>
                            {data.isOnline && (
                              <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                            )}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wide text-zinc-300 group-hover:text-white transition-colors max-w-[60px] truncate">{data.name?.split(' ')[0]}</span>
                          <span className="text-[7px] font-bold text-zinc-600 uppercase">{data.vibe}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest py-3 text-center">
                    Friends vibes will appear here when they set one
                  </p>
                )}
              </div>

              {/* Friend Pulse Activity Rail */}
              <div className="mb-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 font-mono mb-2 px-1">Friend Pulse</h2>
                 <NotesRail 
                   onNoteClick={(uid) => setActiveNoteUid(uid)}
                   onProfileClick={(u) => setSelectedUserForProfile(u)}
                   onChatClick={(chatId) => navigate(`/chat/${chatId}`)}
                 />
              </div>

              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder="Filter your circle..." 
                  className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {matchesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-zinc-900/50" />)}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="bg-zinc-950/40 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/5 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                   {filteredMatches.map(match => (
                    <MatchItem 
                      key={match.id} 
                      match={match} 
                      onAvatarClick={(u) => setSelectedUserForProfile(u)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-12 sm:mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-800">
                    <Heart size={48} strokeWidth={1} />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Circle Empty</h2>
                  <p className="mt-2 max-w-[250px] text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                     Time to enter the Synergy Engine and find your vibe.
                  </p>
                  <Button className="mt-10 rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest" onClick={() => setActiveTab('discover')}>
                    Start Discovery
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── ACTIVITY TAB ─────────────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black italic uppercase tracking-tight text-white">Circle Activity</h2>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">What your friends are up to — last 24h</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 border border-white/[0.06] px-2.5 py-1 rounded-full">
                  {circleItems.length} events
                </span>
              </div>

              {circleLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-16 rounded-2xl bg-zinc-900/50 animate-pulse border border-white/[0.04]" />
                  ))}
                </div>
              ) : circleItems.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="mb-5 h-16 w-16 mx-auto rounded-full bg-zinc-900/60 border border-white/[0.06] flex items-center justify-center">
                    <Activity size={28} className="text-zinc-700" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-zinc-600">No Activity Yet</h3>
                  <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-2 max-w-48 mx-auto leading-relaxed">
                    When your friends set vibes, post signals, or start debates, it appears here.
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="mt-8 px-5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Find More Friends
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {circleItems.map(item => {
                    const vibeEmojis: Record<string, string> = {
                      Gaming: '🎮', Studying: '📚', Coffee: '☕',
                      Party: '🎵', Library: '📖', Incognito: '👻'
                    };
                    const typeConfig: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
                      vibe:    { emoji: vibeEmojis[item.meta?.vibe || ''] || '📡', label: 'Vibe Update',  color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
                      signal:  { emoji: '📡',                                          label: 'Signal',       color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                      poll:    { emoji: '⚡',                                              label: 'Debate',       color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
                      joined:  { emoji: '👋',                                              label: 'Joined',      color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
                      ignited: { emoji: '🔥',                                              label: 'Ignited',    color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
                    };
                    const cfg = typeConfig[item.type] || typeConfig.signal;

                    // Time remaining display
                    const expiresMs = item.expiresAt?.toMillis() || 0;
                    const remaining = Math.max(0, expiresMs - Date.now());
                    const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
                    const minsLeft  = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const timeStr = hoursLeft > 0 ? `${hoursLeft}h left` : `${minsLeft}m left`;
                    const isExpiringSoon = remaining < 2 * 60 * 60 * 1000;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/50 border border-white/[0.04] hover:border-white/[0.08] transition-all"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                            {item.fromPhotoURL ? (
                              <img src={item.fromPhotoURL} alt={item.fromName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-black text-xs text-primary">
                                {item.fromName?.[0]}
                              </div>
                            )}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 text-xs h-5 w-5 flex items-center justify-center rounded-full border-2 border-zinc-900 ${cfg.bg}`}>
                            {cfg.emoji}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[11px] font-black text-white tracking-wide">{item.fromName}</span>
                              <span className="text-[11px] font-medium text-zinc-400"> {item.content}</span>
                            </div>
                            <span className={`flex-shrink-0 text-[8px] font-black uppercase tracking-widest ${isExpiringSoon ? 'text-rose-500' : 'text-zinc-600'}`}>
                              {timeStr}
                            </span>
                          </div>

                          {/* Type badge */}
                          <span className={`inline-block mt-1 text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'incoming' && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {incomingRequests.length > 0 ? (
                incomingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-5">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-14 w-14 cursor-pointer overflow-hidden rounded-[1.2rem] bg-zinc-900 border border-white/10"
                        onClick={() => setSelectedUserForProfile(req.otherUser)}
                      >
                        {req.otherUser?.photoURL ? (
                          <img src={req.otherUser.photoURL} alt={req.otherUser?.name || 'User'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-700 font-black italic">!</div>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-black italic uppercase tracking-tight text-white/90">{req.otherUser?.name || req.fromName || 'Student'}</p>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                           <Sparkles size={8} fill="currentColor" /> Wants to connect
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 hover:bg-white/5" onClick={() => declineRequest(req)}>
                         <X size={18} className="text-zinc-600" />
                       </Button>
                       <Button size="sm" className="rounded-xl px-5 h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => acceptRequest(req)}>
                         Accept
                       </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mt-12 sm:mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-800">
                    <Mail size={40} strokeWidth={1} />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">No Inbound Sparks</h2>
                  <p className="mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Connect with others to receive synergy requests.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {outgoingRequests.length > 0 ? (
                outgoingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-[#0D0D0D] p-5">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-12 w-12 cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-white/10 opacity-70"
                        onClick={() => setSelectedUserForProfile(req.otherUser)}
                      >
                        {req.otherUser?.photoURL ? (
                          <img src={req.otherUser.photoURL} alt={req.otherUser?.name || 'Student'} className="h-full w-full object-cover grayscale" />
                        ) : (
                          <Users size={20} className="m-auto text-zinc-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-black italic uppercase tracking-tight text-white/50">{req.otherUser?.name || 'Student'}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Transmitting Spark...</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all" onClick={() => cancelRequest(req)}>Recall</Button>
                  </div>
                ))
              ) : (
                <div className="mt-12 sm:mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-800">
                    <Zap size={40} strokeWidth={1} />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white/90">Signal Queue Empty</h2>
                  <p className="mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Start discovery to find potential connections.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={Boolean(selectedUserForProfile)}
        onClose={() => setSelectedUserForProfile(null)}
        title="Synergy Profile"
      >
        {selectedUserForProfile && (
          <div className="h-[550px]">
            <ProfileCard 
              user={selectedUserForProfile} 
              className="h-full"
            />
          </div>
        )}
      </Modal>

      {/* Note View Modal */}
      <Modal
        isOpen={Boolean(activeNoteUid)}
        onClose={() => setActiveNoteUid(null)}
        title={activeNoteUid === user?.uid ? 'LOGGED NOTE' : 'SYSTEM NOTE'}
      >
        <div className="space-y-6 p-2">
          {activeNoteUid && notes[activeNoteUid] ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-900 p-6 text-sm text-zinc-200 leading-relaxed font-medium">
                {notes[activeNoteUid].text}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-xs text-zinc-600 uppercase tracking-widest text-center">
                NO ACTIVE FREQUENCY
            </div>
          )}

          {activeNoteUid === user?.uid && (
            <Button 
              onClick={() => navigate('/chat')} 
              className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Update Note in Inbox
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Matches;
