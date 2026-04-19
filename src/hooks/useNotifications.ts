import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermission = async () => {
      try {
        const status = await Notification.requestPermission();
        setPermission(status);
        
        if (status === 'granted') {
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY_HERE' // This would come from Firebase Console
          });

          if (token) {
            // Save token to user document
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token
            });
          }
        }
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    };

    if (Notification.permission === 'default') {
      requestPermission();
    } else {
      setPermission(Notification.permission);
    }

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      toast(payload.notification?.body || 'New notification', {
        icon: '🔔',
        duration: 4000
      });
    });

    return () => unsubscribe();
  }, [user]);

  return { permission };
};
