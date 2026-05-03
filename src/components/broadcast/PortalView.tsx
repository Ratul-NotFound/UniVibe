import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, Zap, Clock,
  MessageSquare, User as UserIcon, Smile, Radio, Ghost
} from 'lucide-react';
import { usePortals } from '@/hooks/usePortals';
import { useAuth } from '@/context/AuthContext';

interface PortalViewProps {
  portalId: string;
  signal: any;
  onClose: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ portalId, signal, onClose }) => {
  const { user } = useAuth();
  const { messages, loading, activeMembers, sendPortalMessage } = usePortals(portalId);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [trendingGifs, setTrendingGifs] = useState<any[]>([]);
  const [gifError, setGifError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [percentLeft, setPercentLeft] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickEmojis = ['❤️', '🔥', '😂', '💯', '👍', '🙌', '✨', '🤩', '😎', '🤫', '👋', '🎯'];

  // Load trending GIFs
  useEffect(() => {
    if (showGifPicker && trendingGifs.length === 0) {
      setGifError(false);
      fetch(`https://api.giphy.com/v1/gifs/trending?api_key=5FmPS3t8fsNeruRIkbeHhZO0VZehe3BS&limit=12`)
        .then(res => {
          if (!res.ok) throw new Error('API restricted');
          return res.json();
        })
        .then(data => setTrendingGifs(data.data || []))
        .catch(err => {
          console.error('Giphy Fetch Error:', err);
          setGifError(true);
        });
    }
  }, [showGifPicker, trendingGifs.length]);

  const handleGifSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gifSearch.trim()) return;
    setGifError(false);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?q=${gifSearch}&api_key=5FmPS3t8fsNeruRIkbeHhZO0VZehe3BS&limit=12`);
      if (!res.ok) throw new Error('API restricted');
      const data = await res.json();
      setTrendingGifs(data.data || []);
    } catch (err) {
      console.error('Giphy Search Error:', err);
      setGifError(true);
    }
  };

  const sendGif = (gifUrl: string) => {
    sendPortalMessage(gifUrl, 'gif');
    setShowGifPicker(false);
  };

  // Time countdown for portal expiry
  useEffect(() => {
    const update = () => {
      if (!signal?.expiresAt) return;
      const now = Date.now();
      const start = signal.createdAt?.toMillis?.() || now;
      const end = signal.expiresAt?.toMillis?.() || now;
      const total = end - start;
      const left = end - now;
      const p = Math.max(0, Math.min(100, (left / total) * 100));
      setPercentLeft(p);

      if (left <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const mins = Math.max(0, Math.floor(left / 60000));
      if (mins > 60) setTimeLeft(`${Math.floor(mins / 60)}h ${mins % 60}m left`);
      else setTimeLeft(`${mins}m left`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [signal]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const content = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    try {
      setIsSending(true);
      await sendPortalMessage(content);
    } finally {
      setIsSending(false);
    }
    inputRef.current?.focus();
  };

  const isExpired = percentLeft <= 0;

  return (
    <div className="flex flex-col h-[580px] bg-[#0a0a0a] rounded-2xl overflow-hidden">

      {/* ── Portal Header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06] bg-zinc-950/80">
        {/* Signal Snippet */}
        <div className="flex items-start gap-3 mb-4">
          <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Radio size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-600 mb-1">Portal Origin Signal</p>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-2 italic">
              "{signal?.content}"
            </p>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Live Members */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeMembers} live
            </span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            percentLeft < 20
              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              : 'text-zinc-500 bg-zinc-900 border-white/[0.06]'
          }`}>
            <Clock size={10} className={percentLeft < 20 ? 'animate-pulse' : ''} />
            {timeLeft || '...'}
          </div>
        </div>

        {/* Burn bar */}
        <div className="mt-3 h-[2px] w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: `${percentLeft}%` }}
            animate={{ width: `${percentLeft}%` }}
            transition={{ duration: 1 }}
            className={`h-full rounded-full ${percentLeft < 20 ? 'bg-rose-500' : 'bg-primary/60'}`}
          />
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Tuning in...</p>
            </div>
          </div>
        ) : isExpired ? (
          <div className="flex flex-col h-full items-center justify-center text-center px-8">
            <div className="mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5">
              <Ghost size={28} className="text-zinc-600" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2">Portal Dissolved</h4>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
              This signal's frequency has expired
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-center px-8">
            <div className="mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5">
              <MessageSquare size={28} className="text-zinc-600" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2">Portal is Quiet</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed max-w-[180px]">
              Be the first to transmit. Everyone here saw the same signal.
            </p>
          </div>
        ) : (
          <>
            {/* Joined banner */}
            <div className="flex items-center justify-center py-1">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-700 border border-white/[0.04] px-3 py-1 rounded-full">
                You joined this portal
              </span>
            </div>

            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className="h-7 w-7 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] flex-shrink-0 mb-0.5">
                    {msg.senderPhotoURL ? (
                      <img src={msg.senderPhotoURL} className="h-full w-full object-cover" alt={msg.senderName} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[9px] font-black text-primary italic">
                        {msg.senderName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[78%]`}>
                    {!isOwn && (
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wide px-1 mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-zinc-800/80 text-zinc-100 border border-white/[0.06] rounded-bl-sm'
                    }`}>
                      {msg.type === 'gif' ? (
                        <div className="rounded-xl overflow-hidden border border-white/10 w-[180px]">
                          <img src={msg.content} alt="GIF" className="w-full h-auto object-cover" />
                        </div>
                      ) : msg.content}
                    </div>
                    <span className="text-[7px] font-bold text-zinc-700 px-1 mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Emoji & GIF Pickers ── */}
      <AnimatePresence>
        {showGifPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mx-4 mb-2 p-4 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col max-h-[300px]"
          >
            <div className="mb-3">
              <input 
                type="text"
                placeholder="Search GIPHY..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-medium outline-none focus:border-primary transition-all text-white"
                value={gifSearch}
                onChange={e => setGifSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGifSearch();
                  }
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2 pb-2">
              {gifError ? (
                <div className="col-span-full flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-[8px] font-black text-zinc-600 uppercase">GIPHY API Restricted</p>
                </div>
              ) : trendingGifs.map(gif => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => sendGif(gif.images.fixed_height.url)}
                  className="rounded-lg overflow-hidden h-20 bg-zinc-800 transition-all hover:opacity-80 active:scale-95"
                >
                  <img src={gif.images.fixed_height_small.url} className="h-full w-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mx-4 mb-2 p-3 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="grid grid-cols-6 gap-1.5">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-xl transition-all active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/[0.05] bg-zinc-950/60">
        {isExpired ? (
          <div className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-700">
            This portal has dissolved
          </div>
        ) : (
          <>
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                className={`h-11 px-3 flex items-center justify-center rounded-xl border transition-all text-[8px] font-black uppercase tracking-widest ${
                  showGifPicker
                    ? 'bg-white text-black border-white'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                GIF
              </button>

              <button
                type="button"
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all ${
                  showEmojiPicker
                    ? 'bg-white text-black border-white'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/20'
                }`}
              >
                <Smile size={17} />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Transmit to the portal..."
                maxLength={500}
                className="flex-1 h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-white font-medium placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-40 transition-all active:scale-95 hover:bg-primary/90"
              >
                {isSending ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>

            {/* Ephemeral notice */}
            <p className="text-center text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-2.5">
              ⚡ Ephemeral — Chat dissolves when the signal expires
            </p>
          </>
        )}
      </div>
    </div>
  );
};
