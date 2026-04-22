import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Coins, Plus, Radio, MapPin, Gamepad2, Laptop, 
  Coffee, Music, GraduationCap, Ghost as GhostIcon, Dice5, 
  Star, ChevronRight, Trophy, Sparkles, Compass, Search, Heart, 
  MessageCircle, User as UserIcon, Zap, Crown, Map
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, serverTimestamp, updateDoc, doc, arrayUnion, increment, setDoc, getDocs, where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useBroadcasts, SIGNAL_THEMES } from '@/hooks/useBroadcasts';
import { SignalCard } from '@/components/broadcast/SignalCard';
import { BroadcasterComposer } from '@/components/broadcast/BroadcasterComposer';
import { PortalView } from '@/components/broadcast/PortalView';
import { Modal } from '@/components/ui/Modal';
import { usePolls } from '@/hooks/usePolls';
import { PollCard } from '@/components/battles/PollCard';
import { PollComposer } from '@/components/battles/PollComposer';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { QuestCard } from '@/components/gamification/QuestCard';

type TabType = 'broadcast' | 'battles' | 'quests' | 'vibe-check' | 'shop';

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

const Discovery = () => {
  const { user, userData } = useAuth();
  const { 
    uniCoins, vibePoints, spendCoins, addVibePoints, addCoins,
    updateMissionProgress, acceptMission 
  } = useGamification();
  const navigate = useNavigate();

  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('broadcast');
  const [isPosting, setIsPosting] = useState(false);
  const [isPollPosting, setIsPollPosting] = useState(false);
  const [activePortalId, setActivePortalId] = useState<string | null>(null);
  
  // Custom Hooks
  const { postSignal, joinSignal, igniteSignal, CAMPUS_ZONES } = useBroadcasts();
  const { voteInPoll, createPoll, seedDefaultPolls } = usePolls();
  
  // Data State
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [vibeStats, setVibeStats] = useState<Record<string, number>>({});
  const [userVibe, setUserVibe] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Real-time Listeners
  useEffect(() => {
    if (!user || !isEligibleDiuSession(user)) {
      return () => {};
    }

    const qPulse = query(
      collection(db, 'pulses'),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt', 'desc'),
      limit(25)
    );
    
    const unsubPulse = onSnapshot(
      qPulse,
      (s) => {
        const sorted = s.docs.map(d => ({ id: d.id, ...d.data() }));
        // Local priority sort
        setBroadcasts(sorted.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0)));
      },
      (error) => {
        console.error('Broadcast listener error:', error);
        setBroadcasts([]);
      }
    );
    const qBattle = query(collection(db, 'battles'), orderBy('createdAt', 'desc'), limit(10));
    const unsubBattle = onSnapshot(
      qBattle,
      (s) => setBattles(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => {
        console.error('Battle listener error:', error);
        setBattles([]);
      }
    );
    
    // Real-time Vibe Stats
    const vibeQuery = query(collection(db, 'users'), where('currentVibe', '!=', null));
    const unsubVibes = onSnapshot(
      vibeQuery,
      (s) => {
        const stats: Record<string, number> = {};
        s.docs.forEach(d => {
          const v = d.data().currentVibe;
          stats[v] = (stats[v] || 0) + 1;
        });
        setVibeStats(stats);
        // Find current user's vibe from the snapshot for local sync
        const myDoc = s.docs.find(d => d.id === user?.uid);
        if (myDoc) setUserVibe(myDoc.data().currentVibe);
      },
      (error) => {
        console.error('Vibe stats listener error:', error);
        setVibeStats({});
      }
    );

    return () => { unsubPulse(); unsubBattle(); unsubVibes(); };
  }, [user]);

  // Mission Initializer
  useEffect(() => {
    if (!user || !isEligibleDiuSession(user)) {
      return;
    }
    const missionRef = collection(db, 'users', user.uid, 'missions');
    const unsubMissions = onSnapshot(
      missionRef,
      (snapshot) => {
        if (snapshot.empty) {
          const defaultMissions = [
            // Flash Quests (Auto-tracking)
            { id: 'f1', title: 'Vibe Ritual', status: 'Available', reward: 50, progress: 0, total: 1, type: 'vibe', isFlash: true },
            { id: 'f2', title: 'Portal Scout', status: 'Available', reward: 100, progress: 0, total: 3, type: 'portal', isFlash: true },
            { id: 'f3', title: 'Campus Pulse', status: 'Available', reward: 50, progress: 0, total: 1, type: 'broadcast', isFlash: true },
            
            // Legendary Quests (Manual Acceptance)
            { id: 'q1', title: 'Campus Ghost', status: 'Available', reward: 150, progress: 0, total: 1, type: 'ghost' },
            { id: 'q2', title: 'Opinion Leader', status: 'Available', reward: 200, progress: 0, total: 5, type: 'vote' },
            { id: 'q3', title: 'Battle Master', status: 'Available', reward: 300, progress: 0, total: 2, type: 'battle' }
          ];
          defaultMissions.forEach(m => setDoc(doc(db, 'users', user.uid, 'missions', m.id), m));
        } else {
          setMissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      },
      (error) => {
        console.error('Missions listener error:', error);
        setMissions([]);
      }
    );
    return () => unsubMissions();
  }, [user]);

  // Handlers for Broadcast 3.0
  const handlePost = async (data: any) => {
    try {
      await postSignal(data);
      toast.success('Signal Transmitted!', { icon: '📡' });
    } catch (err) {
      toast.error('Transmission failed');
    }
  };

  const handleJoin = async (id: string) => {
    await joinSignal(id);
    await updateMissionProgress('f2'); // Portal Scout
    const signal = broadcasts.find(b => b.id === id);
    if (signal?.isPortal) {
      setActivePortalId(id);
    }
  };

  const handleIgnite = async (id: string) => {
    await igniteSignal(id);
  };

  const handleUpdateVibe = async (vibe: string, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user)) {
      toast.error('Use a verified DIU email to update vibe.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { currentVibe: vibe });
      await updateMissionProgress('f1'); // Vibe Ritual
      toast.success(`Broadcasting: ${vibe}`, { icon: '📡' });
    } catch (e: unknown) {
      const errorCode = (e as { code?: string })?.code;
      if (!hasRetried && errorCode === 'permission-denied') {
        try {
          await user.getIdToken(true);
          await handleUpdateVibe(vibe, true);
          return;
        } catch (refreshErr) {
          console.error('Vibe token refresh failed:', refreshErr);
        }
      }

      console.error('Vibe update failed:', e);
      toast.error('Permission denied for vibe update');
    }
  };

  const handleRollDice = async () => {
    if (isRolling || !user) return;
    setIsRolling(true);
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('currentVibe', '!=', null), limit(20));
      const snapshot = await getDocs(q);
      
      const otherUsers = snapshot.docs
        .filter(d => d.id !== user.uid)
        .map(d => ({ id: d.id, ...d.data() }));

      setTimeout(async () => {
        setIsRolling(false);
        if (otherUsers.length > 0) {
          const randomUser: any = otherUsers[Math.floor(Math.random() * otherUsers.length)];
          toast(`Found someone: ${randomUser.name}`, { icon: '🎲' });
          await updateMissionProgress('q1'); // Campus Ghost
          navigate(`/search?reveal=${randomUser.id}`); 
        } else {
          toast('No other active vibers found. Try later!', { icon: '🎲' });
        }
      }, 2000);
    } catch (error) {
      console.error('Dice roll error:', error);
      setIsRolling(false);
      toast.error('Mystery meet failed');
    }
  };

  const handleVote = async (battleId: string, side: 'left' | 'right') => {
    await voteInPoll(battleId, side);
  };

  const handleCreatePoll = async (data: any) => {
    await createPoll(data);
    await updateMissionProgress('q3'); // Battle Master
  };

  const handleSeed = async () => {
    await seedDefaultPolls();
  };

  const handleClaimBonus = async () => {
    if (userData?.claimedWelcomeBonus) {
      toast.error('Reward already claimed!');
      return;
    }
    await addCoins(1000);
    await updateDoc(doc(db, 'users', user!.uid), { claimedWelcomeBonus: true });
    toast.success('Claimed 1,000 UniCoins Welcome Bonus!', { icon: '💰' });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-x-hidden">
      <header className="sticky top-0 z-[60] bg-[#020202]/95 backdrop-blur-3xl px-6 py-5 border-b border-white/[0.03]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="bg-zinc-900/80 p-1.5 rounded-2xl flex items-center gap-2 border border-white/[0.05]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/[0.02]">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-[12px] font-black tracking-tight">{uniCoins?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/[0.02]">
              <Flame size={14} className="text-orange-500" />
              <span className="text-[12px] font-black tracking-tight">{vibePoints}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Radio size={12} className="text-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Global Hub</span>
          </div>
        </div>

        <div className="max-w-lg mx-auto mt-6 px-2">
          <div className="bg-zinc-900/40 p-1.5 rounded-2xl border border-white/[0.05] flex gap-1 overflow-x-auto no-scrollbar shadow-xl">
             {[
               { id: 'broadcast', label: 'Feed', icon: Radio },
               { id: 'battles', label: 'Arena', icon: Zap },
               { id: 'quests', label: 'Mastery', icon: Trophy },
               { id: 'vibe-check', label: 'Vibe', icon: Flame },
               { id: 'shop', label: 'Vault', icon: Coins }
             ].map(t => {
               const Icon = t.icon;
               const isActive = activeTab === t.id;
               return (
                 <button 
                   key={t.id} 
                   onClick={() => setActiveTab(t.id as TabType)} 
                   className={`flex-1 min-w-[70px] relative py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-pill" 
                        className="absolute inset-0 bg-white shadow-xl rounded-xl" 
                        transition={{ duration: 0.3 }} 
                      />
                    )}
                    <Icon size={14} className={`relative z-10 transition-colors ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                    <span className={`relative z-10 text-[8px] font-black uppercase tracking-[0.1em] transition-colors ${isActive ? 'text-black' : 'text-zinc-500'}`}>{t.label}</span>
                 </button>
               );
             })}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-8 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'broadcast' && (
            <motion.div key="broadcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="bg-gradient-to-br from-zinc-900 to-black p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/[0.05] relative overflow-hidden group">
                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-1">Live Campus Feed</h2>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 mb-6 md:mb-8 uppercase tracking-widest leading-relaxed">Broadcast your energy to the university</p>
                    <button onClick={() => setIsPosting(true)} className="w-full h-12 md:h-14 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                      <Zap size={16} className="fill-black" /> Transmit Signal
                    </button>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
               </div>

               <div className="space-y-4">
                  {broadcasts.length > 0 ? (
                    broadcasts.map((p) => (
                      <SignalCard 
                        key={p.id}
                        signal={p}
                        currentUser={user}
                        onJoin={handleJoin}
                        onOpenPortal={(id) => setActivePortalId(id)}
                        onIgnite={handleIgnite}
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center">
                       <div className="mb-6 h-20 w-20 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center text-zinc-700">
                          <Radio size={40} />
                       </div>
                       <h3 className="text-lg font-black text-zinc-500 uppercase tracking-tighter">Campus is Quiet</h3>
                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Be the first to break the silence</p>
                    </div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'vibe-check' && (
            <motion.div key="vibe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="text-center">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Vibe Radar</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select your activity to join the hub</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'Gaming', icon: Gamepad2, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
                    { id: 'Studying', icon: Laptop, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                    { id: 'Coffee', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                    { id: 'Party', icon: Music, color: 'text-rose-400', bg: 'bg-rose-400/5' },
                    { id: 'Library', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/5' },
                    { id: 'Incognito', icon: GhostIcon, color: 'text-zinc-400', bg: 'bg-                   ].map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => handleUpdateVibe(cat.id)}
                      className={`relative p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center justify-center border transition-all active:scale-95 group ${userVibe === cat.id ? 'bg-primary border-primary' : 'bg-zinc-900 border-white/[0.03]'}`}
                    >
                       <cat.icon className={`mb-4 transition-transform group-hover:scale-125 ${userVibe === cat.id ? 'text-white' : cat.color}`} size={28} />
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${userVibe === cat.id ? 'text-white' : 'text-zinc-200'}`}>{cat.id}</span>
                       <span className={`text-[8px] font-bold ${userVibe === cat.id ? 'text-white/70' : 'text-zinc-600'}`}>
                          {vibeStats[cat.id] || 0} active
                       </span>
                    </button>
                  ))}
               </div>

               <button 
                  onClick={handleRollDice} 
                  disabled={isRolling}
                  className="w-full bg-primary p-8 sm:p-12 rounded-[3rem] sm:rounded-[4rem] text-center shadow-2xl relative overflow-hidden group active:scale-95 transition-all"
               >
                  <motion.div animate={isRolling ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.5 }}>
                     <Dice5 size={60} className="mx-auto mb-4 text-white drop-shadow-[0_0_20px_white]" />
                  </motion.div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Mystery Social</h3>
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-8">Pairing with someone active nearby...</p>
                  <div className="px-8 py-4 bg-white text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest inline-block">
                    {isRolling ? 'Scanning...' : 'Roll the Dice'}
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
            </motion.div>
          )}

          {activeTab === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
               {/* Editorial Noir Mastery Header */}
               <div className="relative bg-zinc-900 rounded-[2rem] p-8 sm:p-12 border border-white/[0.05] overflow-hidden group">
                  <div className="relative z-10 flex flex-col items-center text-center">
                     <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 mb-6 font-mono">
                        System Efficiency
                     </p>
                     
                     <div className="relative mb-6 sm:mb-8">
                        <h2 className="text-5xl sm:text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none text-white italic">
                           <span className="text-zinc-700 font-mono text-xl md:text-3xl align-middle mr-2 md:mr-4 not-italic tracking-normal">LVL</span>
                           {Math.floor(vibePoints / 1000) + 1}
                        </h2>
                     </div>

                     <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/[0.03]">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(vibePoints % 1000) / 10}%` }}
                             className="h-full bg-white transition-all duration-1000"
                          />
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                           <span className="text-white">{vibePoints % 1000}</span>
                           <span className="opacity-30">/</span>
                           <span>1000 VP UNLOCK</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="absolute top-0 right-0 p-8 text-white opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                     <Crown size={120} strokeWidth={1} />
                  </div>
               </div>

               <div className="space-y-2">
                  {missions.map(m => (
                    <QuestCard key={m.id} mission={m} onAccept={acceptMission} />
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'battles' && (
            <motion.div key="battles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] text-black shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:-rotate-12 transition-transform duration-700">
                    <Zap size={140} className="text-zinc-500" fill="currentColor" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 text-zinc-400">Campus Debate</p>
                    <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-6 md:mb-8">Poll Arena</h2>
                    <button onClick={() => setIsPollPosting(true)} className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl">
                      <Plus size={16} /> Start a Debate
                    </button>
                  </div>
               </div>

               <div className="space-y-8 pb-10">
                  {battles.length > 0 ? (
                    battles.map((b) => (
                      <PollCard 
                        key={b.id}
                        poll={b}
                        currentUser={user}
                        onVote={(side) => handleVote(b.id, side)}
                      />
                    ))
                  ) : (
                    <div className="py-20 text-center">
                       <div className="mb-6 h-20 w-20 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center text-zinc-700">
                          <Trophy size={40} />
                       </div>
                       <h3 className="text-lg font-black text-zinc-500 uppercase tracking-tighter">Arena is Empty</h3>
                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2 mb-8">Be the first to settle a debate</p>
                       <Button onClick={handleSeed} variant="ghost" className="text-[10px] font-black uppercase text-primary border border-primary/20 rounded-xl px-6">
                         Seed Initial Polls
                       </Button>
                    </div>
                  )}
               </div>

               {!userData?.claimedWelcomeBonus && (
                 <div className="flex justify-center pb-12">
                    <button 
                      onClick={handleClaimBonus}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2"
                    >
                      <Coins size={14} className="text-yellow-400" /> Claim Dev Reward (+1,000)
                    </button>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {[
                 { title: 'Super Ghost', price: 500, desc: 'Hide from all radar', icon: GhostIcon, color: 'text-zinc-600' },
                 { title: 'Golden Crown', price: 1000, desc: 'Identity badge', icon: Crown, color: 'text-yellow-400' },
                 { title: 'Global Map', price: 250, desc: 'See activity heatmap', icon: Map, color: 'text-emerald-400' },
                 { title: 'Broadcast Boost', price: 100, desc: 'Pin your broadcast signal', icon: Zap, color: 'text-primary' },
               ].map((item, i) => (
                 <div key={i} className="bg-zinc-900 border border-white/[0.05] p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex items-center justify-between group">
                    <div className="flex items-center gap-4 md:gap-6">
                       <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-black flex items-center justify-center">
                          <item.icon size={24} className={item.color} />
                       </div>
                       <div>
                          <h4 className="text-base md:text-lg font-black uppercase italic tracking-tight">{item.title}</h4>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{item.desc}</p>
                       </div>
                    </div>
                     <button 
                       onClick={() => {
                         if (uniCoins >= item.price) {
                           spendCoins(item.price);
                           toast.success(`Purchased: ${item.title}!`, { icon: '🎉' });
                         } else {
                           toast.error('Insufficient UniCoins');
                         }
                       }}
                       className="h-10 md:h-12 px-4 md:px-6 bg-white text-black rounded-2xl font-black text-[10px] md:text-xs hover:bg-primary hover:text-white transition-colors"
                     >
                        {item.price}
                     </button>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals for Hub 3.0 */}
        <Modal 
          isOpen={isPosting} 
          onClose={() => setIsPosting(false)}
          title="Create Signal"
          maxWidthClass="max-w-xl"
        >
          <BroadcasterComposer 
            onClose={() => setIsPosting(false)} 
            onPost={handlePost} 
          />
        </Modal>

        <Modal 
          isOpen={!!activePortalId} 
          onClose={() => setActivePortalId(null)}
          title="Vibe Portal"
          maxWidthClass="max-w-md"
        >
          {activePortalId && (
            <PortalView 
              portalId={activePortalId} 
              signal={broadcasts.find(b => b.id === activePortalId)}
              onClose={() => setActivePortalId(null)}
            />
          )}
        </Modal>

        <Modal 
          isOpen={isPollPosting} 
          onClose={() => setIsPollPosting(false)}
          title="Ignite Debate"
          maxWidthClass="max-w-xl"
        >
          <PollComposer 
            onClose={() => setIsPollPosting(false)} 
            onPost={handleCreatePoll} 
          />
        </Modal>
      </main>

      {/* Removed Redundant Navigation - Managed by AppLayout */}
    </div>
    </div>
  );
};

export default Discovery;
