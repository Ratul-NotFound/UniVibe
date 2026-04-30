import { useEffect, useState } from 'react';
import { messaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

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
          // Save token to user profile
          await updateDoc(doc(db, 'users', user.uid), {
            fcmTokens: arrayUnion(token),
            notificationsEnabled: true
          });
          console.log('FCM Token registered:', token);
        }
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  useEffect(() => {
    if (!messaging || !user) return;

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        toast(payload.notification.body || 'New notification', {
          icon: '🔔',
          duration: 4000,
        });
      }
    });

    // Auto-request or refresh token if permission is already granted
    if (Notification.permission === 'granted') {
      requestPermission();
    }

    return () => unsubscribe();
  }, [user]);

  return { permission, requestPermission };
};
