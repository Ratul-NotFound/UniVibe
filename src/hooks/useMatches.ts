import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const useMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen for matches where the current user is part of the 'users' array
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const matchData: any[] = [];
      
      for (const matchDoc of querySnapshot.docs) {
        const data = matchDoc.data();
        const otherUserId = data.users.find((id: string) => id !== user.uid);
        
        // Fetch other user's profile
        // In a real app, we might want to cache these or include basic info in the match doc
        matchData.push({
          id: matchDoc.id,
          otherUserId,
          ...data,
        });
      }
      
      setMatches(matchData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { matches, loading };
};
