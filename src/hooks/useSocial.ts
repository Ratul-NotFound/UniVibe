import { useState } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { createAppNotification } from '@/lib/notifications';
import { postCircleActivity } from './useCircleActivity';
import { toast } from 'react-hot-toast';

const getMatchDocId = (uidA: string, uidB: string) => [uidA, uidB].sort().join('_');
const getChatId = (uidA: string, uidB: string) => `chat_${[uidA, uidB].sort().join('_')}`;
const getRequestDocId = (fromUid: string, toUid: string) => `${fromUid}_${toUid}`;

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

export const useSocial = () => {
  const { user, userData } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const acceptRequest = async (requestData: any, hasRetried = false) => {
    if (!user || !isEligibleDiuSession(user)) return;

    const fromUid = requestData.fromUid;
    const toUid = requestData.toUid;
    if (!fromUid || !toUid) return;

    try {
      setActionLoading(true);
      const requesterUserDoc = await getDoc(doc(db, 'users', fromUid));
      const requesterUser = requesterUserDoc.exists() ? requesterUserDoc.data() : {};
      const matchResult = calculateMatchScore(userData || {}, requesterUser || {});

      const matchDocId = getMatchDocId(fromUid, toUid);
      const chatId = getChatId(fromUid, toUid);

      // 1. Update Request Status
      await updateDoc(doc(db, 'requests', getRequestDocId(fromUid, toUid)), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      // 2. Create Match and Chat
      // Note: Firestore rules only allow a user to update their own document.
      // The 'matches' collection is the authoritative source of truth for friendship.
      // We update only the current user's (toUid) own friends list here.
      await Promise.all([
        setDoc(
          doc(db, 'matches', matchDocId),
          {
            users: [fromUid, toUid],
            matchScore: matchResult.score,
            commonInterests: matchResult.commonInterests?.slice(0, 8) || [],
            chatId,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        ),
        set(ref(rtdb, `chats/${chatId}`), {
          members: {
            [fromUid]: true,
            [toUid]: true,
          },
          createdAt: Date.now(),
        }),
        // Only update current user's own doc (toUid == user.uid)
        updateDoc(doc(db, 'users', toUid), {
          friends: arrayUnion(fromUid)
        }),
      ]);

      // 3. Notify Sender
      await createAppNotification({
        toUid: fromUid,
        fromUid: toUid,
        type: 'requestAccepted',
        title: 'New Match! ⚡',
        body: `${userData?.name || 'A student'} accepted your request. Start chatting!`,
        link: '/chat',
        metadata: { chatId },
      });

      // 4. Activity Fan-out
      await postCircleActivity(user, userData, {
        type: 'joined',
        content: `connected with ${requesterUser.name || 'a student'}`,
      });

      toast.success("It's a Match!", { icon: '💖' });
      return { success: true, isMatch: true };
    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          return await acceptRequest(requestData, true);
        } catch (refreshErr) {
          console.error('Accept request token refresh failed:', refreshErr);
        }
      }
      console.error('Accept request failed:', err);
      toast.error('Failed to accept request');
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const connect = async (targetProfile: any, hasRetried = false): Promise<any> => {
    if (!user || !userData || !targetProfile) return { success: false };

    try {
      setActionLoading(true);

      // Verify Session
      const tokenResult = await user.getIdTokenResult();
      const isDiuEmail = /@diu\.edu\.bd$/i.test((tokenResult.claims.email as string) || user.email || '');
      if (!tokenResult.claims.email_verified || !isDiuEmail) {
        toast.error('Verified DIU student account required.');
        return { success: false, verificationRequired: true };
      }

      const ownRequestRef = doc(db, 'requests', getRequestDocId(user.uid, targetProfile.id));
      const reciprocalRequestRef = doc(db, 'requests', getRequestDocId(targetProfile.id, user.uid));

      // 1. Check for reciprocal request (Auto-Match Logic)
      const reciprocalSnap = await getDocs(query(
        collection(db, 'requests'),
        where('fromUid', '==', targetProfile.id),
        where('toUid', '==', user.uid),
        limit(1)
      ));
      
      if (!reciprocalSnap.empty && reciprocalSnap.docs[0].data()?.status === 'pending') {
        // AUTO-MATCH!
        return await acceptRequest({ fromUid: targetProfile.id, toUid: user.uid });
      }

      // 2. Check if already requested or matched
      const ownSnap = await getDocs(query(
        collection(db, 'requests'),
        where('fromUid', '==', user.uid),
        where('toUid', '==', targetProfile.id),
        limit(1)
      ));

      if (!ownSnap.empty) {
        const status = ownSnap.docs[0].data()?.status;
        if (status === 'pending') {
          toast('Request already pending.', { icon: '⏳' });
          return { success: true, pending: true };
        }
        if (status === 'accepted') {
          toast('Already matched!', { icon: '✅' });
          return { success: true, isMatch: true };
        }
      }

      // 3. Create or Reset Request
      const requestData = {
        fromUid: user.uid,
        toUid: targetProfile.id,
        status: 'pending' as const,
        fromName: userData.name || 'Someone',
        fromPhotoURL: userData.photoURL || null,
        updatedAt: serverTimestamp(),
      };

      if (!ownSnap.empty) {
        try {
          console.log('[Onboarding] Updating existing request:', ownSnap.docs[0].id);
          await updateDoc(doc(db, 'requests', ownSnap.docs[0].id), requestData);
        } catch (updateErr) {
          console.error('[Onboarding] Update request failed:', updateErr);
          throw updateErr;
        }
      } else {
        try {
          console.log('[Onboarding] Creating new request:', ownRequestRef.id);
          await setDoc(ownRequestRef, {
            ...requestData,
            createdAt: serverTimestamp(),
          });
        } catch (createErr) {
          console.error('[Onboarding] Create request failed:', createErr);
          throw createErr;
        }
      }

      // 4. Notify Target
      try {
        console.log('[Onboarding] Sending notification to:', targetProfile.id);
        await createAppNotification({
          toUid: targetProfile.id,
          fromUid: user.uid,
          type: 'request',
          title: 'New connection request',
          body: `${userData.name || 'A student'} wants to connect.`,
          link: '/matches',
          metadata: { fromUid: user.uid },
        });
      } catch (notiErr) {
        console.warn('[Onboarding] Notification failed (non-fatal):', notiErr);
      }

      toast.success(`Request sent to ${targetProfile.name || 'student'}!`, { icon: '📩' });
      return { success: true, requestSent: true };

    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          return await connect(targetProfile, true);
        } catch (rErr) { console.error(rErr); }
      }
      console.error('Connect failed:', err);
      toast.error('Action failed. Try again.');
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const unfriend = async (targetUid: string) => {
    if (!user) return { success: false };
    try {
      setActionLoading(true);
      const matchDocId = getMatchDocId(user.uid, targetUid);
      
      // Delete the match and BOTH directions of requests to fully reset state
      // Also remove from current user's own friends list
      await Promise.allSettled([
        deleteDoc(doc(db, 'matches', matchDocId)),
        deleteDoc(doc(db, 'requests', getRequestDocId(user.uid, targetUid))),
        deleteDoc(doc(db, 'requests', getRequestDocId(targetUid, user.uid))),
        updateDoc(doc(db, 'users', user.uid), {
          friends: arrayRemove(targetUid)
        }),
      ]);

      toast.success('Connection removed');
      return { success: true };
    } catch (err) {
      console.error('Unfriend failed:', err);
      toast.error('Failed to remove connection');
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const pass = async (targetUid: string) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'swipes', `${user.uid}_${targetUid}`),
        {
          fromUid: user.uid,
          toUid: targetUid,
          direction: 'pass',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Pass failed:', err);
    }
  };

  return {
    connect,
    pass,
    acceptRequest,
    unfriend,
    actionLoading
  };
};
