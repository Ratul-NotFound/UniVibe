import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Heart, User, ChevronRight, Mail, Check, X, Search, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';

const PresenceDot = ({ isOnline, className = "" }: { isOnline: boolean; className?: string }) => {
  if (!isOnline) return null;
  return (
    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950 ${className}`} />
  );
};

const MatchItem = ({ match, onAvatarClick }: { match: any; onAvatarClick: (user: any) => void }) => {
  const { user: currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<any>(null);
  const navigate = useNavigate();
  const { isOnline } = usePresenceStatus(match.otherUserId);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', match.otherUserId), (docSnap) => {
      if (docSnap.exists()) {
        setOtherUser(docSnap.data());
      }
    });
    return () => unsub();
  }, [match.otherUserId]);

  if (!otherUser) return (
    <div className="flex animate-pulse items-center gap-4 py-4">
      <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-900" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );

  const isSoulmate = match.matchScore >= 90;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 py-4 group"
    >
      <div 
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(otherUser);
        }}
      >
        <div className={`h-14 w-14 overflow-hidden rounded-full p-0.5 ${isSoulmate ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 animate-gradient-xy' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
          <div className="h-full w-full overflow-hidden rounded-full bg-white p-0.5 dark:bg-zinc-950">
            {otherUser.photoURL ? (
              <img src={otherUser.photoURL} alt={otherUser.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <User size={24} />
              </div>
            )}
          </div>
        </div>
        <PresenceDot isOnline={isOnline} className="bottom-0 right-0" />
      </div>

      <div 
        className="flex-1 cursor-pointer"
        onClick={() => navigate(`/chat/${match.chatId}`)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">{otherUser.name}</h3>
          
          {/* New Match Badge */}
          {match.createdAt?.toMillis && (Date.now() - match.createdAt.toMillis() < 24 * 60 * 60 * 1000) && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white animate-pulse">New</span>
          )}

          {isSoulmate && (
            <div className="flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-rose-500">
              <Sparkles size={8} /> Soulmate
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {otherUser.department} • {match.commonInterests?.slice(0, 2).join(', ')}
        </p>
      </div>

      <button 
        onClick={() => navigate(`/chat/${match.chatId}`)}
        className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-300 transition-all hover:bg-primary/10 hover:text-primary active:scale-90 dark:bg-zinc-900"
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
    loading,
    acceptRequest,
    declineRequest,
    cancelRequest,
  } = useMatches();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'mutual' | 'incoming' | 'sent'>('mutual');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);

  const handleAccept = async (item: any) => {
    try {
      await acceptRequest(item);
      toast.success('Request accepted. You can now chat.');
    } catch (error) {
      console.error('Accept action failed:', error);
      toast.error('Could not accept request. Please try again.');
    }
  };

  const handleDecline = async (item: any) => {
    try {
      await declineRequest(item);
      toast('Request declined.');
    } catch (error) {
      console.error('Decline action failed:', error);
      toast.error('Could not decline request. Please try again.');
    }
  };

  const handleCancel = async (item: any) => {
    try {
      await cancelRequest(item);
      toast('Request cancelled.');
    } catch (error) {
      console.error('Cancel action failed:', error);
      toast.error('Could not cancel request. Please try again.');
    }
  };

  const filteredMatches = matches.filter(m => {
    const name = (m.otherUser?.name || m.otherUserId || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const TabButton = ({ id, label, count }: { id: typeof activeTab; label: string; count: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative px-4 py-3 text-sm font-black transition-all ${
        activeTab === id 
          ? 'text-primary' 
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
      }`}
    >
      {label}
      {count > 0 && <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-100 px-1 text-[10px] dark:bg-zinc-800">{count}</span>}
      {activeTab === id && (
        <motion.div 
          layoutId="activeTabMatches"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="p-6 pb-2">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">My Circle</h1>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-900 transition-colors hover:bg-primary/10 hover:text-primary">
            <Filter size={18} />
          </div>
        </div>

        {/* Tab Interface */}
        <div className="mb-6 flex border-b border-zinc-100 dark:border-zinc-900">
          <TabButton id="mutual" label="Connects" count={matches.length} />
          <TabButton id="incoming" label="Requests" count={incomingRequests.length} />
          <TabButton id="sent" label="Pending" count={outgoingRequests.length} />
        </div>

        {/* Search Bar - only for mutual */}
        {activeTab === 'mutual' && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search your circle..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="px-6 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'mutual' && (
            <motion.div
              key="mutual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="divide-y divide-zinc-50 dark:divide-zinc-900"
            >
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-50 dark:bg-zinc-900" />)}
                </div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map(match => (
                  <MatchItem 
                    key={match.id} 
                    match={match} 
                    onAvatarClick={(u) => setSelectedUserForProfile(u)}
                  />
                ))
              ) : (
                <div className="mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
                    <Heart size={40} />
                  </div>
                  <h2 className="text-xl font-bold">Connections empty</h2>
                  <p className="mt-2 max-w-[250px] text-sm text-zinc-500">
                    Your social circle is ready for growth! Start discovering people.
                  </p>
                  <Button className="mt-8 rounded-full" onClick={() => navigate('/')}>
                    Discover People
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
                  <div key={req.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-12 w-12 cursor-pointer overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                        onClick={() => setSelectedUserForProfile(req.otherUser)}
                      >
                        {req.otherUser?.photoURL ? (
                          <img src={req.otherUser.photoURL} alt={req.otherUser?.name || 'User'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-400"><Mail size={18} /></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black">{req.otherUser?.name || req.fromName || 'Student'}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Connection Request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="xs" variant="ghost" className="rounded-full h-8 w-8 p-0" onClick={() => handleDecline(req)}>
                        <X size={16} className="text-zinc-400" />
                      </Button>
                      <Button size="xs" className="rounded-full px-3 h-8 text-[11px] font-black" onClick={() => handleAccept(req)}>
                        Accept
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
                    <Mail size={40} />
                  </div>
                  <h2 className="text-xl font-bold">No new requests</h2>
                  <p className="mt-2 text-sm text-zinc-500">Incoming requests from others will show up here.</p>
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
                  <div key={req.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 cursor-pointer overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                        onClick={() => setSelectedUserForProfile(req.otherUser)}
                      >
                        {req.otherUser?.photoURL ? (
                          <img src={req.otherUser.photoURL} alt={req.otherUser?.name || 'Student'} className="h-full w-full object-cover" />
                        ) : (
                          <User size={18} className="m-auto text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{req.otherUser?.name || 'Student'}</p>
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Waiting...</p>
                        </div>
                      </div>
                    </div>
                    <Button size="xs" variant="ghost" className="h-8 text-[11px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => handleCancel(req)}>Cancel</Button>
                  </div>
                ))
              ) : (
                <div className="mt-20 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
                    <ChevronRight size={40} className="rotate-45" />
                  </div>
                  <h2 className="text-xl font-bold">Queue empty</h2>
                  <p className="mt-2 text-sm text-zinc-500">You haven't sent any pending requests lately.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={Boolean(selectedUserForProfile)}
        onClose={() => setSelectedUserForProfile(null)}
        padding={false}
      >
        {selectedUserForProfile && (
          <div className="h-[500px]">
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
