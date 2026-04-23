import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { Search, MessageCircle, User, Plus, Radio } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';
import ProfileCard from '@/components/profile/ProfileCard';
import { useNotes } from '@/hooks/useNotes';
import { NotesRail } from '@/components/social/NotesRail';
import { motion, AnimatePresence } from 'framer-motion';

// Global Social State & Interaction Layer




const PresenceDot = ({ isOnline, className = "" }: { isOnline: boolean; className?: string }) => {
  if (!isOnline) return null;
  return (
    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#020202] bg-white shadow-[0_0_10px_white] ${className}`} />
  );
};



const ChatListItem = ({ match, onAvatarClick }: { match: any; onAvatarClick: (user: any) => void }) => {
  const [otherUser, setOtherUser] = useState<any>(match.otherUser || null);
  const navigate = useNavigate();
  const { isOnline, lastChanged } = usePresenceStatus(match.otherUserId);

  const statusText = (() => {
    if (isOnline) return 'LIVE';
    if (!lastChanged) return 'IDLE';

    const diffMs = Date.now() - lastChanged;
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `${diffMin}M`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}H`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}D`;
  })();

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (match.otherUser) {
          setOtherUser(match.otherUser);
          return;
      }
      const userDoc = await getDoc(doc(db, 'users', match.otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    };
    fetchOtherUser();
  }, [match.otherUserId, match.otherUser]);

  if (!otherUser) return null;

  return (
    <div 
      onClick={() => navigate(`/chat/${match.chatId}`)}
      className="flex cursor-pointer items-center gap-4 sm:gap-5 p-4 sm:p-6 border border-white/[0.02] bg-zinc-900/20 hover:bg-zinc-900 transition-all group"
    >
      <div 
        className="relative"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(otherUser);
        }}
      >
        <div className="h-16 w-16 overflow-hidden rounded-[1.2rem] bg-zinc-800 border border-white/5 transition-all group-hover:border-white/20">
          {otherUser.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.name} className="h-full w-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">
              <User size={24} />
            </div>
          )}
        </div>
        <PresenceDot isOnline={isOnline} className="bottom-0.5 right-0.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate">
            {otherUser.name}
          </h3>
          <span className={`font-mono text-[9px] font-black tracking-[0.2em] ${isOnline ? 'text-white' : 'text-zinc-600'}`}>
            {statusText}
          </span>
        </div>
        <p className="line-clamp-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
           {otherUser.currentVibe ? (
             <span className="flex items-center gap-1.5 font-mono">
               <Radio size={10} className="text-primary animate-pulse" /> {otherUser.currentVibe}
             </span>
           ) : otherUser.username ? `@${otherUser.username}` : 'Connection established'}
        </p>
      </div>
    </div>
  );
};

const ChatList = () => {
  const { user, userData } = useAuth();
  const { matches, loading } = useMatches();
  const { notes, postNote: postNoteToSystem, deleteNote, myNote } = useNotes();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [isPostingNote, setIsPostingNote] = useState(false);
  const [activeNoteUid, setActiveNoteUid] = useState<string | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);
  const [noteInput, setNoteInput] = useState(myNote?.text || '');

  const activeNote = activeNoteUid ? notes[activeNoteUid] : null;

  const postNote = async () => {
    if (!user) return;
    const text = noteInput.trim();

    if (!text) {
      toast.error('Write a note first.');
      return;
    }

    if (text.length > 160) {
      toast.error('Note must be 160 characters or less.');
      return;
    }

    try {
      setIsPostingNote(true);
      await postNoteToSystem(text);
      toast.success('System note updated.', { icon: '📝' });
      setShowComposer(false);
    } catch (error) {
      console.error('Failed to post note:', error);
      toast.error('Could not log note.');
    } finally {
      setIsPostingNote(false);
    }
  };

  useEffect(() => {
    if (myNote) setNoteInput(myNote.text);
  }, [myNote]);

  const filteredMatches = matches.filter((match) => {
    const other = match.otherUser || {};
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      (other.name || '').toLowerCase().includes(term)
      || (other.username || '').toLowerCase().includes(term)
      || (other.department || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden">
      {/* Editorial Header - Desktop Only */}
      <div className="hidden lg:block px-8 pt-12 pb-8 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-white">Inbox</h1>
          <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-500">
             <MessageCircle size={18} />
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 pt-6 lg:pt-0 pb-8">
        {/* Editorial Notes Rail */}

        {/* Editorial Notes Rail */}
        <div className="mb-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 font-mono">System Notes</h2>
            {showComposer && (
               <button onClick={() => setShowComposer(false)} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                  Cancel
               </button>
            )}
          </div>

          <div className="no-scrollbar">
            <NotesRail 
              onNoteClick={(uid) => {
                setActiveNoteUid(uid);
                if (uid === user.uid && !myNote) setShowComposer(true);
              }}
              onProfileClick={(otherUser) => setSelectedUserForProfile(otherUser)}
              onChatClick={(chatId) => navigate(`/chat/${chatId}`)}
            />
          </div>

          {showComposer && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="mb-8 p-6 bg-zinc-900 rounded-[1.5rem] border border-white/[0.05]"
             >
                <div className="flex gap-4">
                   <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    maxLength={160}
                    placeholder="Log a 24h note..."
                    className="flex-1 bg-black border border-white/[0.05] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                  <button
                    onClick={postNote}
                    disabled={isPostingNote}
                    className="px-6 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    Log
                  </button>
                </div>
             </motion.div>
          )}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input 
            placeholder="FILTER CHATS" 
            className="w-full bg-zinc-900/50 border border-white/[0.05] rounded-xl pl-12 pr-4 py-4 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-white/20 transition-all no-scrollbar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col mb-32">
        {loading ? (
          <div className="p-8 space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900" />)}
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map(match => (
            <ChatListItem 
              key={match.id} 
              match={match} 
              onAvatarClick={(u) => setSelectedUserForProfile(u)}
            />
          ))
        ) : (
          <div className="mt-32 flex flex-col items-center p-8 text-center">
            <div className="mb-8 h-20 w-20 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-700">
              <MessageCircle size={40} />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Quiet Frequency</h2>
            <p className="mt-2 max-w-[220px] text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
              New connections will materialize here once established.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(activeNoteUid)}
        onClose={() => setActiveNoteUid(null)}
        title={activeNoteUid === user?.uid ? 'LOGGED NOTE' : 'SYSTEM NOTE'}
      >
        <div className="space-y-6 p-2">
          {activeNote ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-900 p-6 text-sm text-zinc-200 leading-relaxed font-medium">
                {activeNote.text}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-xs text-zinc-600 uppercase tracking-widest text-center">
                NO ACTIVE FREQUENCY
            </div>
          )}

          {activeNoteUid === user?.uid && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={160}
                placeholder="Log a pulse..."
                className="h-12 flex-1 rounded-xl bg-zinc-900 border border-white/5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <button
                onClick={postNote}
                disabled={isPostingNote}
                className="h-12 w-12 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedUserForProfile)}
        onClose={() => setSelectedUserForProfile(null)}
        title="SYSTEM CLEARANCE"
      >
        {selectedUserForProfile && (
          <div className="h-[520px]">
            <ProfileCard 
              user={selectedUserForProfile} 
              className="h-full border-none shadow-none bg-transparent"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChatList;
