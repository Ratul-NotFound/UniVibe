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

export type SignalCategory = 
  | 'event' | 'concert' | 'seminar' | 'lost' | 'help' | 'invite' | 'story' | 'fair' | 'explore'
  | 'partner' | 'club' | 'career' | 'food' | 'sports' | 'ride' | 'confess' | 'tech' | 'exam'
  | 'book' | 'volunteer' | 'workshop' | 'debate' | 'hackathon' | 'contest' | 'travel' | 'gaming' 
  | 'fitness' | 'movie' | 'art' | 'other';

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
  event:     { label: 'Events',      icon: '🎫', color: 'text-primary',     bg: 'bg-primary/10' },
  concert:   { label: 'Concerts',    icon: '🎸', color: 'text-rose-500',   bg: 'bg-rose-500/10' },
  seminar:   { label: 'Seminars',    icon: '🎓', color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  lost:      { label: 'Lost & Found', icon: '🔍', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  help:      { label: 'Help Alert',   icon: '🆘', color: 'text-red-500',    bg: 'bg-red-500/10' },
  invite:    { label: 'Invitation',   icon: '🤝', color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  story:     { label: 'Stories',      icon: '📖', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  fair:      { label: 'Shop/Fair',    icon: '🛍️', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  explore:   { label: 'Hidden Gem',   icon: '📍', color: 'text-zinc-400',   bg: 'bg-zinc-400/10' },
  partner:   { label: 'Team Up',     icon: '👥', color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
  club:      { label: 'Club Hub',    icon: '🏆', color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  career:    { label: 'Career Prep', icon: '💼', color: 'text-zinc-300',   bg: 'bg-zinc-300/10' },
  food:      { label: 'Treat/Food',   icon: '🍔', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  sports:    { label: 'Sports/Game',  icon: '⚽', color: 'text-lime-400',   bg: 'bg-lime-400/10' },
  ride:      { label: 'Ride Share',   icon: '🚌', color: 'text-sky-400',    bg: 'bg-sky-400/10' },
  confess:   { label: 'Confession',  icon: '🤫', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  tech:      { label: 'Dev/Tech',     icon: '💻', color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  exam:      { label: 'Exam Sesh',    icon: '📝', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  book:      { label: 'Books',       icon: '📚', color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  volunteer: { label: 'Volunteer',   icon: '🌟', color: 'text-pink-400',   bg: 'bg-pink-400/10' },
  workshop:  { label: 'Workshops',   icon: '🛠️', color: 'text-zinc-400',   bg: 'bg-zinc-400/10' },
  debate:    { label: 'Debates',     icon: '🗣️', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  hackathon: { label: 'Hackathon',   icon: '⚡', color: 'text-primary',     bg: 'bg-primary/10' },
  contest:   { label: 'Contests',    icon: '🏅', color: 'text-amber-300',  bg: 'bg-amber-300/10' },
  travel:    { label: 'Tours',       icon: '✈️', color: 'text-sky-500',    bg: 'bg-sky-500/10' },
  gaming:    { label: 'Gaming',      icon: '🎮', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  fitness:   { label: 'Gym/Fit',     icon: '💪', color: 'text-rose-400',   bg: 'bg-rose-400/10' },
  movie:     { label: 'Movie Night', icon: '🎬', color: 'text-zinc-200',   bg: 'bg-zinc-200/10' },
  art:       { label: 'Creative',    icon: '🎨', color: 'text-fuchsia-400',bg: 'bg-fuchsia-400/10' },
  other:     { label: 'Miscellaneous',icon: '✨', color: 'text-zinc-500',   bg: 'bg-zinc-500/10' }
};

export const CAMPUS_ZONES = [
  'AB4 (Smart City)', 'AB1', 'AB2', 'AB3',
  'YKSG-1', 'YKSG-2', 'YKSG-3', 'RASG-1',
  'Auditorium', 'Student Lounge', 'Library', 'Food Court',
  'Bonomaya 1', 'Bonomaya 2', 'Lake Side',
  'Changawon Univ.', 'Engineering Campus',
  '8 No Gate', '2 No Gate', 'Dottopara', 'Modeltown', 'Rodela FoodCourt'
];

import { postCircleActivity } from './useCircleActivity';

export const useBroadcasts = () => {
  const { user, userData } = useAuth();
  const { spendCoins, updateMissionProgress, addVibePoints } = useGamification();

  const postSignal = async (data: {
    content: string;
    category: SignalCategory;
    zone?: string;
    durationHours: number;
    isPortal: boolean;
    isAnonymous: boolean;
    visibility: 'global' | 'circle';
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
        visibility: data.visibility || 'global',
        priority: 0
      };

      // Only add to 'pulses' (Global Feed) if visibility is global
      let docId = '';
      if (data.visibility === 'global') {
        const docRef = await addDoc(collection(db, 'pulses'), signalData);
        docId = docRef.id;
      }
      
      // Fan-out to circle activity (history) if not anonymous
      if (!data.isAnonymous) {
        await postCircleActivity(user, userData, {
          type: 'signal',
          content: data.content.slice(0, 100) + (data.content.length > 100 ? '...' : ''),
          meta: { 
            category: data.category, 
            signalId: docId || undefined,
            visibility: data.visibility
          },
        });
      }

      // Mission & Rewards
      await addVibePoints(15);
      if (data.visibility === 'global') {
        await updateMissionProgress('f3'); 
      }
      await updateMissionProgress('q3'); 

      return docId;
    } catch (error) {
      console.error('Error posting signal:', error);
      throw error;
    }
  };

  const joinSignal = async (signalId: string, signalOwnerId?: string) => {
    if (!user) return;
    try {
      const signalRef = doc(db, 'pulses', signalId);
      await updateDoc(signalRef, {
        interactors: arrayUnion(user.uid),
        interestCount: increment(1)
      });

      // Notify Owner
      if (signalOwnerId && signalOwnerId !== user.uid) {
        await createAppNotification({
          toUid: signalOwnerId,
          fromUid: user.uid,
          type: 'system',
          title: 'Signal Sync 📡',
          body: `${userData?.name || 'A student'} joined your portal. Check it out!`,
          link: '/',
          metadata: { signalId }
        });
      }

      toast.success('Joined Signal Portal!', { icon: '🤘' });
    } catch (error) {
      console.error('Error joining signal:', error);
      toast.error('Failed to join signal');
    }
  };

  const igniteSignal = async (signalId: string, signalOwnerId?: string) => {
    if (!user) return false;
    const cost = 10;
    const success = await spendCoins(cost);
    
    if (success) {
      try {
        const signalRef = doc(db, 'pulses', signalId);
        await updateDoc(signalRef, {
          priority: 1
        });

        // Notify Owner
        if (signalOwnerId && signalOwnerId !== user.uid) {
          await createAppNotification({
            toUid: signalOwnerId,
            fromUid: user.uid,
            type: 'system',
            title: 'Signal Ignited! 🔥',
            body: `${userData?.name || 'A student'} ignited your signal. Your frequency is peaking!`,
            link: '/',
            metadata: { signalId }
          });
        }

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
