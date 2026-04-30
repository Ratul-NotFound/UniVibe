import { useState, useEffect, useCallback } from 'react';
import { 
  doc, onSnapshot, updateDoc, increment, 
  getDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null) => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

export const useGamification = () => {
  const { user } = useAuth();
  const [uniCoins, setUniCoins] = useState<number>(0);
  const [vibePoints, setVibePoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isEligibleDiuSession(user)) {
      setUniCoins(0);
      setVibePoints(0);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUniCoins(data.uniCoins || 0);
        setVibePoints(data.vibePoints || 0);
      }
      // If doc doesn't exist yet (race during first sign-in), do NOT create
      // a stub document — that would overwrite the real profile written by
      // Signup.tsx and erase fields like 'onboarded'. Just wait for the
      // next snapshot update which will have the full document.
      setLoading(false);
    }, (error) => {
      console.error("Gamification sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCoins = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        uniCoins: increment(amount)
      });
    } catch (error) {
      console.error("Error adding coins:", error);
    }
  }, [user]);

  const addVibePoints = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vibePoints: increment(amount),
        uniCoins: increment(Math.floor(amount / 10)) 
      });
    } catch (error) {
      console.error("Error adding vibe points:", error);
    }
  }, [user]);

  const spendCoins = useCallback(async (amount: number) => {
    if (!user) return false;
    if (uniCoins < amount) {
      toast.error('Not enough UniCoins!');
      return false;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        uniCoins: increment(-amount)
      });
      return true;
    } catch (error) {
      toast.error('Transaction failed');
      return false;
    }
  }, [user, uniCoins]);

  const acceptMission = useCallback(async (missionId: string) => {
    if (!user) return;
    try {
      const missionRef = doc(db, 'users', user.uid, 'missions', missionId);
      await updateDoc(missionRef, {
        status: 'Active',
        updatedAt: serverTimestamp()
      });
      toast.success('Mission Started!', { icon: '🎯' });
    } catch (error) {
      console.error("Error accepting mission:", error);
    }
  }, [user]);

  const updateMissionProgress = useCallback(async (missionId: string, amount: number = 1) => {
    if (!user) return;
    try {
      const missionRef = doc(db, 'users', user.uid, 'missions', missionId);
      const missionSnap = await getDoc(missionRef);
      
      if (!missionSnap.exists()) return;
      
      const data = missionSnap.data();
      if (data.status === 'Completed') return;
      
      // Flash quests don't need acceptance. Legendary quests must be 'Active'.
      const isFlash = data.isFlash || data.id.startsWith('f');
      if (!isFlash && data.status !== 'Active') return; 

      const newProgress = data.progress + amount;
      const isCompleted = newProgress >= data.total;

      await updateDoc(missionRef, {
        progress: newProgress,
        status: isCompleted ? 'Completed' : data.status
      });

      if (isCompleted) {
        await Promise.all([
          addCoins(data.reward || 0),
          addVibePoints(Math.floor((data.reward || 0) / 2))
        ]);
        toast.success(`Mission Complete: ${data.title}!`, { icon: '🏆' });
      }
    } catch (error) {
      console.error("Error updating mission progress:", error);
    }
  }, [user, addCoins, addVibePoints]);

  return {
    uniCoins,
    vibePoints,
    loading,
    spendCoins,
    addVibePoints,
    addCoins,
    acceptMission,
    updateMissionProgress
  };
};
