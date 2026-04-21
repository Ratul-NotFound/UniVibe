import { useState, useEffect } from 'react';
import { ref, onValue, push, set, onDisconnect } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface PortalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  content: string;
  timestamp: number;
}

export const usePortals = (portalId: string | undefined) => {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState<number>(0);

  useEffect(() => {
    if (!portalId || !user) {
      setLoading(false);
      return;
    }

    const messagesRef = ref(rtdb, `portals/${portalId}/messages`);
    const presenceRef = ref(rtdb, `portals/${portalId}/presence/${user.uid}`);
    const totalPresenceRef = ref(rtdb, `portals/${portalId}/presence`);

    // Join Portal (Presence)
    set(presenceRef, {
      name: userData?.name || 'DIU Student',
      active: true
    });
    onDisconnect(presenceRef).remove();

    // Listen for messages
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const msgList: PortalMessage[] = [];
      if (data) {
        Object.entries(data).forEach(([id, msg]: [string, any]) => {
          msgList.push({ id, ...msg });
        });
      }
      setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
      setLoading(false);
    });

    // Listen for member count
    const unsubscribePresence = onValue(totalPresenceRef, (snapshot) => {
      const data = snapshot.val();
      setActiveMembers(data ? Object.keys(data).length : 0);
    });

    return () => {
      unsubscribeMessages();
      unsubscribePresence();
      set(presenceRef, null);
    };
  }, [portalId, user, userData]);

  const sendPortalMessage = async (content: string) => {
    if (!portalId || !user || !content.trim()) return;

    const messagesRef = ref(rtdb, `portals/${portalId}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      senderId: user.uid,
      senderName: userData?.name || 'DIU Student',
      senderPhotoURL: userData?.photoURL || null,
      content,
      timestamp: Date.now()
    });
  };

  return { 
    messages, 
    loading, 
    activeMembers,
    sendPortalMessage
  };
};
