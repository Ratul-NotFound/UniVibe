import { useEffect, useState } from 'react';
import { messaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export interface AppNotification {
  id: string;
  toUid: string;
  fromUid?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: any;
  receivedAt: any;
  metadata?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // 1. Push Notification Permission & Token Registration
  const requestPermission = async () => {
    if (!messaging || typeof Notification === 'undefined') return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (token && user) {
          // arrayUnion is idempotent — server will not add duplicates
          await updateDoc(doc(db, 'users', user.uid), {
            fcmTokens: arrayUnion(token),
            notificationsEnabled: true,
            lastTokenRefresh: serverTimestamp()
          });
          console.log('[FCM] Token registered/refreshed:', token.slice(0, 12) + '...');
        }
      }
    } catch (error) {
      console.error('[FCM] Permission/token error:', error);
    }
  };

  // 2. In-App Notification Sync (Firestore real-time listener)
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => {
        const data = d.data();
        let receivedAt = new Date();

        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            receivedAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            receivedAt = data.createdAt;
          } else if (typeof data.createdAt === 'number') {
            receivedAt = new Date(data.createdAt);
          }
        }

        return { id: d.id, ...data, receivedAt } as AppNotification;
      });

      // Sort newest first (no Firestore index required)
      notifs.sort((a, b) => {
        const timeA = (a.receivedAt as Date)?.getTime() || 0;
        const timeB = (b.receivedAt as Date)?.getTime() || 0;
        return timeB - timeA;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    }, (error) => {
      console.error('[Notifications] Snapshot error:', error);
    });

    // Foreground push: show as toast when app is open
    let pushUnsubscribe: () => void = () => {};
    if (messaging) {
      pushUnsubscribe = onMessage(messaging, (payload) => {
        const body = payload.notification?.body || payload.data?.body || 'New alert';
        const title = payload.notification?.title || payload.data?.title || 'UniVibe';
        toast(`${title}: ${body}`, { icon: '🔔' });
      });
    }

    // Auto-refresh FCM token on mount if permission already granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      requestPermission();
    }

    return () => {
      unsubscribe();
      pushUnsubscribe();
    };
  }, [user]);

  // 3. Actions
  const markAllAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.isRead).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  };

  const clearNotifications = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAllAsRead,
    clearNotifications,
    markAsRead
  };
};
