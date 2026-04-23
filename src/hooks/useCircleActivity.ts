/**
 * useCircleActivity
 * 
 * Fan-out circle feed: when a user does something noteworthy (sets vibe, posts a signal,
 * creates a poll), we write an activity card to each of their friends' feeds.
 * Each item lives for 24 hours (expiresAt).
 * 
 * Reading: query circle_feed/{currentUser.uid}/items where expiresAt > now
 */

import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, Timestamp, where, getDocs, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export type ActivityType = 'vibe' | 'signal' | 'poll' | 'joined' | 'ignited';

export interface CircleActivityItem {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL: string | null;
  type: ActivityType;
  content: string;      // human-readable description
  meta?: {             // extra data e.g. vibe name, post snippet
    vibe?: string;
    category?: string;
    pollTitle?: string;
    signalId?: string;
  };
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Called by the app when something happens. Fans out to all matched friends. */
export const postCircleActivity = async (
  currentUser: { uid: string },
  userData: { name?: string; photoURL?: string | null } | null,
  payload: {
    type: ActivityType;
    content: string;
    meta?: CircleActivityItem['meta'];
  }
) => {
  if (!db || !currentUser) return;

  try {
    // 1. Find all friends (matches)
    const matchesSnap = await getDocs(
      query(
        collection(db, 'matches'),
        where('users', 'array-contains', currentUser.uid),
        limit(50)
      )
    );

    if (matchesSnap.empty) return;

    const expiresAt = Timestamp.fromDate(new Date(Date.now() + TTL_MS));

    const item = {
      fromUid: currentUser.uid,
      fromName: userData?.name || 'A friend',
      fromPhotoURL: userData?.photoURL || null,
      type: payload.type,
      content: payload.content,
      meta: payload.meta || {},
      createdAt: serverTimestamp(),
      expiresAt,
    };

    // 2. Fan-out to friends + own feed
    const targetUids = new Set([currentUser.uid]);
    matchesSnap.docs.forEach(matchDoc => {
      const data = matchDoc.data();
      const friendUid = data.users.find((uid: string) => uid !== currentUser.uid);
      if (friendUid) targetUids.add(friendUid);
    });

    const writes = Array.from(targetUids).map(targetId => {
      return addDoc(collection(db, 'circle_feed', targetId, 'items'), item);
    });

    await Promise.allSettled(writes);
  } catch (err) {
    // Non-fatal — circle feed is best-effort
    console.warn('Circle activity post failed (non-fatal):', err);
  }
};

/** Hook to read the circle feed for the current user */
export const useCircleActivity = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CircleActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const feedRef = collection(db, 'circle_feed', user.uid, 'items');
    const q = query(
      feedRef,
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as CircleActivityItem)));
        setLoading(false);
      },
      err => {
        // Fallback: no index yet, read all and filter client-side
        console.warn('Circle feed query error, using fallback:', err.message);
        const fallbackQ = query(feedRef, orderBy('createdAt', 'desc'), limit(50));
        onSnapshot(fallbackQ, snap => {
          const now = Date.now();
          setItems(
            snap.docs
              .map(d => ({ id: d.id, ...d.data() } as CircleActivityItem))
              .filter(i => i.expiresAt?.toMillis() > now)
          );
          setLoading(false);
        }, () => setLoading(false));
      }
    );

    return () => unsub();
  }, [user]);

  return { items, loading };
};
