import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Send, Image, MoreVertical, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { createAppNotification } from '@/lib/notifications';
import { usePresenceStatus } from '@/hooks/usePresenceStatus';
import { Modal } from '@/components/ui/Modal';
import ProfileCard from '@/components/profile/ProfileCard';
import MatchScoreBadge from '@/components/profile/MatchScoreBadge';
import { Heart, Trash2, Smile } from 'lucide-react';

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
  const [matchScore, setMatchScore] = useState<number | null>(null);
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
        setMatchScore(matchData.matchScore || 0);
        const recipientId = (matchData.users || []).find((id: string) => id !== user.uid);
        
        if (!recipientId) {
          setCanAccess(false);
          return;
        }

        // Real-time Recipient Sync
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

    // Mark unread messages as read
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (canAccess === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-center dark:bg-zinc-950">
        <div>
          <h2 className="text-xl font-black">Chat unavailable</h2>
          <p className="mt-2 text-sm text-zinc-500">You can message only after a request is accepted.</p>
          <button onClick={() => navigate('/matches')} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
            Go to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Bar */}
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <button onClick={() => navigate(-1)} className="text-zinc-500">
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="h-10 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ring-2 ring-transparent transition-all hover:ring-primary/20"
        >
          {recipient?.photoURL && <img src={recipient.photoURL} className="h-full w-full object-cover" />}
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">
            {recipient?.name || 'Chat Room'}
          </h2>
          <p className="text-[10px] font-bold text-emerald-500">
            {otherUserTyping ? 'typing...' : isOnline ? 'Online now' : 'Active lately'}
          </p>
        </div>
        
        {matchScore !== null && (
          <div className="scale-50 -mr-4">
            <MatchScoreBadge score={matchScore} />
          </div>
        )}

        <button 
          onClick={() => navigate(-1)} 
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        <div className="flex justify-center py-8">
          <div className="rounded-full bg-zinc-100 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:bg-zinc-900">
            Messages are encrypted
          </div>
        </div>

        {messages.map((msg, index) => {
          const isOwn = msg.senderId === user?.uid;
          const isLastMessage = index === messages.length - 1;
          const isRead = msg.readBy && Object.keys(msg.readBy).some(uid => uid !== user?.uid);
          const reactions = msg.reactions ? Object.entries(msg.reactions) : [];
          
          // Check if next message is from the same sender to handle avatar/rounding
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
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isOwn && (
                <div className="w-8 flex-shrink-0">
                  {isLastInBlock ? (
                    <div 
                      onClick={() => setIsProfileOpen(true)}
                      className="h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                    >
                      {recipient?.photoURL ? (
                        <img src={recipient.photoURL} alt={recipient.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  ) : <div className="h-8 w-8" />}
                </div>
              )}

              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isOwn) {
                      setSelectedMessageId(msg.id);
                      setShowActionMenu(true);
                    }
                  }}
                  onClick={() => handleDoubleTap(msg.id)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div
                      className={`relative rounded-2xl px-4 py-2 text-sm shadow-sm transition-all active:scale-[0.98] ${
                        isOwn 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-none' 
                          : 'bg-white text-zinc-900 rounded-bl-none dark:bg-zinc-900 dark:text-white dark:border dark:border-zinc-800'
                      }`}
                    >
                      {msg.content}
                      
                      {/* Bubble Tail for first message in block */}
                      {isLastInBlock && (
                        <div className={`absolute bottom-0 w-3 h-3 ${isOwn ? '-right-1 bg-primary/80' : '-left-1 bg-white dark:bg-zinc-900'} [clip-path:polygon(0%_100%,100%_100%,100%_0%)] rotate-12 -z-10`} />
                      )}
                    </div>

                    {/* Reaction Badges */}
                    {reactions.length > 0 && (
                      <div className={`absolute -bottom-2 flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] shadow-md dark:bg-zinc-800 ring-1 ring-zinc-100 dark:ring-zinc-700 ${isOwn ? 'right-0' : 'left-0'}`}>
                        {Array.from(new Set(reactions.map(([_, emoji]) => emoji))).map(emoji => (
                          <span key={emoji}>{emoji}</span>
                        ))}
                        {reactions.length > 1 && <span className="font-bold ml-1 opacity-60">{reactions.length}</span>}
                      </div>
                    )}
                  </motion.div>
                </div>

                {isOwn && isLastMessage && isRead && (
                  <div className="mt-1 pr-1">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">Seen</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-200 px-4 py-2 text-sm dark:bg-zinc-800">
              <div className="flex gap-1">
                <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400" />
                <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.2s]" />
                <div className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-100 bg-white p-4 pb-8 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button type="button" className="mb-2 text-zinc-400 hover:text-primary">
            <Image size={24} />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-800"
              value={inputText}
              onChange={handleInputChange}
            />
            {/* AI Suggestion Placeholder */}
            {messages.length === 0 && (
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                title="AI Icebreaker"
              >
                <Sparkles size={18} />
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        padding={false}
      >
        {recipient && (
          <div className="h-[500px]">
            <ProfileCard 
              user={recipient} 
              className="h-full"
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        title="Message Actions"
      >
        <div className="space-y-4">
          <div className="flex justify-center gap-4 py-2">
            {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  if (selectedMessageId) {
                    reactToMessage(selectedMessageId, emoji);
                    setShowActionMenu(false);
                  }
                }}
                className="text-2xl transition-transform hover:scale-125"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20"
          >
            <Trash2 size={18} />
            Unsend Message
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ChatRoom;
