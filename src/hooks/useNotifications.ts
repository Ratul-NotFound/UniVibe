import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export interface AppNotification {
  id: string;
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
    if (!user || !messaging || !isSupported) return;

    setPermission(Notification.permission);

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);

      const nextNotification: AppNotification = {
        id: payload.messageId || `${Date.now()}`,
        title: payload.notification?.title || 'New notification',
        body: payload.notification?.body || 'You have a new update.',
        receivedAt: Date.now(),
        isRead: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, 30));

      toast(payload.notification?.body || 'New notification', {
        icon: '🔔',
        duration: 4000
      });
    });

    return () => unsubscribe();
  }, [user, isSupported]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
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
