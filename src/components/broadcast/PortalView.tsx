import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Users, Zap, Clock, 
  MessageSquare, User as UserIcon, Sparkles, Smile
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickEmojis = ['❤️', '🔥', '😂', '💯', '👍', '🙌', '✨', '🤩', '😎', '🤫'];

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendPortalMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-transparent overflow-hidden">
      {/* Portal Header */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 mb-3">
           <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeMembers} Active Now
           </span>
           <div className="h-px flex-1 bg-white/[0.03]" />
           <Zap size={12} className="text-primary opacity-50" />
        </div>
        <div className="p-3 bg-black/50 rounded-xl border border-white/5">
           <p className="text-[10px] text-zinc-400 font-medium italic opacity-80 break-words line-clamp-1">
             "{signal?.content}"
           </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-center px-8">
             <div className="mb-4 p-4 bg-zinc-900 rounded-full text-zinc-600">
                <MessageSquare size={32} />
             </div>
             <h4 className="text-sm font-black text-white mb-2">The Portal is Quiet</h4>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
               Start the conversation. Be the first one to wave back!
             </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === user?.uid;
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}
              >
                {/* Portal Avatar */}
                <div className="h-7 w-7 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 mb-1">
                   {msg.senderPhotoURL ? (
                     <img src={msg.senderPhotoURL} className="h-full w-full object-cover" />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center text-[8px] font-black text-primary italic">
                        {msg.senderName?.[0]}
                     </div>
                   )}
                </div>

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-center gap-2 mb-0.5 px-1">
                    {!isOwn && (
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">{msg.senderName}</span>
                    )}
                    <span className="text-[7px] font-bold text-zinc-700">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-3.5 py-2 rounded-2xl text-[11px] font-medium leading-relaxed ${
                    isOwn 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                  }`}>
                    {msg.type === 'gif' ? (
                      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 w-full max-w-[200px]">
                        <img src={msg.content} alt="GIF" className="w-full h-auto object-cover" />
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-zinc-900/20 relative">
        {/* Pickers */}
        <AnimatePresence>
          {showGifPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-6 w-64 max-h-80 overflow-hidden p-4 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col no-scrollbar mb-2"
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
              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-2 pb-2 min-h-[150px]">
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
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-6 w-64 p-3 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 no-scrollbar mb-2"
            >
              <div className="grid grid-cols-5 gap-2 pb-1">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl transition-all active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex gap-2 relative items-center">
          <button 
            type="button" 
            onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
            className={`h-10 px-3 flex items-center justify-center rounded-xl border transition-all text-[8px] font-black uppercase tracking-widest ${showGifPicker ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white'}`}
          >
            GIF
          </button>
          
          <button 
            type="button" 
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
            className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${showEmojiPicker ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white'}`}
          >
            <Smile size={16} />
          </button>

          <input 
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Portal message..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all pr-12"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            <Send size={14} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="h-3 w-3 rounded-full border border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <UserIcon size={8} className="text-zinc-600" />
               </div>
             ))}
          </div>
          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">
            Ephemeral chat automatically dissolves when the pulse ends
          </span>
        </div>
      </div>
    </div>
  );
};
