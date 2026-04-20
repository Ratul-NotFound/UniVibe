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
  addDoc, serverTimestamp, updateDoc, doc, arrayUnion, increment, setDoc, getDocs, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type TabType = 'pulse' | 'battles' | 'quests' | 'vibe-check' | 'shop';

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

const Discovery = () => {
  const { user, userData } = useAuth();
  const { uniCoins, vibePoints, spendCoins, addVibePoints, updateMissionProgress, acceptMission } = useGamification();
  const navigate = useNavigate();

  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('pulse');
  const [isPosting, setIsPosting] = useState(false);
  const [newPulse, setNewPulse] = useState('');
  
  // Data State
  const [pulses, setPulses] = useState<any[]>([]);
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
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const qBattle = query(collection(db, 'battles'), orderBy('createdAt', 'desc'), limit(10));
    const unsubPulse = onSnapshot(
      qPulse,
      (s) => {
        setPulses(s.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error('Pulse listener error:', error);
        setPulses([]);
      }
    );
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
            { id: 'q1', title: 'Campus Ghost', status: 'Available', reward: 150, progress: 0, total: 1, type: 'ghost' },
            { id: 'q2', title: 'Opinion Leader', status: 'Available', reward: 200, progress: 0, total: 3, type: 'vote' },
            { id: 'q3', title: 'Vibe Architect', status: 'Available', reward: 100, progress: 0, total: 1, type: 'pulse' }
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

  const handlePostPulse = async () => {
    if (!user || !newPulse.trim()) return;
    try {
      await addDoc(collection(db, 'pulses'), {
        content: newPulse,
        fromUid: user.uid,
        fromName: userData?.name || 'DIU Student',
        fromPhotoURL: userData?.photoURL || null,
        createdAt: serverTimestamp()
      });
      await updateMissionProgress('q3'); // Vibe Architect
      toast.success('Broadcast sent to campus!');
      setNewPulse('');
      setIsPosting(false);
    } catch (error) {
      console.error('Failed to post pulse:', error);
      toast.error('Failed to broadcast pulse');
    }
  };

  const handleUpdateVibe = async (vibe: string, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user)) {
      toast.error('Use a verified DIU email to update vibe.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { currentVibe: vibe });
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
    const battle = battles.find(b => b.id === battleId);
    if (!user || battle?.voters?.includes(user.uid)) return toast.error('Already Voted');
    await updateDoc(doc(db, 'battles', battleId), {
      [`${side}.votes`]: increment(1),
      voters: arrayUnion(user.uid)
    });
    await updateMissionProgress('q2'); // Opinion Leader
    toast.success('Vote Cast!', { icon: '⚡' });
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

        <div className="max-w-lg mx-auto mt-6">
          <div className="bg-zinc-900/50 p-1 rounded-2xl border border-white/[0.03] flex gap-1 overflow-x-auto no-scrollbar">
             {(['pulse', 'battles', 'quests', 'vibe-check', 'shop'] as TabType[]).map(t => (
               <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[85px] relative py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {activeTab === t && <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary shadow-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10">{t.replace('-', ' ')}</span>
               </button>
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-8 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'pulse' && (
            <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-[3rem] border border-white/[0.05] relative overflow-hidden group">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Broadcast Hub</h2>
                    <p className="text-xs font-bold text-zinc-500 mb-8 uppercase tracking-widest">Alert the campus of current energy</p>
                    {!isPosting ? (
                      <button onClick={() => setIsPosting(true)} className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                        <Plus size={16} /> Update Signal
                      </button>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 text-left">
                        <textarea value={newPulse} onChange={e => setNewPulse(e.target.value)} placeholder="What's happening?" className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none min-h-[100px]" />
                        <div className="flex gap-2">
                          <Button onClick={() => setIsPosting(false)} className="flex-1 h-12 bg-zinc-800 text-xs font-black uppercase tracking-widest rounded-xl text-white">Cancel</Button>
                          <Button onClick={handlePostPulse} className="flex-1 h-12 bg-primary text-xs font-black uppercase tracking-widest rounded-xl text-white">Send</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
               </div>
               <div className="space-y-4">
                  {pulses.map((p, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/[0.02] p-6 rounded-[2.5rem] flex gap-4 backdrop-blur-3xl">
                       <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800 border border-white/5">
                          {p.fromPhotoURL ? (
                            <img src={p.fromPhotoURL} alt={p.fromName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-black italic text-primary text-xs">{p.fromName?.[0]}</div>
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[11px] font-black text-primary uppercase tracking-widest">{p.fromName}</span>
                             <span className="text-[9px] font-bold text-zinc-600 uppercase">
                               {p.createdAt?.toMillis ? new Date(p.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                             </span>
                          </div>
                          <p className="text-sm text-zinc-300 font-medium leading-relaxed italic opacity-80">"{p.content}"</p>
                       </div>
                    </div>
                  ))}
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
                    { id: 'Incognito', icon: GhostIcon, color: 'text-zinc-400', bg: 'bg-zinc-400/5' },
                  ].map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => handleUpdateVibe(cat.id)}
                      className={`relative p-8 rounded-[3rem] flex flex-col items-center justify-center border transition-all active:scale-95 group ${userVibe === cat.id ? 'bg-primary border-primary' : 'bg-zinc-900 border-white/[0.03]'}`}
                    >
                       <cat.icon className={`mb-4 transition-transform group-hover:scale-125 ${userVibe === cat.id ? 'text-white' : cat.color}`} size={32} />
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
                  className="w-full bg-primary p-12 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group active:scale-95 transition-all"
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
            <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="bg-white p-12 rounded-[4rem] text-black shadow-2xl relative overflow-hidden">
                  <Trophy size={100} className="absolute -right-5 -top-5 text-zinc-100 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-50">Career Path</p>
                  <h2 className="text-6xl font-black italic uppercase tracking-tighter">LVL {Math.floor(vibePoints / 1000) + 1}</h2>
               </div>
               <div className="space-y-4">
                  {missions.map(m => (
                    <div key={m.id} className="bg-zinc-900 border border-white/[0.03] p-8 rounded-[3rem] relative group overflow-hidden">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">{m.status}</p>
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter">{m.title}</h4>
                          </div>
                          <div className="px-4 py-2 bg-yellow-400 text-black rounded-xl text-[10px] font-black flex items-center gap-2">
                             <Coins size={12} fill="currentColor" /> +{m.reward}
                          </div>
                       </div>
                       <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-white/5 p-0.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(m.progress/m.total)*100}%` }} className="h-full bg-primary rounded-full" />
                       </div>
                       <div className="mt-4 flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase">
                          <span>Progress {m.progress}/{m.total}</span>
                          {m.status !== 'Completed' && m.status !== 'Active' ? (
                            <button 
                              onClick={() => acceptMission(m.id)}
                              className="text-primary flex items-center gap-1 cursor-pointer hover:underline bg-transparent border-none outline-none"
                            >
                              Accept Mission <ChevronRight size={10} />
                            </button>
                          ) : (
                            <span className={m.status === 'Completed' ? 'text-emerald-500' : 'text-primary animate-pulse'}>
                              {m.status}
                            </span>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'battles' && (
            <motion.div key="battles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               {battles.map((b) => (
                 <div key={b.id} className="relative py-4">
                    <h4 className="text-2xl font-black italic uppercase mb-8 text-center tracking-tighter">{b.title}</h4>
                    <div className="grid grid-cols-2 gap-4 relative">
                       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-black border-[6px] border-[#020202] h-14 w-14 rounded-full flex items-center justify-center font-black italic text-[11px] shadow-2xl">VS</div>
                       <button 
                         onClick={() => handleVote(b.id, 'left')} 
                         className={`aspect-square rounded-[3.5rem] bg-gradient-to-br ${b.left.color} flex flex-col items-center justify-center border transition-all shadow-xl ${b.voters?.includes(user?.uid) ? 'border-primary ring-2 ring-primary/20 bg-zinc-800/10' : 'active:scale-95 border-white/10'}`}
                       >
                          <span className="text-5xl font-black mb-1">{b.left.votes}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{b.left.name}</span>
                          {b.voters?.includes(user?.uid) && <span className="text-[8px] font-bold mt-1 text-primary">VOTED</span>}
                       </button>
                       <button 
                         onClick={() => handleVote(b.id, 'right')} 
                         className={`aspect-square rounded-[3.5rem] bg-gradient-to-br ${b.right.color} flex flex-col items-center justify-center border transition-all shadow-xl ${b.voters?.includes(user?.uid) ? 'border-primary ring-2 ring-primary/20 bg-zinc-800/10' : 'active:scale-95 border-white/10'}`}
                       >
                          <span className="text-5xl font-black mb-1">{b.right.votes}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{b.right.name}</span>
                          {b.voters?.includes(user?.uid) && <span className="text-[8px] font-bold mt-1 text-primary">VOTED</span>}
                       </button>
                    </div>
                 </div>
               ))}
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {[
                 { title: 'Super Ghost', price: 500, desc: 'Hide from all radar', icon: GhostIcon, color: 'text-zinc-600' },
                 { title: 'Golden Crown', price: 1000, desc: 'Identity badge', icon: Crown, color: 'text-yellow-400' },
                 { title: 'Global Map', price: 250, desc: 'See activity heatmap', icon: Map, color: 'text-emerald-400' },
                 { title: 'Pulse Boost', price: 100, desc: 'Pin your broadcast', icon: Zap, color: 'text-primary' },
               ].map((item, i) => (
                 <div key={i} className="bg-zinc-900 border border-white/[0.05] p-8 rounded-[3rem] flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                       <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center">
                          <item.icon size={28} className={item.color} />
                       </div>
                       <div>
                          <h4 className="text-lg font-black uppercase italic tracking-tight">{item.title}</h4>
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
                       className="h-12 px-6 bg-white text-black rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-colors"
                     >
                        {item.price}
                     </button>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-[#020202]/95 backdrop-blur-3xl border-t border-white/[0.03] flex items-center justify-around px-8">
        {[
          { icon: Compass, label: 'HUB', path: '/', active: true },
          { icon: Search, label: 'FIND', path: '/search' },
          { icon: Heart, label: 'MATCH', path: '/matches' },
          { icon: MessageCircle, label: 'CHAT', path: '/chat' },
          { icon: UserIcon, label: 'ME', path: '/profile' }
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 transition-all ${item.active ? 'text-primary' : 'text-zinc-600'}`}>
            <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
            <span className="text-[8px] font-black tracking-tighter uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Discovery;
