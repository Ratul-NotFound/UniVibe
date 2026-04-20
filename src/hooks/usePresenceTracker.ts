import { useEffect } from 'react';
import { onDisconnect, ref, serverTimestamp, set } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const usePresenceTracker = () => {
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user || !rtdb) return;

    const presenceRef = ref(rtdb, `presence/${user.uid}`);
    const isGhostMode = userData?.isGhostMode === true;

    const publishPresence = async () => {
      await set(presenceRef, {
        online: !isGhostMode,
        isGhostMode,
        lastChanged: serverTimestamp(),
      });

      await onDisconnect(presenceRef).set({
        online: false,
        isGhostMode,
        lastChanged: serverTimestamp(),
      });
    };

    publishPresence().catch((error) => {
      console.error('Presence publish failed:', error);
    });

    return () => {
      set(presenceRef, {
        online: false,
        isGhostMode,
        lastChanged: serverTimestamp(),
      }).catch(() => {
        // Ignore cleanup failures during hard refresh / process shutdown.
      });
    };
  }, [user, userData?.isGhostMode]);
};
