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

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChatId = canAccess ? chatId : undefined;
  const { messages, loading, sendMessage, setTyping, otherUserTyping } = useChat(activeChatId);
  const { isOnline } = usePresenceStatus(recipient?.id);

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!chatId || !user) return;

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

        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (recipientDoc.exists()) {
          setRecipient({ id: recipientDoc.id, ...recipientDoc.data() });
          setCanAccess(true);
        } else {
          setCanAccess(false);
        }
      } catch (err) {
        console.error('Failed to load chat recipient:', err);
        setCanAccess(false);
      }
    };

    fetchRecipient();
  }, [chatId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {recipient?.photoURL && <img src={recipient.photoURL} className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">{recipient?.name || 'Chat Room'}</h2>
          <p className="text-[10px] text-zinc-500">
            {otherUserTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <button className="text-zinc-400">
          <MoreVertical size={20} />
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
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isOwn 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-zinc-900 rounded-bl-none dark:bg-zinc-900 dark:text-white'
                }`}
              >
                {msg.content}
                <div className={`mt-1 text-[8px] opacity-70 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
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
    </div>
  );
};

export default ChatRoom;
