import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';

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
  const getMatchDocId = (uidA: string, uidB: string) => [uidA, uidB].sort().join('_');
  const getChatId = (uidA: string, uidB: string) => `chat_${[uidA, uidB].sort().join('_')}`;

  const createMutualMatchIfNeeded = async (targetProfile: DiscoveryProfile) => {
    if (!user || !userData) return false;

    const reciprocalSwipeRef = doc(db, 'swipes', getSwipeDocId(targetProfile.id, user.uid));
    const reciprocalSwipeSnap = await getDoc(reciprocalSwipeRef);

    if (!reciprocalSwipeSnap.exists() || reciprocalSwipeSnap.data().direction !== 'like') {
      return false;
    }

    const matchDocId = getMatchDocId(user.uid, targetProfile.id);
    const chatId = getChatId(user.uid, targetProfile.id);
    const matchResult = calculateMatchScore(userData, targetProfile);

    await setDoc(
      doc(db, 'matches', matchDocId),
      {
        users: [user.uid, targetProfile.id],
        matchScore: matchResult.score,
        commonInterests: matchResult.commonInterests.slice(0, 8),
        chatId,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  };

  const registerSwipe = async (targetProfile: DiscoveryProfile, direction: 'like' | 'pass') => {
    if (!user) return { isMatch: false };

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
      return { isMatch: false };
    }

    const isMatch = await createMutualMatchIfNeeded(targetProfile);
    return { isMatch };
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

      // Also exclude users the current user has already swiped on.
      const swipesRef = collection(db, 'swipes');
      const swipesQ = query(swipesRef, where('fromUid', '==', user.uid), limit(300));
      const swipeSnapshot = await getDocs(swipesQ);
      swipeSnapshot.forEach((swipeDoc) => {
        const swipeData = swipeDoc.data();
        if (swipeData?.toUid) {
          excludedIds.add(swipeData.toUid);
        }
      });

      // 2. Query Firestore for DIU students
      // Note: In production, we'd use more complex filtering and pagination.
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('isVerified', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const fetchedProfiles: DiscoveryProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DiscoveryProfile;
        const blockedCurrentUser = (data.blockedUsers || []).includes(user.uid);

        if (!excludedIds.has(doc.id) && !data.isProfileLocked && !data.isBanned && !blockedCurrentUser) {
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
      setError(err.message);
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
