import { useState, useCallback } from 'react';
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, limit, 
  onSnapshot, updateDoc, doc, 
  increment, arrayUnion 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from './useGamification';
import { toast } from 'react-hot-toast';

export interface PollBattle {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  left: {
    name: string;
    icon: string;
    votes: number;
    color: string;
  };
  right: {
    name: string;
    icon: string;
    votes: number;
    color: string;
  };
  voters: string[];
  createdAt: any;
  category: string;
}

export const usePolls = () => {
  const { user, userData } = useAuth();
  const { spendCoins, updateMissionProgress } = useGamification();

  const createPoll = async (data: {
    title: string;
    leftName: string;
    leftIcon: string;
    rightName: string;
    rightIcon: string;
    category: string;
  }) => {
    if (!user) return null;

    // Optional: Deduct coins for creating a battle to prevent spam
    const cost = 25; // Lowered for testing
    const success = await spendCoins(cost);
    
    if (!success) {
      toast.error('Insufficient UniCoins to start a debate!');
      return null;
    }

    try {
      const pollData = {
        title: data.title,
        creatorId: user.uid,
        creatorName: userData?.name || 'DIU Student',
        left: {
          name: data.leftName,
          icon: data.leftIcon,
          votes: 0,
          color: 'from-amber-500/20 to-orange-600/20' // Default thermal
        },
        right: {
          name: data.rightName,
          icon: data.rightIcon,
          votes: 0,
          color: 'from-blue-500/20 to-cyan-600/20' // Default cool
        },
        voters: [],
        createdAt: serverTimestamp(),
        category: data.category
      };

      const docRef = await addDoc(collection(db, 'battles'), pollData);
      await updateMissionProgress('q2'); // Opinion Leader
      toast.success('Poll Arena is Live! 🏟️');
      return docRef.id;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  };

  const voteInPoll = async (pollId: string, side: 'left' | 'right') => {
    if (!user) return;
    try {
      const pollRef = doc(db, 'battles', pollId);
      await updateDoc(pollRef, {
        [`${side}.votes`]: increment(1),
        voters: arrayUnion(user.uid)
      });
      await updateMissionProgress('q2');
      toast.success('Vote Registered!', { icon: '⚡' });
    } catch (error) {
      console.error('Error voting in poll:', error);
      toast.error('Failed to register vote');
    }
  };

  const seedDefaultPolls = async () => {
    if (!user) return;
    const defaults = [
      { title: 'The Ultimate Wakeup', leftName: 'Chai', leftIcon: '☕', rightName: 'Coffee', rightIcon: '🥤', category: 'Lifestyle' },
      { title: 'Weekend Vibe', leftName: 'Mountains', leftIcon: '🏔️', rightName: 'Sea Side', rightIcon: '🌊', category: 'Nature' },
      { title: 'Exam Prep', leftName: 'Night Owl', leftIcon: '🦉', rightName: 'Early Bird', rightIcon: '🌅', category: 'Study' },
      { title: 'Hangout Spot', leftName: 'AB4 Canteen', leftIcon: '🍔', rightName: 'Open Air', rightIcon: '🌳', category: 'Campus' }
    ];

    for (const poll of defaults) {
      await addDoc(collection(db, 'battles'), {
        ...poll,
        creatorId: 'system',
        creatorName: 'UniVibe',
        left: { ...poll, name: poll.leftName, icon: poll.leftIcon, votes: 0, color: 'from-amber-500/20 to-orange-600/20' },
        right: { ...poll, name: poll.rightName, icon: poll.rightIcon, votes: 0, color: 'from-blue-500/20 to-cyan-600/20' },
        voters: [],
        createdAt: serverTimestamp()
      });
    }
    toast.success('Seeded initial polls!');
  };

  return {
    createPoll,
    voteInPoll,
    seedDefaultPolls
  };
};
