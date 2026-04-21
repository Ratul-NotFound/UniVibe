import { useState, useCallback } from 'react';
import { 
  collection, addDoc, serverTimestamp, 
  query, where, orderBy, limit, 
  onSnapshot, updateDoc, doc, 
  increment, arrayUnion, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from './useGamification';
import { toast } from 'react-hot-toast';

export type SignalCategory = 'broadcast' | 'chai' | 'study' | 'game' | 'alert' | 'lost' | 'ghost';

export interface BroadcastSignal {
  id: string;
  content: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL: string | null;
  category: SignalCategory;
  zone?: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  interactors: string[];
  interestCount: number;
  isPortal: boolean;
  isAnonymous: boolean;
  priority: number;
}

export const SIGNAL_THEMES: Record<SignalCategory, { label: string, icon: string, color: string, bg: string }> = {
  broadcast: { label: 'General', icon: '📡', color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
  chai: { label: 'Chai Hub', icon: '☕', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  study: { label: 'Study Sesh', icon: '📚', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  game: { label: 'Game On', icon: '🎮', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  alert: { label: 'Urgent Help', icon: '🆘', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  lost: { label: 'Lost & Found', icon: '🔍', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ghost: { label: 'Ghost Story', icon: '👻', color: 'text-zinc-500', bg: 'bg-zinc-900/80' }
};

export const CAMPUS_ZONES = [
  'Smart City (AB4)',
  'Main Campus (AB1)',
  'Library',
  'Canteen',
  'Ground',
  'Hostel Area',
  'Lab Zone'
];

export const useBroadcasts = () => {
  const { user, userData } = useAuth();
  const { spendCoins, updateMissionProgress } = useGamification();

  const postSignal = async (data: {
    content: string;
    category: SignalCategory;
    zone?: string;
    durationHours: number;
    isPortal: boolean;
    isAnonymous: boolean;
  }) => {
    if (!user) return null;

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + data.durationHours * 60 * 60 * 1000);

      const signalData = {
        content: data.content,
        category: data.category,
        zone: data.zone || 'Campus',
        fromUid: user.uid,
        fromName: data.isAnonymous ? 'Campus Ghost' : (userData?.name || 'DIU Student'),
        fromPhotoURL: data.isAnonymous ? null : (userData?.photoURL || null),
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        interactors: [],
        interestCount: 0,
        isPortal: data.isPortal,
        isAnonymous: data.isAnonymous,
        priority: 0
      };

      const docRef = await addDoc(collection(db, 'pulses'), signalData);
      
      if (data.category === 'broadcast' || data.category === 'chai' || data.category === 'study') {
        await updateMissionProgress('q3'); // Broadcast Architect
      }

      return docRef.id;
    } catch (error) {
      console.error('Error posting signal:', error);
      throw error;
    }
  };

  const joinSignal = async (signalId: string) => {
    if (!user) return;
    try {
      const signalRef = doc(db, 'pulses', signalId);
      await updateDoc(signalRef, {
        interactors: arrayUnion(user.uid),
        interestCount: increment(1)
      });
      toast.success('Joined Signal Portal!', { icon: '🤘' });
    } catch (error) {
      console.error('Error joining signal:', error);
      toast.error('Failed to join signal');
    }
  };

  const igniteSignal = async (signalId: string) => {
    if (!user) return false;
    const cost = 10;
    const success = await spendCoins(cost);
    
    if (success) {
      try {
        const signalRef = doc(db, 'pulses', signalId);
        await updateDoc(signalRef, {
          priority: 1
        });
        toast.success('Signal Ignited! 🔥', { duration: 4000 });
        return true;
      } catch (error) {
        console.error('Error igniting signal:', error);
        return false;
      }
    }
    return false;
  };

  return {
    postSignal,
    joinSignal,
    igniteSignal,
    SIGNAL_THEMES,
    CAMPUS_ZONES
  };
};
