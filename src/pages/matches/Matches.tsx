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
  Search, Sparkles, Filter, Users, Zap, Compass 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';
import { DiscoveryCard } from '@/components/matches/DiscoveryCard';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { useSocial } from '@/hooks/useSocial';

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
  const { sendRequest } = useSocial();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'discover' | 'mutual' | 'incoming' | 'sent'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);
  
  // Discovery State
  const [discoveryUsers, setDiscoveryUsers] = useState<any[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);

  // Fetch Potential Matches
  useEffect(() => {
    if (!user || activeTab !== 'discover') return;
    
    const fetchDiscovery = async () => {
      setLoadingDiscovery(true);
      try {
        const q = query(collection(db, 'users'), limit(50));
        const snap = await getDocs(q);
        
        // Filter out existing matches and the user themselves
        const existingIds = new Set([
          user.uid,
          ...matches.map(m => m.otherUserId),
          ...incomingRequests.map(r => r.fromUid),
          ...outgoingRequests.map(r => r.toUid)
        ]);

        const filtered = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => !existingIds.has(u.id))
          .map(u => ({
            ...u,
            synergyScore: calculateMatchScore(userData || {}, u).score || 75
          }))
          .sort((a, b) => b.synergyScore - a.synergyScore)
          .slice(0, 10);

        setDiscoveryUsers(filtered);
      } catch (err) {
        console.error('Discovery fetch error:', err);
      } finally {
        setLoadingDiscovery(false);
      }
    };

    fetchDiscovery();
  }, [user, activeTab, matches.length]);

  const handleConnect = async (uid: string) => {
    try {
      await sendRequest(uid);
      toast.success('Spark Transmitted!', { icon: '✨' });
    } catch (err) {
      toast.error('Could not transmit spark.');
    }
  };

  const filteredMatches = matches.filter(m => {
    const name = (m.otherUser?.name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const TabButton = ({ id, label, icon: Icon, count }: { id: typeof activeTab; label: string; icon: any; count?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 ${
        activeTab === id 
          ? 'text-black bg-white shadow-xl' 
          : 'text-zinc-600 hover:text-zinc-400'
      }`}
    >
      <Icon size={18} strokeWidth={activeTab === id ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`absolute right-4 top-2 h-4 w-4 flex items-center justify-center rounded-full text-[8px] font-black ${activeTab === id ? 'bg-black text-white' : 'bg-primary text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'}`}>
          {count}
        </span>
      )}
    </button>
  );

   return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020202]/98 px-8 pt-12 pb-6 border-b border-white/[0.03]">
        <div className="max-w-lg mx-auto flex items-center justify-between mb-10">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-white">Synergy Engine</h1>
           <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-500">
              <Filter size={18} />
           </div>
        </div>

        {/* Editorial Tab Navigation */}
        <div className="max-w-lg mx-auto bg-zinc-900/50 p-1.5 rounded-[2rem] border border-white/[0.05] flex justify-around shadow-xl">
           <TabButton id="discover" label="Discover" icon={Compass} />
           <TabButton id="mutual" label="Circle" icon={Users} count={matches.length} />
           <TabButton id="incoming" label="Requests" icon={Mail} count={incomingRequests.length} />
           <TabButton id="sent" label="Pending" icon={Zap} count={outgoingRequests.length} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-8 pt-10 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
               <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Recommended Connections</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
               </div>

               {loadingDiscovery ? (
                 <div className="grid grid-cols-1 gap-6">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-80 rounded-[2.5rem] bg-zinc-900/50 animate-pulse border border-white/5" />
                   ))}
                 </div>
               ) : discoveryUsers.length > 0 ? (
                 <div className="grid grid-cols-1 gap-8">
                   {discoveryUsers.map(u => (
                     <DiscoveryCard 
                       key={u.id}
                       user={u}
                       synergyScore={u.synergyScore}
                       onConnect={handleConnect}
                       onViewProfile={(usr) => setSelectedUserForProfile(usr)}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="py-20 text-center">
                    <div className="mb-6 h-20 w-20 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center text-zinc-700">
                       <Compass size={40} />
                    </div>
                    <h3 className="text-lg font-black text-zinc-500 uppercase tracking-tighter">Nexus Reached</h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2 px-10">You've connected with most people sharing your vibe. Stay tuned for new arrivals.</p>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === 'mutual' && (
            <motion.div
              key="mutual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
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
                <div className="space-y-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-zinc-900/50" />)}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="bg-zinc-950/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-8">
                   {filteredMatches.map(match => (
                    <MatchItem 
                      key={match.id} 
                      match={match} 
                      onAvatarClick={(u) => setSelectedUserForProfile(u)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-20 flex flex-col items-center text-center">
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
                <div className="mt-20 flex flex-col items-center text-center">
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
                <div className="mt-20 flex flex-col items-center text-center">
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
    </div>
  );
};

export default Matches;
