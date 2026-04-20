import { useState, useEffect, useCallback } from 'react';
import { 
  doc, onSnapshot, updateDoc, increment, 
  setDoc, getDoc, serverTimestamp 
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
      } else {
        // Initialize user economy if it doesn't exist
        setDoc(userRef, {
          uniCoins: 100, // Starter coins
          vibePoints: 0,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      setLoading(false);
    }, (error) => {
      console.error("Gamification sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
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

  const addVibePoints = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vibePoints: increment(amount),
        // Logic: Every 500 vibe points grants bonus coins
        uniCoins: increment(Math.floor(amount / 10)) 
      });
    } catch (error) {
      console.error("Error adding vibe points:", error);
    }
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

  return {
    uniCoins,
    vibePoints,
    loading,
    spendCoins,
    addVibePoints,
    addCoins
  };
};
