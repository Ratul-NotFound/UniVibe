import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { calculateMatchScore } from '@/lib/matchAlgorithm';

export const useDiscovery = () => {
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!user || !userData) return;
    setLoading(true);
    try {
      // 1. Get IDs of users to exclude (blocked, already matched, etc.)
      const excludedIds = new Set([
        user.uid,
        ...(userData.blockedUsers || []),
        ...(userData.swipedIds || []), // We'll need to track swipes in Firestore
      ]);

      // 2. Query Firestore for DIU students
      // Note: In production, we'd use more complex filtering and pagination.
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('isVerified', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const fetchedProfiles: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!excludedIds.has(doc.id) && !data.isProfileLocked) {
          // 3. Calculate match score
          const matchResult = calculateMatchScore(userData, data);
          fetchedProfiles.push({
            id: doc.id,
            ...data,
            matchScore: matchResult.score,
            commonInterests: matchResult.commonInterests,
          });
        }
      });

      // Sort by best match score
      fetchedProfiles.sort((a, b) => b.matchScore - a.matchScore);
      setProfiles(fetchedProfiles);
    } catch (err: any) {
      console.error("Discovery error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user, userData]);

  return { profiles, loading, error, refresh: fetchProfiles, setProfiles };
};
