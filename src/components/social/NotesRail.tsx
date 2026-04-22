import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useMatches } from '@/hooks/useMatches';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';

interface NoteAvatarProps {
  uid: string;
  photoURL?: string | null;
  name: string;
  isSelf: boolean;
  note?: UserNote;
  onClick?: () => void;
  onBubbleClick?: () => void;
}

const PulseBubble = ({ text, onClick }: { text: string; onClick?: () => void }) => (
  <motion.div
    initial={{ scale: 0, y: 10, opacity: 0 }}
    animate={{ scale: 1, y: 0, opacity: 1 }}
    exit={{ scale: 0, y: 10, opacity: 0 }}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-max max-w-[80px]"
  >
    <div className="relative bg-white dark:bg-zinc-100 px-2 py-1 rounded-lg shadow-xl border border-zinc-200">
      <p className="text-[8px] font-black uppercase text-black line-clamp-2 leading-tight tracking-tight">
        {text}
      </p>
      {/* Small triangle arrow */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-100 rotate-45 border-r border-b border-zinc-200" />
    </div>
  </motion.div>
);

const NoteAvatar: React.FC<NoteAvatarProps> = ({ 
  uid, 
  photoURL, 
  name, 
  isSelf, 
  note, 
  onClick,
  onBubbleClick 
}) => {
  const { isOnline } = usePresenceStatus(uid);

  return (
    <div 
      onClick={onClick}
      className="relative shrink-0 w-16 group cursor-pointer select-none"
    >
      <AnimatePresence>
        {note && (
          <PulseBubble text={note.text} onClick={onBubbleClick} />
        )}
      </AnimatePresence>

      <div className={`mx-auto h-16 w-16 rounded-2xl overflow-hidden border transition-all duration-500 ${
        note ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-105' : 'border-white/5'
      }`}>
        <div className="h-full w-full bg-zinc-900">
          {photoURL ? (
            <img 
              src={photoURL} 
              alt={name} 
              className={`h-full w-full object-cover transition-all duration-700 ${
                note ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
              }`} 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">
              <User size={24} />
            </div>
          )}
        </div>
      </div>

      {isOnline && !isSelf && (
        <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      )}

      {isSelf && !note && (
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black shadow-xl group-hover:scale-110 transition-transform">
          <Plus size={14} strokeWidth={3} />
        </div>
      )}

      <p className="mt-2 truncate text-[9px] font-black uppercase tracking-widest text-zinc-500 text-center font-mono">
        {isSelf ? 'YOU' : name.split(' ')[0]}
      </p>
    </div>
  );
};

interface NotesRailProps {
  onNoteClick?: (uid: string) => void;
  onProfileClick?: (user: any) => void;
  onChatClick?: (chatId: string) => void;
}

export const NotesRail: React.FC<NotesRailProps> = ({ 
  onNoteClick, 
  onProfileClick,
  onChatClick 
}) => {
  const { user, userData } = useAuth();
  const { notes } = useNotes();
  const { matches } = useMatches();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-6">
      {/* Self Note */}
      <NoteAvatar 
        uid={user.uid}
        name="You"
        isSelf={true}
        photoURL={userData?.photoURL || user.photoURL}
        note={notes[user.uid]}
        onClick={() => onNoteClick?.(user.uid)}
      />

      {/* Friends Notes */}
      {matches.map((match) => {
        const otherUser = match.otherUser;
        if (!otherUser) return null;
        
        return (
          <NoteAvatar 
            key={match.otherUserId}
            uid={match.otherUserId}
            name={otherUser.name || 'Student'}
            photoURL={otherUser.photoURL}
            isSelf={false}
            note={notes[match.otherUserId]}
            onClick={() => onProfileClick?.(otherUser)}
            onBubbleClick={() => onChatClick?.(match.chatId)}
          />
        );
      })}
    </div>
  );
};
