import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export interface AppNotification {
  id: string;
  type?: string;
  link?: string | null;
  fromUid?: string | null;
  title: string;
  body: string;
  receivedAt: number;
  isRead: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const enableNotifications = async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported on this device.');
      return 'denied' as NotificationPermission;
    }

    if (!user || !messaging) {
      toast.error('Sign in is required to enable notifications.');
      return 'denied' as NotificationPermission;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status !== 'granted') {
        return status;
      }

      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE' // This would come from Firebase Console
      });

      if (token) {
        await updateDoc(doc(db, 'users', user.uid), {
          fcmToken: token
        });
      }

      return status;
    } catch (error) {
      console.error('Notification permission error:', error);
      return 'denied' as NotificationPermission;
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('toUid', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = snapshot.docs
        .map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            type: data.type,
            link: data.link || null,
            fromUid: data.fromUid || null,
            title: data.title || 'New notification',
            body: data.body || 'You have a new update.',
            receivedAt: data.createdAt?.toMillis?.() || Date.now(),
            isRead: !!data.isRead,
          };
        })
        .sort((a, b) => b.receivedAt - a.receivedAt)
        .slice(0, 50);

      setNotifications(list);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !messaging || !isSupported) return;

    setPermission(Notification.permission);

    const unsubscribe = onMessage(messaging, (payload) => {
      toast(payload.notification?.body || 'New notification', {
        icon: '🔔',
        duration: 4000,
      });
    });

    return () => unsubscribe();
  }, [user, isSupported]);

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.isRead);
    await Promise.all(unread.map((item) => updateDoc(doc(db, 'notifications', item.id), { isRead: true })));
  };

  const clearNotifications = async () => {
    await Promise.all(notifications.map((item) => deleteDoc(doc(db, 'notifications', item.id))));
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return {
    permission,
    enableNotifications,
    isSupported,
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
  };
};
