import { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';
import { createAppNotification } from '@/lib/notifications';
import { useSocial } from './useSocial';

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
  const { connect, pass } = useSocial();
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

  const hasBasicProfile = (profile: DiscoveryProfile) => {
    if (!profile) return false;
    const interestCount = Object.values(profile.interests || {}).flat().length;
    return Boolean(profile.name || profile.username) && Boolean(profile.department || profile.bio || interestCount > 0);
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

  const likeProfile = async (profile: DiscoveryProfile) => {
    if (!user) return;
    const result = await connect(profile);
    return {
      isMatch: result?.isMatch || false,
      requestSent: result?.requestSent || false
    };
  };

  const passProfile = async (profile: DiscoveryProfile) => {
    if (!user) return;
    await pass(profile.id);
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
      // 1. Get IDs of users to exclude (self/blocked/current relations)
      const excludedIds = new Set([
        user.uid,
        ...(userData.blockedUsers || []),
      ]);

      // Exclude matched users and currently pending request users to keep flow clean.
      const matchesRef = collection(db, 'matches');
      const incomingReqRef = collection(db, 'requests');
      const outgoingReqRef = collection(db, 'requests');

      const [matchesSnap, incomingReqSnap, outgoingReqSnap] = await Promise.all([
        withTimeout(getDocs(query(matchesRef, where('users', 'array-contains', user.uid), limit(200)))),
        withTimeout(getDocs(query(incomingReqRef, where('toUid', '==', user.uid), limit(200)))),
        withTimeout(getDocs(query(outgoingReqRef, where('fromUid', '==', user.uid), limit(200)))),
      ]);

      matchesSnap.forEach((m) => {
        const usersArr = (m.data()?.users || []) as string[];
        usersArr.forEach((id) => {
          if (id && id !== user.uid) excludedIds.add(id);
        });
      });

      incomingReqSnap.forEach((r) => {
        const data: any = r.data();
        if (data?.status === 'pending' && data?.fromUid) {
          excludedIds.add(data.fromUid);
        }
      });

      outgoingReqSnap.forEach((r) => {
        const data: any = r.data();
        if (data?.status === 'pending' && data?.toUid) {
          excludedIds.add(data.toUid);
        }
      });

      // 2. Query Firestore for DIU students
      // Note: In production, we'd use more complex filtering and pagination.
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(300));

      const querySnapshot = await withTimeout(getDocs(q));
      const strictProfiles: DiscoveryProfile[] = [];
      const relaxedProfiles: DiscoveryProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DiscoveryProfile;
        const blockedCurrentUser = (data.blockedUsers || []).includes(user.uid);

        if (excludedIds.has(doc.id) || data.isProfileLocked || data.isBanned || blockedCurrentUser) return;

        // 3. Calculate match score
        const matchResult = calculateMatchScore(userData, data);
        const profileRow = {
          ...data,
          id: doc.id,
          matchScore: matchResult.score,
          commonInterests: matchResult.commonInterests,
        };

        if (hasCompleteProfile(data)) {
          strictProfiles.push(profileRow);
          return;
        }

        if (hasBasicProfile(data)) {
          relaxedProfiles.push(profileRow);
        }
      });

      // Prefer complete profiles. If none are available, show a relaxed fallback feed.
      const finalProfiles = strictProfiles.length > 0 ? strictProfiles : relaxedProfiles;

      finalProfiles.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      setProfiles(finalProfiles);
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
    likeProfile,
    passProfile,
  };
};
