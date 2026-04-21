import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Users, Zap, Clock, 
  MessageSquare, User as UserIcon, Sparkles
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-[650px] bg-zinc-950 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
      {/* Portal Header */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <Zap size={20} className="fill-primary" />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  Live Portal
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                    {activeMembers} Active Now
                  </span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
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
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                   {!isOwn && (
                     <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{msg.senderName}</span>
                   )}
                   <span className="text-[8px] font-bold text-zinc-600">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium max-w-[85%] ${
                  isOwn 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                }`}>
                   {msg.content}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-zinc-900/20">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input 
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Broadcast to portal..."
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all pr-12"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="h-4 w-4 rounded-full border border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <UserIcon size={10} className="text-zinc-600" />
               </div>
             ))}
          </div>
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
            Ephemeral chat automatically dissolves when the pulse ends
          </span>
        </div>
      </div>
    </div>
  );
};
