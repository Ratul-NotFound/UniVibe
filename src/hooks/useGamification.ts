import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, increment, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { DailyContent, DailyMood, generateDailyContent, getDayKey, isPuzzleAnswerCorrect } from '@/lib/gamification';

const DAILY_HINT_COST = 3;

export const useGamification = () => {
  const { user, userData } = useAuth();
  const [daily, setDaily] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);

  const dayKey = useMemo(() => getDayKey(), []);
  const userDocRef = useMemo(() => (user ? doc(db, 'users', user.uid) : null), [user]);
  const dailyDocRef = useMemo(() => (user ? doc(db, 'users', user.uid, 'daily', dayKey) : null), [dayKey, user]);

  useEffect(() => {
    if (!user || !dailyDocRef || !userDocRef) {
      setDaily(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ensureDailyDoc = async () => {
      const snap = await getDoc(dailyDocRef);
      if (!snap.exists()) {
        const generated = generateDailyContent({ uid: user.uid, dayKey });
        await setDoc(dailyDocRef, {
          ...generated,
          createdAt: serverTimestamp(),
        });
      }

      await updateDoc(userDocRef, {
        vibePoints: increment(0),
        uniCoins: increment(0),
      });
    };

    ensureDailyDoc().catch(() => {
      setLoading(false);
    });

    const unsubscribe = onSnapshot(dailyDocRef, (snap) => {
      setDaily(snap.exists() ? (snap.data() as DailyContent) : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, dayKey, dailyDocRef, userDocRef]);

  const completeMission = async (missionId: string) => {
    if (!user || !dailyDocRef || !userDocRef) return;

    await runTransaction(db, async (tx) => {
      const [dailySnap, userSnap] = await Promise.all([tx.get(dailyDocRef), tx.get(userDocRef)]);
      if (!dailySnap.exists() || !userSnap.exists()) return;

      const dailyData = dailySnap.data() as DailyContent;
      const missions = dailyData.missions || [];
      const mission = missions.find((m) => m.id === missionId);
      if (!mission || mission.done) return;

      const nextMissions = missions.map((m) => (m.id === missionId ? { ...m, done: true } : m));
      tx.update(dailyDocRef, { missions: nextMissions });
      tx.update(userDocRef, {
        vibePoints: increment(mission.rewardScore),
        uniCoins: increment(mission.rewardCoins),
      });
    });
  };

  const submitPuzzleAnswer = async (answer: string) => {
    if (!user || !daily || !dailyDocRef || !userDocRef) {
      return { ok: false, message: 'Puzzle is not ready yet.' };
    }

    const isCorrect = isPuzzleAnswerCorrect(answer, daily.puzzle.answer);
    if (!isCorrect) {
      return { ok: false, message: 'Not correct. Try again.' };
    }

    await runTransaction(db, async (tx) => {
      const [dailySnap, userSnap] = await Promise.all([tx.get(dailyDocRef), tx.get(userDocRef)]);
      if (!dailySnap.exists() || !userSnap.exists()) return;

      const dailyData = dailySnap.data() as DailyContent;
      if (dailyData.puzzleSolved) return;

      tx.update(dailyDocRef, { puzzleSolved: true });
      tx.update(userDocRef, {
        vibePoints: increment(dailyData.puzzle.rewardScore),
        uniCoins: increment(dailyData.puzzle.rewardCoins),
      });
    });

    return { ok: true, message: 'Puzzle solved. Rewards added.' };
  };

  const unlockPuzzleHint = async () => {
    if (!user || !dailyDocRef || !userDocRef) {
      return { ok: false, message: 'Hint unavailable.' };
    }

    let result: { ok: boolean; message: string } = { ok: false, message: 'Hint unavailable.' };

    await runTransaction(db, async (tx) => {
      const [dailySnap, userSnap] = await Promise.all([tx.get(dailyDocRef), tx.get(userDocRef)]);
      if (!dailySnap.exists() || !userSnap.exists()) {
        result = { ok: false, message: 'Hint unavailable.' };
        return;
      }

      const dailyData = dailySnap.data() as DailyContent;
      const currentCoins = Number((userSnap.data() as any)?.uniCoins ?? (userSnap.data() as any)?.credits ?? 0);

      if (dailyData.hintUnlocked) {
        result = { ok: true, message: 'Hint already unlocked.' };
        return;
      }

      if (currentCoins < DAILY_HINT_COST) {
        result = { ok: false, message: 'Not enough UniCoins for a hint.' };
        return;
      }

      tx.update(dailyDocRef, { hintUnlocked: true });
      tx.update(userDocRef, { uniCoins: increment(-DAILY_HINT_COST) });
      result = { ok: true, message: `Hint unlocked (-${DAILY_HINT_COST} UniCoins).` };
    });

    return result;
  };

  const voteBattle = async (side: 'left' | 'right') => {
    if (!user || !dailyDocRef || !userDocRef) return;

    await runTransaction(db, async (tx) => {
      const [dailySnap, userSnap] = await Promise.all([tx.get(dailyDocRef), tx.get(userDocRef)]);
      if (!dailySnap.exists() || !userSnap.exists()) return;

      const dailyData = dailySnap.data() as DailyContent;
      const alreadyVoted = !!dailyData.battle?.vote;
      if (alreadyVoted) return;

      tx.update(dailyDocRef, {
        battle: {
          ...dailyData.battle,
          vote: side,
          rewarded: true,
        },
      });

      tx.update(userDocRef, {
        vibePoints: increment(dailyData.battle.rewardScore || 10),
        uniCoins: increment(dailyData.battle.rewardCoins || 1),
      });
    });
  };

  return {
    loading,
    dayKey,
    daily,
    vibePoints: Number((userData as any)?.vibePoints ?? (userData as any)?.snapScore ?? 0),
    uniCoins: Number((userData as any)?.uniCoins ?? (userData as any)?.credits ?? 0),
    completeMission,
    submitPuzzleAnswer,
    unlockPuzzleHint,
    voteBattle,
  };
};
