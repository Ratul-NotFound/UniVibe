import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Coins, Plus, Radio, MapPin, Gamepad2, Laptop, 
  Coffee, Music, GraduationCap, Ghost as GhostIcon, Dice5, 
  Star, ChevronRight, Trophy, Sparkles, Compass, Search, Heart, 
  MessageCircle, User as UserIcon, Zap, Crown, Map
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { db, rtdb } from '@/lib/firebase';
import { ref, set as rtdbSet, onValue, off, runTransaction } from 'firebase/database';
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
import { postCircleActivity } from '@/hooks/useCircleActivity';

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
  const [searchParams] = useSearchParams();
  const targetSignalId = searchParams.get('signalId');

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
    // Battles: only show active/non-expired polls
    const nowTs = Timestamp.now();
    const qBattle = query(
      collection(db, 'battles'),
      where('expiresAt', '>', nowTs),
      orderBy('expiresAt', 'desc'),
      limit(20)
    );
    const unsubBattle = onSnapshot(
      qBattle,
      (s) => setBattles(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => {
        // Fallback: query without time filter if index missing
        console.error('Battle listener error:', error);
        const qFallback = query(collection(db, 'battles'), orderBy('createdAt', 'desc'), limit(20));
        onSnapshot(qFallback,
          (s) => {
            const now = Date.now();
            setBattles(s.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter((b: any) => !b.expiresAt || b.expiresAt.toMillis() > now)
            );
          },
          () => setBattles([])
        );
      }
    );
    
    // Real-time Vibe Stats — read from RTDB vibeStats node
    const vibeStatsRef = ref(rtdb, 'vibeStats');
    const onVibeStats = onValue(vibeStatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setVibeStats(data);
    });

    // Current user vibe from presence node
    const userVibeRef = ref(rtdb, `presence/${user.uid}/vibe`);
    const onUserVibe = onValue(userVibeRef, (snapshot) => {
      setUserVibe(snapshot.val());
    });

    return () => { 
      unsubPulse(); 
      unsubBattle(); 
      off(vibeStatsRef, 'value', onVibeStats);
      off(userVibeRef, 'value', onUserVibe);
    };
  }, [user]);

  // Handle signal deep linking
  useEffect(() => {
    if (targetSignalId && broadcasts.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`signal-${targetSignalId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-4', 'ring-offset-black');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary', 'ring-offset-4', 'ring-offset-black');
          }, 4000);
        }
      }, 500);
    }
  }, [targetSignalId, broadcasts]);

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

  const handleUpdateVibe = async (vibe: string) => {
    if (!user) {
      toast.error('Sign in required.');
      return;
    }
    try {
      // Write to RTDB presence node
      if (rtdb) {
        const prevVibe = userVibe;
        await rtdbSet(ref(rtdb, `presence/${user.uid}/vibe`), vibe);
        await rtdbSet(ref(rtdb, `presence/${user.uid}/name`), userData?.name || 'Student');
        await rtdbSet(ref(rtdb, `presence/${user.uid}/photoURL`), userData?.photoURL || null);
        
        // Atomic stats update
        if (vibe !== prevVibe) {
          runTransaction(ref(rtdb, `vibeStats/${vibe}`), (current) => (current || 0) + 1);
          if (prevVibe) {
            runTransaction(ref(rtdb, `vibeStats/${prevVibe}`), (current) => Math.max(0, (current || 0) - 1));
          }
        }
      }
      // Also try Firestore silently
      try { await updateDoc(doc(db, 'users', user.uid), { currentVibe: vibe }); } catch (_) { }

      setUserVibe(vibe);
      await updateMissionProgress('f1');
      toast.success(`Vibe set: ${vibe} 📡`, { icon: '✅' });
      // Fan-out vibe to circle feed
      postCircleActivity(user, userData, {
        type: 'vibe',
        content: `set their vibe to ${vibe}`,
        meta: { vibe },
      });
    } catch (e: any) {
      console.error('Vibe update failed:', e);
      toast.error(`Vibe update failed: ${e?.message || 'check database rules'}`);
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
  };

  const handleSeed = async () => {
    await seedDefaultPolls();
  };

  const handleClaimBonus = async () => {
    const data = userData as any;
    if (data?.claimedWelcomeBonus) {
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

        <div className="max-w-7xl mx-auto mt-6 px-2">
          <div className="max-w-lg mx-auto">
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
      </div>
    </header>

      <main className="max-w-7xl mx-auto px-5 pt-8 pb-32 lg:pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'broadcast' && (
            <motion.div key="broadcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
               <div className="flex items-center justify-between bg-zinc-900/60 px-5 py-4 rounded-2xl border border-white/[0.05]">
                  <div>
                    <h2 className="text-base font-black italic uppercase tracking-tight text-white">Live Campus Feed</h2>
                    <p className="text-[9px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest">Broadcast your energy to the campus</p>
                  </div>
                  <button onClick={() => setIsPosting(true)} className="flex items-center gap-2 h-9 px-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                    <Zap size={13} className="fill-current" /> Transmit
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {broadcasts.length > 0 ? (
                    broadcasts.map((p) => (
                      <div key={p.id} id={`signal-${p.id}`}>
                        <SignalCard 
                          signal={p}
                          currentUser={user}
                          onJoin={handleJoin}
                          onOpenPortal={(id) => setActivePortalId(id)}
                          onIgnite={handleIgnite}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">No signals detected in this frequency range.</p>
                    </div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'vibe-check' && (
            <motion.div key="vibe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-1">Vibe Radar</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Select your activity to join the hub</p>
                  
                  {userVibe && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live: {userVibe}</span>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Gaming', icon: Gamepad2, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
                    { id: 'Studying', icon: Laptop, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                    { id: 'Coffee', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                    { id: 'Party', icon: Music, color: 'text-rose-400', bg: 'bg-rose-400/5' },
                    { id: 'Library', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/5' },
                    { id: 'Incognito', icon: GhostIcon, color: 'text-zinc-400', bg: 'bg-zinc-400/5' }
                  ].map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => handleUpdateVibe(cat.id)}
                      className={`relative p-4 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-95 group ${userVibe === cat.id ? 'bg-primary border-primary' : 'bg-zinc-900 border-white/[0.03]'}`}
                    >
                       <cat.icon className={`mb-2 transition-transform group-hover:scale-125 ${userVibe === cat.id ? 'text-white' : cat.color}`} size={22} />
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${userVibe === cat.id ? 'text-white' : 'text-zinc-200'}`}>{cat.id}</span>
                       <span className={`text-[8px] font-bold ${userVibe === cat.id ? 'text-white/70' : 'text-zinc-600'}`}>
                          {vibeStats[cat.id] || 0} active
                       </span>
                    </button>
                  ))}
               </div>

               <button 
                  onClick={handleRollDice} 
                  disabled={isRolling}
                  className="w-full bg-primary p-5 rounded-2xl text-center shadow-2xl relative overflow-hidden group active:scale-95 transition-all"
               >
                  <motion.div animate={isRolling ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.5 }}>
                     <Dice5 size={36} className="mx-auto mb-2 text-white drop-shadow-[0_0_10px_white]" />
                  </motion.div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-white mb-1">Mystery Social</h3>
                  <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-3">Pairing with someone active nearby...</p>
                  <div className="px-5 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest inline-block">
                    {isRolling ? 'Scanning...' : 'Roll the Dice'}
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
            </motion.div>
          )}

          {activeTab === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
               {/* Mastery Header - Compact */}
               <div className="relative bg-zinc-900 rounded-2xl p-5 border border-white/[0.05] overflow-hidden group">
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-1 font-mono">System Efficiency</p>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-white italic">
                           <span className="text-zinc-600 font-mono text-sm align-middle mr-2 not-italic tracking-normal">LVL</span>
                           {Math.floor(vibePoints / 1000) + 1}
                        </h2>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/[0.03]">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(vibePoints % 1000) / 10}%` }}
                             className="h-full bg-white transition-all duration-1000"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                           <span className="text-white">{vibePoints % 1000}</span>
                           <span className="opacity-30">/</span>
                           <span>1000 VP</span>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 p-4 text-white opacity-[0.03] pointer-events-none">
                     <Crown size={60} strokeWidth={1} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missions.map(m => (
                    <QuestCard key={m.id} mission={m} onAccept={acceptMission} />
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'battles' && (
            <motion.div key="battles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="bg-white p-5 md:p-6 rounded-2xl text-black shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:-rotate-12 transition-transform duration-700">
                    <Zap size={90} className="text-zinc-500" fill="currentColor" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1.5 text-zinc-400">Campus Debate</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-4">Poll Arena</h2>
                    <button onClick={() => setIsPollPosting(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-xl">
                      <Plus size={14} /> Start a Debate
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

               {!(userData as any)?.claimedWelcomeBonus && (
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
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
               {[
                 { title: 'Super Ghost', price: 500, desc: 'Hide from all radar', icon: GhostIcon, color: 'text-zinc-600' },
                 { title: 'Golden Crown', price: 1000, desc: 'Identity badge', icon: Crown, color: 'text-yellow-400' },
                 { title: 'Global Map', price: 250, desc: 'See activity heatmap', icon: Map, color: 'text-emerald-400' },
                 { title: 'Broadcast Boost', price: 100, desc: 'Pin your broadcast signal', icon: Zap, color: 'text-primary' },
               ].map((item, i) => (
                 <div key={i} className="bg-zinc-900 border border-white/[0.05] p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                          <item.icon size={20} className={item.color} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase italic tracking-tight">{item.title}</h4>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.desc}</p>
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
                       className="h-9 px-4 bg-white text-black rounded-xl font-black text-[9px] hover:bg-primary hover:text-white transition-colors flex-shrink-0"
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
  );
};

export default Discovery;

