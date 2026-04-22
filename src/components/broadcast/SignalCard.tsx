import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, MapPin, Users,
  Ghost, Flame, Send, X, CheckCheck,
  MessageCircle, Share2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SIGNAL_THEMES } from '@/hooks/useBroadcasts';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface SignalCardProps {
  signal: any;
  onJoin: (id: string) => void;
  onOpenPortal: (id: string) => void;
  onIgnite: (id: string) => void;
  currentUser: any;
}

// Share Modal
const ShareModal: React.FC<{
  signal: any;
  onClose: () => void;
}> = ({ signal, onClose }) => {
  const { matches, loading } = useMatches();
  const { user, userData } = useAuth();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const handleSend = async (match: any) => {
    if (!user || !db || sent.includes(match.chatId)) return;
    setSending(match.otherUserId);
    try {
      const chatRef = collection(db, 'chats', match.chatId, 'messages');
      await addDoc(chatRef, {
        type: 'signal_share',
        senderId: user.uid,
        senderName: userData?.name || 'Someone',
        senderPhotoURL: userData?.photoURL || null,
        content: `📡 Shared a Feed Signal: "${signal.content?.slice(0, 80)}${signal.content?.length > 80 ? '…' : ''}"`,
        signalId: signal.id,
        signalContent: signal.content,
        signalCategory: signal.category,
        signalAuthor: signal.isAnonymous ? 'Anonymous' : signal.fromName,
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });
      setSent(prev => [...prev, match.chatId]);
      toast.success(`Sent to ${match.otherUser?.name || 'friend'}!`, { icon: '📩' });
    } catch (err) {
      toast.error('Failed to send');
    } finally {
      setSending(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Share to Inbox</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Select a friend to send this signal</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Signal Preview */}
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-zinc-800/60 border border-white/[0.05]">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-1">
            {signal.isAnonymous ? '👻 Anonymous' : signal.fromName} · {signal.category}
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 italic">
            "{signal.content}"
          </p>
        </div>

        {/* Friends List */}
        <div className="px-4 pb-5 mt-3 space-y-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[10px] uppercase tracking-widest text-zinc-600 font-black">Loading connections...</div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-[10px] uppercase tracking-widest text-zinc-600 font-black">No friends yet.<br/>Connect with others first.</div>
          ) : (
            matches.map(match => {
              const isSent = sent.includes(match.chatId);
              const isSending = sending === match.otherUserId;
              return (
                <button
                  key={match.id}
                  onClick={() => handleSend(match)}
                  disabled={isSent || isSending}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                    isSent
                      ? 'bg-primary/10 border-primary/20 opacity-70'
                      : 'bg-zinc-800/40 border-white/[0.04] hover:bg-zinc-800 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                      {match.otherUser?.photoURL ? (
                        <img src={match.otherUser.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-black text-xs text-primary">
                          {match.otherUser?.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wide">{match.otherUser?.name || 'Friend'}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{match.otherUser?.department || 'Connected'}</p>
                    </div>
                  </div>
                  {isSent ? (
                    <CheckCheck size={16} className="text-primary" />
                  ) : isSending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <Send size={14} className="text-zinc-600 group-hover:text-primary transition-colors" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const SignalCard: React.FC<SignalCardProps> = ({
  signal, onJoin, onOpenPortal, onIgnite, currentUser
}) => {
  const theme = SIGNAL_THEMES[signal.category as keyof typeof SIGNAL_THEMES] || SIGNAL_THEMES.broadcast;
  const isJoined = signal.interactors?.includes(currentUser?.uid);
  const isOwner = signal.fromUid === currentUser?.uid;
  const [showShareModal, setShowShareModal] = useState(false);

  const [percentLeft, setPercentLeft] = useState(100);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = signal.createdAt?.toMillis() || now;
      const end = signal.expiresAt?.toMillis() || now;
      const total = end - start;
      const left = end - now;
      const p = Math.max(0, Math.min(100, (left / total) * 100));
      setPercentLeft(p);
      const mins = Math.max(0, Math.floor(left / 60000));
      if (mins > 60) setTimeLeft(`${Math.floor(mins / 60)}h ${mins % 60}m`);
      else setTimeLeft(`${mins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [signal]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative group rounded-2xl border transition-all duration-300 hover:border-white/[0.1] overflow-hidden ${
          signal.priority > 0
            ? 'bg-gradient-to-br from-primary/10 via-zinc-900/80 to-primary/5 border-primary/30 shadow-[0_0_20px_rgba(212,83,126,0.08)]'
            : 'bg-zinc-900/60 border-white/[0.05] hover:bg-zinc-900/80'
        }`}
      >
        {/* Priority accent line */}
        {signal.priority > 0 && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-full overflow-hidden border flex-shrink-0 ${
                signal.isAnonymous ? 'bg-zinc-800 border-white/10 flex items-center justify-center' : 'border-white/10'
              }`}>
                {signal.isAnonymous ? (
                  <Ghost size={16} className="text-zinc-500 mx-auto" />
                ) : signal.fromPhotoURL ? (
                  <img src={signal.fromPhotoURL} alt={signal.fromName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-black italic text-primary text-xs bg-zinc-800">
                    {signal.fromName?.[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-white tracking-wide">
                    {signal.isAnonymous ? 'Anonymous' : signal.fromName}
                  </span>
                  {signal.priority > 0 && <Flame size={10} className="text-orange-400 fill-orange-400 animate-pulse" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight ${theme.bg} ${theme.color}`}>
                    {theme.label}
                  </span>
                  {signal.zone && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-zinc-600 uppercase">
                      <MapPin size={7} />{signal.zone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-black text-zinc-600 uppercase">
              <Clock size={9} className={percentLeft < 20 ? 'text-rose-500 animate-pulse' : ''} />
              <span className={percentLeft < 20 ? 'text-rose-500' : ''}>{timeLeft}</span>
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-[13px] text-zinc-200 leading-relaxed break-words">
              {signal.content}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.04] -mx-4 mb-3" />

          {/* Footer Actions */}
          <div className="flex items-center justify-between">
            {/* Left: Stats + Share */}
            <div className="flex items-center gap-3">
              <button
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition-colors ${
                  isJoined ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Users size={13} className={isJoined ? 'text-primary' : ''} />
                <span>{signal.interestCount || 0}</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-200 transition-colors group/share"
                title="Share to inbox"
              >
                <Share2 size={13} className="group-hover/share:text-primary transition-colors" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {!isOwner && signal.priority === 0 && (
                <button
                  onClick={() => onIgnite(signal.id)}
                  className="h-8 px-3 rounded-xl border border-white/[0.06] hover:bg-orange-500/10 hover:border-orange-500/30 transition-all flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-500 hover:text-orange-400"
                >
                  <Flame size={12} className="text-orange-500" />
                  <span className="hidden sm:inline">Ignite</span>
                </button>
              )}

              {signal.isPortal ? (
                <button
                  onClick={() => isJoined ? onOpenPortal(signal.id) : onJoin(signal.id)}
                  className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    isJoined
                      ? 'bg-zinc-800 text-white hover:bg-primary/20 border border-primary/20'
                      : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                  }`}
                >
                  {isJoined ? (
                    <><MessageCircle size={12} /> Enter Portal</>
                  ) : (
                    <><Zap size={12} /> Join</>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => !isJoined && onJoin(signal.id)}
                  className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    isJoined
                      ? 'bg-zinc-800 text-zinc-400 border border-white/[0.05] cursor-default'
                      : 'bg-white text-black hover:bg-primary hover:text-white'
                  }`}
                >
                  {isJoined ? (
                    <><CheckCheck size={12} /> Joined</>
                  ) : (
                    <><ChevronRight size={12} /> I'm Interested</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Energy Burn Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.03]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentLeft}%` }}
            className={`h-full ${percentLeft < 25 ? 'bg-rose-500' : 'bg-primary/50'}`}
            transition={{ duration: 1 }}
          />
        </div>
      </motion.div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            signal={signal}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
