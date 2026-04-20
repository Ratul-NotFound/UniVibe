import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { createAppNotification } from '@/lib/notifications';

const getMatchDocId = (uidA: string, uidB: string) => [uidA, uidB].sort().join('_');
const getChatId = (uidA: string, uidB: string) => `chat_${[uidA, uidB].sort().join('_')}`;

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

const buildOtherUser = async (uid: string) => {
  const otherUserSnap = await getDoc(doc(db, 'users', uid));
  if (!otherUserSnap.exists()) return null;
  return { id: otherUserSnap.id, ...otherUserSnap.data() };
};

export const useMatches = () => {
  const { user, userData } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isEligibleDiuSession(user)) {
      setMatches([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
      return;
    }

    let pendingCount = 3;
    const markLoaded = () => {
      pendingCount -= 1;
      if (pendingCount <= 0) setLoading(false);
    };

    const matchesRef = collection(db, 'matches');
    const matchesQ = query(matchesRef, where('users', 'array-contains', user.uid));

    const unsubscribeMatches = onSnapshot(
      matchesQ,
      async (querySnapshot) => {
        const matchData: any[] = [];

        for (const matchDoc of querySnapshot.docs) {
          const data = matchDoc.data();
          const otherUserId = data.users.find((id: string) => id !== user.uid);

          const otherUser = otherUserId ? await buildOtherUser(otherUserId) : null;

          matchData.push({
            id: matchDoc.id,
            otherUserId,
            otherUser,
            ...data,
          });
        }

        setMatches(matchData);
        markLoaded();
      },
      (error) => {
        console.error('Matches listener error:', error);
        setMatches([]);
        markLoaded();
      }
    );

    const requestsRef = collection(db, 'requests');
    const incomingQ = query(requestsRef, where('toUid', '==', user.uid));
    const outgoingQ = query(requestsRef, where('fromUid', '==', user.uid));

    const unsubscribeIncoming = onSnapshot(
      incomingQ,
      async (snapshot) => {
        const rows = await Promise.all(
          snapshot.docs
            .filter((d) => d.data().status === 'pending')
            .map(async (d) => {
              const data: any = d.data();
              const otherUser = await buildOtherUser(data.fromUid);
              return {
                id: d.id,
                ...data,
                otherUser,
              };
            })
        );
        setIncomingRequests(rows);
        markLoaded();
      },
      (error) => {
        console.error('Incoming requests listener error:', error);
        setIncomingRequests([]);
        markLoaded();
      }
    );

    const unsubscribeOutgoing = onSnapshot(
      outgoingQ,
      async (snapshot) => {
        const rows = await Promise.all(
          snapshot.docs
            .filter((d) => d.data().status === 'pending')
            .map(async (d) => {
              const data: any = d.data();
              const otherUser = await buildOtherUser(data.toUid);
              return {
                id: d.id,
                ...data,
                otherUser,
              };
            })
        );
        setOutgoingRequests(rows);
        markLoaded();
      },
      (error) => {
        console.error('Outgoing requests listener error:', error);
        setOutgoingRequests([]);
        markLoaded();
      }
    );

    return () => {
      unsubscribeMatches();
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  }, [user]);

  const acceptRequest = async (requestItem: any, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user)) return;

    const fromUid = requestItem.fromUid;
    const toUid = requestItem.toUid;
    if (!fromUid || !toUid || toUid !== user.uid) return;

    try {
      const requesterUserDoc = await getDoc(doc(db, 'users', fromUid));
      const requesterUser = requesterUserDoc.exists() ? requesterUserDoc.data() : {};
      const matchResult = calculateMatchScore(userData || {}, requesterUser || {});

      const matchDocId = getMatchDocId(fromUid, toUid);
      const chatId = getChatId(fromUid, toUid);

      await setDoc(
        doc(db, 'matches', matchDocId),
        {
          users: [fromUid, toUid],
          matchScore: matchResult.score,
          commonInterests: matchResult.commonInterests?.slice(0, 8) || [],
          chatId,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await Promise.all([
        set(ref(rtdb, `chats/${chatId}`), {
          members: {
            [fromUid]: true,
            [toUid]: true,
          },
          createdAt: Date.now(),
        }),
        updateDoc(doc(db, 'requests', requestItem.id), {
          status: 'accepted',
          updatedAt: serverTimestamp(),
        }),
      ]);

      await createAppNotification({
        toUid: fromUid,
        fromUid: toUid,
        type: 'requestAccepted',
        title: 'Request accepted',
        body: `${userData?.name || 'A student'} accepted your request. You can message now.`,
        link: '/chat',
        metadata: { chatId },
      });
    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          await acceptRequest(requestItem, true);
          return;
        } catch (refreshErr) {
          console.error('Accept request token refresh failed:', refreshErr);
        }
      }

      console.error('Accept request failed:', err);
      throw err;
    }
  };

  const declineRequest = async (requestItem: any, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user) || requestItem.toUid !== user.uid) return;
    try {
      await updateDoc(doc(db, 'requests', requestItem.id), {
        status: 'declined',
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          await declineRequest(requestItem, true);
          return;
        } catch (refreshErr) {
          console.error('Decline request token refresh failed:', refreshErr);
        }
      }

      console.error('Decline request failed:', err);
      throw err;
    }
  };

  const cancelRequest = async (requestItem: any, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user) || requestItem.fromUid !== user.uid) return;
    try {
      await updateDoc(doc(db, 'requests', requestItem.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          await cancelRequest(requestItem, true);
          return;
        } catch (refreshErr) {
          console.error('Cancel request token refresh failed:', refreshErr);
        }
      }

      console.error('Cancel request failed:', err);
      throw err;
    }
  };

  return {
    matches,
    incomingRequests,
    outgoingRequests,
    loading,
    acceptRequest,
    declineRequest,
    cancelRequest,
  };
};
