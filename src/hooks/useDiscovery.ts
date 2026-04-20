import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { createAppNotification } from '@/lib/notifications';

type DiscoveryProfile = {
  id: string;
  name?: string;
  department?: string;
  interests?: Record<string, string[]>;
  blockedUsers?: string[];
  isProfileLocked?: boolean;
  isBanned?: boolean;
  matchScore: number;
  commonInterests?: string[];
  [key: string]: any;
};

export const useDiscovery = () => {
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSwipeDocId = (fromUid: string, toUid: string) => `${fromUid}_${toUid}`;
  const getRequestDocId = (fromUid: string, toUid: string) => `${fromUid}_${toUid}`;

  const hasCompleteProfile = (profile: DiscoveryProfile) => {
    if (!profile) return false;
    if (profile.isOnboarded === true) return true;

    const interestCount = Object.values(profile.interests || {}).flat().length;
    return Boolean(profile.department && profile.year && profile.lookingFor && interestCount >= 5);
  };

  const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('DISCOVERY_TIMEOUT'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const registerSwipe = async (targetProfile: DiscoveryProfile, direction: 'like' | 'pass') => {
    if (!user) return { isMatch: false, requestSent: false };

    await setDoc(
      doc(db, 'swipes', getSwipeDocId(user.uid, targetProfile.id)),
      {
        fromUid: user.uid,
        toUid: targetProfile.id,
        direction,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (direction !== 'like') {
      return { isMatch: false, requestSent: false };
    }

    const outgoingRequestRef = doc(db, 'requests', getRequestDocId(user.uid, targetProfile.id));
    const incomingRequestRef = doc(db, 'requests', getRequestDocId(targetProfile.id, user.uid));

    const [outgoingSnap, incomingSnap] = await Promise.all([
      getDoc(outgoingRequestRef),
      getDoc(incomingRequestRef),
    ]);

    if (outgoingSnap.exists() && outgoingSnap.data()?.status === 'pending') {
      return { isMatch: false, requestSent: false, alreadyRequested: true };
    }

    if (incomingSnap.exists() && incomingSnap.data()?.status === 'pending') {
      return { isMatch: false, requestSent: false, incomingPending: true };
    }

    await setDoc(
      outgoingRequestRef,
      {
        fromUid: user.uid,
        toUid: targetProfile.id,
        status: 'pending',
        fromName: userData?.name || user.displayName || 'Someone',
        fromPhotoURL: userData?.photoURL || user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await createAppNotification({
      toUid: targetProfile.id,
      fromUid: user.uid,
      type: 'request',
      title: 'New connection request',
      body: `${userData?.name || 'A student'} sent you a request.`,
      link: '/matches',
      metadata: {
        fromUid: user.uid,
      },
    });

    return { isMatch: false, requestSent: true };
  };

  const fetchProfiles = async (hasRetried = false) => {
    if (!user || !userData) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Get IDs of users to exclude (blocked, already matched, etc.)
      const excludedIds = new Set([
        user.uid,
        ...(userData.blockedUsers || []),
      ]);

      // Exclude only users already liked/requested. Passed users can reappear later.
      const swipesRef = collection(db, 'swipes');
      const swipesQ = query(swipesRef, where('fromUid', '==', user.uid), limit(300));
      const swipeSnapshot = await withTimeout(getDocs(swipesQ));
      swipeSnapshot.forEach((swipeDoc) => {
        const swipeData = swipeDoc.data();
        if (swipeData?.toUid && swipeData?.direction === 'like') {
          excludedIds.add(swipeData.toUid);
        }
      });

      // 2. Query Firestore for DIU students
      // Note: In production, we'd use more complex filtering and pagination.
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(300));

      const querySnapshot = await withTimeout(getDocs(q));
      const fetchedProfiles: DiscoveryProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DiscoveryProfile;
        const blockedCurrentUser = (data.blockedUsers || []).includes(user.uid);

        if (!excludedIds.has(doc.id) && hasCompleteProfile(data) && !data.isProfileLocked && !data.isBanned && !blockedCurrentUser) {
          // 3. Calculate match score
          const matchResult = calculateMatchScore(userData, data);
          fetchedProfiles.push({
            ...data,
            id: doc.id,
            matchScore: matchResult.score,
            commonInterests: matchResult.commonInterests,
          });
        }
      });

      // Sort by best match score
      fetchedProfiles.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      setProfiles(fetchedProfiles);
    } catch (err: any) {
      if (!hasRetried && err?.code === 'permission-denied') {
        try {
          await user.reload();
          await user.getIdToken(true);
          await fetchProfiles(true);
          return;
        } catch (refreshErr) {
          console.error('Discovery token refresh failed:', refreshErr);
        }
      }

      console.error("Discovery error:", err);
      if (err?.message === 'DISCOVERY_TIMEOUT') {
        setError('Loading is taking too long. Please check your connection and tap Try Again.');
      } else {
        setError(err.message || 'Failed to load profiles. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user, userData]);

  return {
    profiles,
    loading,
    error,
    refresh: fetchProfiles,
    setProfiles,
    likeProfile: (profile: DiscoveryProfile) => registerSwipe(profile, 'like'),
    passProfile: (profile: DiscoveryProfile) => registerSwipe(profile, 'pass'),
  };
};
