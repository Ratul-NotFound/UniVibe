import { useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { createAppNotification } from '@/lib/notifications';
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
      const isDiuEmail = /@diu\.edu\.bd$/i.test(tokenResult.claims.email || user.email || '');
      if (!tokenResult.claims.email_verified || !isDiuEmail) {
        toast.error('Verified DIU student account required.');
        return { success: false, verificationRequired: true };
      }

      const ownRequestRef = doc(db, 'requests', getRequestDocId(user.uid, targetProfile.id));
      const reciprocalRequestRef = doc(db, 'requests', getRequestDocId(targetProfile.id, user.uid));

      // 1. Check for reciprocal request (Auto-Match Logic)
      const reciprocalSnap = await getDoc(reciprocalRequestRef);
      if (reciprocalSnap.exists() && reciprocalSnap.data()?.status === 'pending') {
        // AUTO-MATCH!
        return await acceptRequest({ fromUid: targetProfile.id, toUid: user.uid });
      }

      // 2. Check if already requested or matched
      const ownSnap = await getDoc(ownRequestRef);
      if (ownSnap.exists()) {
        const status = ownSnap.data()?.status;
        if (status === 'pending') {
          toast('Request already pending.', { icon: '⏳' });
          return { success: true, pending: true };
        }
        if (status === 'accepted') {
          toast('Already matched!', { icon: '✅' });
          return { success: true, isMatch: true };
        }
      }

      // 3. Create New Request
      await setDoc(ownRequestRef, {
        fromUid: user.uid,
        toUid: targetProfile.id,
        status: 'pending',
        fromName: userData.name || 'Someone',
        fromPhotoURL: userData.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Notify Target
      await createAppNotification({
        toUid: targetProfile.id,
        fromUid: user.uid,
        type: 'request',
        title: 'New connection request',
        body: `${userData.name || 'A student'} wants to connect.`,
        link: '/matches',
        metadata: { fromUid: user.uid },
      });

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
    actionLoading
  };
};
