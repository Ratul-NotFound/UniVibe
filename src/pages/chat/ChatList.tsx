import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMatches } from '@/hooks/useMatches';
import { Search, MessageCircle, User, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';
import ProfileCard from '@/components/profile/ProfileCard';

type UserNote = {
  text: string;
  expiresAt: number;
};

const PresenceDot = ({ isOnline, className = "" }: { isOnline: boolean; className?: string }) => {
  if (!isOnline) return null;
  return (
    <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950 ${className}`} />
  );
};

const NoteAvatar = ({ 
  uid, 
  photoURL, 
  name, 
  isSelf, 
  ringClass,
  onClick,
}: { 
  uid: string; 
  photoURL?: string | null; 
  name: string; 
  isSelf: boolean; 
  ringClass: string;
  onClick?: () => void;
}) => {
  const { isOnline } = usePresenceStatus(uid);

  return (
    <div 
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`mx-auto mb-1 h-[66px] w-[66px] rounded-full p-[2px] transition-transform hover:scale-105 active:scale-95 ${ringClass}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-[2px] dark:bg-zinc-950">
        <div className="h-full w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          {photoURL ? (
            <img src={photoURL} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <User size={18} />
            </div>
          )}
        </div>
        
        {isOnline && !isSelf && (
          <PresenceDot isOnline={true} className="bottom-0.5 right-0.5" />
        )}

        {isSelf && (
          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary text-white dark:border-zinc-950">
            <Plus size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

const ChatListItem = ({ match, onAvatarClick }: { match: any; onAvatarClick: (user: any) => void }) => {
  const [otherUser, setOtherUser] = useState<any>(match.otherUser || null);
  const navigate = useNavigate();
  const { isOnline, lastChanged } = usePresenceStatus(match.otherUserId);

  const statusText = (() => {
    if (isOnline) return 'Online';
    if (!lastChanged) return 'Offline';

    const diffMs = Date.now() - lastChanged;
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `Last seen ${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Last seen ${diffDays}d ago`;
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

  if (!otherUser) return (
    <div className="flex animate-pulse items-center gap-4 px-6 py-4">
      <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-900" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );

  return (
    <div 
      onClick={() => navigate(`/chat/${match.chatId}`)}
      className="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
    >
      <div 
        className="relative"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(otherUser);
        }}
      >
        <div className="h-14 w-14 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-transparent transition-all hover:ring-primary/20">
          {otherUser.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <User size={24} />
            </div>
          )}
        </div>
        <PresenceDot isOnline={isOnline} className="bottom-0 right-0" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white">{otherUser.name}</h3>
          <span className={`text-[10px] ${isOnline ? 'text-emerald-500' : 'text-zinc-400'}`}>
            {statusText}
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {otherUser.username ? `@${otherUser.username}` : 'Click here to send a message...'}
        </p>
      </div>
    </div>
  );
};

const ChatList = () => {
  const { user, userData } = useAuth();
  const { matches, loading } = useMatches();
  const [searchTerm, setSearchTerm] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isPostingNote, setIsPostingNote] = useState(false);
  const [notesByUid, setNotesByUid] = useState<Record<string, UserNote>>({});
  const [activeNoteUid, setActiveNoteUid] = useState<string | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setNotesByUid({});
      setNoteInput('');
      return;
    }

    const connectedUids = Array.from(new Set(matches.map((m) => m.otherUserId).filter(Boolean)));
    const watchUids = [user.uid, ...connectedUids];
    const unsubs: Array<() => void> = [];

    watchUids.forEach((uid) => {
      const unsub = onSnapshot(doc(db, 'notes', uid), (snap) => {
        setNotesByUid((prev) => {
          const next = { ...prev };

          if (!snap.exists()) {
            delete next[uid];
            return next;
          }

          const data = snap.data() as { text?: string; expiresAt?: { toMillis?: () => number } };
          const expiresAt = typeof data.expiresAt?.toMillis === 'function' ? data.expiresAt.toMillis() : 0;
          const text = (data.text || '').trim();

          if (!text || expiresAt <= Date.now()) {
            delete next[uid];
            return next;
          }

          next[uid] = { text, expiresAt };
          return next;
        });

        if (uid === user.uid && snap.exists()) {
          const data = snap.data() as { text?: string; expiresAt?: { toMillis?: () => number } };
          const expiresAt = typeof data.expiresAt?.toMillis === 'function' ? data.expiresAt.toMillis() : 0;
          if (expiresAt > Date.now()) {
            setNoteInput((data.text || '').trim());
          }
        }
      });

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [matches, user]);

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
      await setDoc(
        doc(db, 'notes', user.uid),
        {
          ownerUid: user.uid,
          text,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
        },
        { merge: true }
      );
      toast.success('Note posted for 24 hours.');
      setShowComposer(false);
    } catch (error) {
      console.error('Failed to post note:', error);
      toast.error('Could not post note.');
    } finally {
      setIsPostingNote(false);
    }
  };

  const noteCards = (() => {
    const cards: Array<{ uid: string; name: string; photoURL?: string | null; text: string; isSelf: boolean; hasNote: boolean }> = [];

    if (user) {
      cards.push({
        uid: user.uid,
        name: 'Your note',
        photoURL: userData?.photoURL || user.photoURL || null,
        text: notesByUid[user.uid]?.text || '',
        isSelf: true,
        hasNote: Boolean(notesByUid[user.uid]),
      });
    }

    matches.forEach((m) => {
      const uid = m.otherUserId;
      const note = uid ? notesByUid[uid] : null;
      if (!uid) return;

      cards.push({
        uid,
        name: m.otherUser?.name || 'Student',
        photoURL: m.otherUser?.photoURL || null,
        text: note?.text || '',
        isSelf: false,
        hasNote: Boolean(note),
      });
    });

    return cards;
  })();

  const activeNote = activeNoteUid ? noteCards.find((n) => n.uid === activeNoteUid) || null : null;

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
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="p-6 pb-2">
        <h1 className="mb-6 text-3xl font-black text-zinc-900 dark:text-white">Messages</h1>

        <div className="mb-4">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">Notes (24h)</h2>

          {showComposer ? (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={160}
                placeholder="Share a note for 24 hours..."
                className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={postNote}
                disabled={isPostingNote}
                className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {isPostingNote ? 'Posting...' : 'Post'}
              </button>
            </div>
          ) : null}

          <div className="flex gap-4 overflow-x-auto pb-4 pt-10">
            {noteCards.map((card) => {
              const ringClass = card.hasNote
                ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500'
                : 'bg-zinc-300 dark:bg-zinc-700';

              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => {
                    setActiveNoteUid(card.uid);
                    if (card.isSelf && !card.hasNote) setShowComposer(true);
                  }}
                  className="relative w-[72px] shrink-0 text-center"
                >
                  {/* Note Bubble */}
                  {card.hasNote && (
                    <div className="absolute -top-10 left-1/2 z-10 w-[84px] -translate-x-1/2 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                      <div className="relative rounded-2xl bg-zinc-900 px-2 py-1.5 shadow-xl dark:bg-zinc-800 border border-white/10">
                        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                          {card.text}
                        </p>
                        {/* Bubble Tail */}
                        <div className="absolute -bottom-1 left-[30%] h-2 w-2 rotate-45 border-b border-r border-white/5 bg-zinc-900 dark:bg-zinc-800" />
                      </div>
                    </div>
                  )}

                  <NoteAvatar 
                    uid={card.uid}
                    photoURL={card.photoURL}
                    name={card.name}
                    isSelf={card.isSelf}
                    ringClass={ringClass}
                    onClick={() => {
                      if (!card.isSelf) {
                        const match = matches.find(m => m.otherUserId === card.uid);
                        setSelectedUserForProfile(match?.otherUser || { id: card.uid, name: card.name, photoURL: card.photoURL });
                      }
                    }}
                  />
                  <p className="line-clamp-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {card.isSelf ? 'You' : card.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-zinc-50 dark:divide-zinc-900">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-card bg-zinc-50 dark:bg-zinc-900" />)}
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
          <div className="mt-20 flex flex-col items-center p-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
              <MessageCircle size={40} />
            </div>
            <h2 className="text-xl font-bold">No active chats</h2>
            <p className="mt-2 max-w-[250px] text-sm text-zinc-500">
              Matches will show up here as soon as you connect with someone.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(activeNoteUid)}
        onClose={() => setActiveNoteUid(null)}
        title={activeNote?.isSelf ? 'Your Note' : `${activeNote?.name || 'Note'}`}
      >
        <div className="space-y-3">
          {activeNote?.hasNote ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {activeNote.text}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
              {activeNote?.isSelf ? 'You have no active note. Add one below.' : 'No active note right now.'}
            </div>
          )}

          {activeNote?.isSelf ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={160}
                placeholder="Share a note for 24 hours..."
                className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={postNote}
                disabled={isPostingNote}
                className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {isPostingNote ? 'Posting...' : 'Post'}
              </button>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedUserForProfile)}
        onClose={() => setSelectedUserForProfile(null)}
        title="Profile Preview"
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

export default ChatList;
