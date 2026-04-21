import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Send, Image, MoreVertical, Sparkles, User, Radio, Trash2, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { createAppNotification } from '@/lib/notifications';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChatId = canAccess ? chatId : undefined;
  const { messages, loading, sendMessage, setTyping, otherUserTyping, reactToMessage, deleteMessage, markAsRead } = useChat(activeChatId);
  const { isOnline } = usePresenceStatus(recipient?.id);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    if (!chatId || !user) return;

    let unsubRecipient: (() => void) | null = null;

    const findRecipient = async () => {
      try {
        const matchesRef = collection(db, 'matches');
        const q = query(
          matchesRef,
          where('chatId', '==', chatId),
          where('users', 'array-contains', user.uid),
          limit(1)
        );

        const matchSnapshot = await getDocs(q);
        if (matchSnapshot.empty) {
          setCanAccess(false);
          return;
        }

        const matchData = matchSnapshot.docs[0].data();
        const recipientId = (matchData.users || []).find((id: string) => id !== user.uid);
        
        if (!recipientId) {
          setCanAccess(false);
          return;
        }

        unsubRecipient = onSnapshot(doc(db, 'users', recipientId), (d) => {
          if (d.exists()) {
            setRecipient({ id: d.id, ...d.data() });
            setCanAccess(true);
          } else {
            setCanAccess(false);
          }
        });

      } catch (err) {
        console.error('Failed to load chat recipient:', err);
        setCanAccess(false);
      }
    };

    findRecipient();
    return () => {
      if (unsubRecipient) unsubRecipient();
    };
  }, [chatId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }

    if (user && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user.uid && !lastMessage.readBy?.[user.uid]) {
        markAsRead(lastMessage.id);
      }
    }
  }, [messages, user, markAsRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const content = inputText;
    sendMessage(content);

    if (recipient?.id && user?.uid) {
      createAppNotification({
        toUid: recipient.id,
        fromUid: user.uid,
        type: 'message',
        title: 'New message',
        body: `${user.displayName || 'Someone'}: ${content.slice(0, 80)}`,
        link: `/chat/${chatId}`,
        metadata: { chatId },
      }).catch((err) => console.error('Failed to create message notification', err));
    }

    setInputText('');
    setTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  if (canAccess === null || loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#020202]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );

  if (canAccess === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020202] p-8 text-center">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Restriction Enforced</h2>
          <p className="mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-[200px] mx-auto">Access to this frequency is prohibited until connection is established.</p>
          <button onClick={() => navigate('/matches')} className="mt-8 rounded-xl bg-white px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black">
            My Connections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#020202] text-white overflow-hidden">
      {/* Editorial Noir Top Bar */}
      <div className="flex items-center gap-4 border-b border-white/[0.03] bg-[#020202] px-6 py-5">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        
        <div 
          onClick={() => setIsProfileOpen(true)}
          className="h-12 w-12 cursor-pointer overflow-hidden rounded-[1.2rem] bg-zinc-800 border border-white/5"
        >
          {recipient?.photoURL ? (
             <img src={recipient.photoURL} className="h-full w-full object-cover grayscale brightness-75 transition-all hover:grayscale-0 hover:brightness-100" />
          ) : (
             <div className="flex h-full w-full items-center justify-center text-zinc-700">
                <User size={20} />
             </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tighter truncate leading-none mb-1">
            {recipient?.name || 'CLEARANCE ACCESS'}
          </h2>
          <div className="flex items-center gap-2">
             <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-white shadow-[0_0_10px_white]' : 'bg-zinc-800'}`} />
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">
                {otherUserTyping ? 'SIGNAL INCOMING...' : isOnline ? 'ACTIVE FREQUENCY' : 'IDLE LINK'}
             </p>
          </div>
        </div>

        {recipient?.currentVibe && (
           <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg">
              <Radio size={12} className="text-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{recipient.currentVibe}</span>
           </div>
        )}

        <button 
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messaging Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        <div className="flex justify-center py-10 opacity-30">
          <div className="rounded-lg border border-white/10 px-4 py-2 text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">
             End-to-End Encrypted Access
          </div>
        </div>

        {messages.map((msg, index) => {
          const isOwn = msg.senderId === user?.uid;
          const isLastMessage = index === messages.length - 1;
          const isRead = msg.readBy && Object.keys(msg.readBy).some(uid => uid !== user?.uid);
          const reactions = msg.reactions ? Object.entries(msg.reactions) : [];
          const nextMsg = messages[index + 1];
          const isLastInBlock = !nextMsg || nextMsg.senderId !== msg.senderId;

          const handleDoubleTap = (messageId: string) => {
            const now = Date.now();
            if (now - lastTap < 300) {
              reactToMessage(messageId, msg.reactions?.[user?.uid || ''] === '❤️' ? null : '❤️');
            }
            setLastTap(now);
          };

          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isOwn) {
                      setSelectedMessageId(msg.id);
                      setShowActionMenu(true);
                    }
                  }}
                  onClick={() => handleDoubleTap(msg.id)}
                >
                  <div
                    className={`relative px-5 py-3 text-sm font-medium leading-relaxed tracking-tight transition-all active:scale-[0.98] ${
                      isOwn 
                        ? 'bg-zinc-900 border border-white/5 text-white rounded-[1.2rem] rounded-br-none' 
                        : 'bg-white text-black rounded-[1.2rem] rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                    
                    {/* Reaction Badges (Editorial Style) */}
                    {reactions.length > 0 && (
                      <div className={`absolute -bottom-3 flex items-center gap-1 rounded-lg bg-black px-2 py-1 text-[10px] border border-white/10 shadow-2xl ${isOwn ? 'right-0' : 'left-0'}`}>
                        {Array.from(new Set(reactions.map(([_, emoji]) => emoji))).map(emoji => (
                          <span key={emoji}>{emoji}</span>
                        ))}
                        {reactions.length > 1 && <span className="font-black text-[8px] ml-1 opacity-50">{reactions.length}</span>}
                      </div>
                    )}
                  </div>
                </motion.div>

                {isOwn && isLastMessage && isRead && (
                  <div className="mt-2 pr-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 font-mono">Acknowledged</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-zinc-900 border border-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white delay-150" />
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white delay-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Noir Input Area */}
      <div className="border-t border-white/[0.03] bg-[#020202] p-6 pb-12">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button type="button" className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-colors">
            <Image size={20} />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Transmit message..."
              className="w-full h-14 bg-zinc-900 border border-white/[0.03] rounded-xl px-6 text-sm focus:outline-none focus:border-white/20 transition-all font-medium placeholder:text-zinc-600"
              value={inputText}
              onChange={handleInputChange}
            />
            {messages.length === 0 && (
              <button 
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"
              >
                <Sparkles size={16} />
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="h-14 w-14 flex items-center justify-center rounded-xl bg-white text-black shadow-xl disabled:opacity-30 transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="CLEARANCE IDENTITY"
      >
        {recipient && (
          <div className="h-[520px]">
            <ProfileCard 
              user={recipient} 
              className="h-full border-none shadow-none bg-transparent"
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        title="MESSAGE DECRYPTION"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-6 gap-2">
            {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  if (selectedMessageId) {
                    reactToMessage(selectedMessageId, emoji);
                    setShowActionMenu(false);
                  }
                }}
                className="h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-xl text-xl hover:bg-white hover:text-black transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (selectedMessageId) {
                deleteMessage(selectedMessageId);
                setShowActionMenu(false);
              }
            }}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
          >
            <Trash2 size={16} />
            Incinerate Message
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ChatRoom;
