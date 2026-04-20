import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export type PresenceState = {
  isOnline: boolean;
  isGhostMode: boolean;
  lastChanged: number | null;
};

const defaultPresence: PresenceState = {
  isOnline: false,
  isGhostMode: false,
  lastChanged: null,
};

export const usePresenceStatus = (uid?: string) => {
  const [presence, setPresence] = useState<PresenceState>(defaultPresence);

  useEffect(() => {
    if (!uid || !rtdb) {
      setPresence(defaultPresence);
      return;
    }

    const presenceRef = ref(rtdb, `presence/${uid}`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (!snapshot.exists()) {
        setPresence(defaultPresence);
        return;
      }

      const value = snapshot.val() as {
        online?: boolean;
        isGhostMode?: boolean;
        lastChanged?: number;
      };

      const isGhostMode = value.isGhostMode === true;
      const isOnline = value.online === true && !isGhostMode;

      setPresence({
        isOnline,
        isGhostMode,
        lastChanged: typeof value.lastChanged === 'number' ? value.lastChanged : null,
      });
    });

    return () => unsubscribe();
  }, [uid]);

  return presence;
};
