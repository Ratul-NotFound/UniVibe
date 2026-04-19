import { useState, useEffect } from 'react';
import { ref, onValue, push, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  readBy?: Record<string, boolean>;
}

export const useChat = (chatId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!chatId || !user) return;

    const chatRef = ref(rtdb, `chats/${chatId}/messages`);
    const typingRef = ref(rtdb, `chats/${chatId}/typing/${user.uid}`);
    const otherTypingRef = ref(rtdb, `chats/${chatId}/typing`);

    // Listen for messages
    const unsubscribeMessages = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const msgList: Message[] = [];
      if (data) {
        Object.entries(data).forEach(([id, msg]: [string, any]) => {
          msgList.push({ id, ...msg });
        });
      }
      setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
      setLoading(false);
    });

    // Listen for other user typing
    const unsubscribeTyping = onValue(otherTypingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const otherId = Object.keys(data).find(id => id !== user.uid);
        setOtherUserTyping(otherId ? data[otherId] : false);
      }
    });

    // Clear typing on disconnect
    onDisconnect(typingRef).set(false);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId, user]);

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!chatId || !user || !content.trim()) return;

    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      senderId: user.uid,
      content,
      type,
      timestamp: serverTimestamp(),
      readBy: { [user.uid]: true }
    });

    // Update last message in Firestore if needed (though RTDB is primary for chat)
  };

  const setTyping = (typing: boolean) => {
    if (!chatId || !user) return;
    const typingRef = ref(rtdb, `chats/${chatId}/typing/${user.uid}`);
    set(typingRef, typing);
  };

  return { messages, loading, sendMessage, setTyping, otherUserTyping };
};
