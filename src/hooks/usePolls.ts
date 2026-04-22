import { useState, useCallback } from 'react';
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, limit, where,
  onSnapshot, updateDoc, doc, 
  increment, arrayUnion, Timestamp
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
  expiresAt: any;
  category: string;
  status: 'active' | 'ended';
}

export const usePolls = () => {
  const { user, userData } = useAuth();
  const { updateMissionProgress } = useGamification();

  const createPoll = async (data: {
    title: string;
    leftName: string;
    leftIcon: string;
    rightName: string;
    rightIcon: string;
    category: string;
  }) => {
    if (!user) return null;

    try {
      // Polls expire after 24 hours
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

      const pollData = {
        title: data.title,
        creatorId: user.uid,
        creatorName: userData?.name || 'DIU Student',
        left: {
          name: data.leftName,
          icon: data.leftIcon,
          votes: 0,
          color: 'from-primary/20 to-rose-600/20'
        },
        right: {
          name: data.rightName,
          icon: data.rightIcon,
          votes: 0,
          color: 'from-blue-500/20 to-cyan-600/20'
        },
        voters: [],
        createdAt: serverTimestamp(),
        expiresAt,
        category: data.category,
        status: 'active'
      };

      const docRef = await addDoc(collection(db, 'battles'), pollData);
      await updateMissionProgress('q2');
      toast.success('Poll Arena is Live! 🏟️');
      return docRef.id;
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
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
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const defaults = [
      { title: 'The Ultimate Wakeup', leftName: 'Chai', leftIcon: '☕', rightName: 'Coffee', rightIcon: '🥤', category: 'Lifestyle' },
      { title: 'Weekend Vibe', leftName: 'Mountains', leftIcon: '🏔️', rightName: 'Sea Side', rightIcon: '🌊', category: 'Nature' },
      { title: 'Exam Prep', leftName: 'Night Owl', leftIcon: '🦉', rightName: 'Early Bird', rightIcon: '🌅', category: 'Study' },
      { title: 'Hangout Spot', leftName: 'AB4 Canteen', leftIcon: '🍔', rightName: 'Open Air', rightIcon: '🌳', category: 'Campus' }
    ];

    for (const poll of defaults) {
      await addDoc(collection(db, 'battles'), {
        title: poll.title,
        creatorId: 'system',
        creatorName: 'UniVibe',
        left: { name: poll.leftName, icon: poll.leftIcon, votes: 0, color: 'from-primary/20 to-rose-600/20' },
        right: { name: poll.rightName, icon: poll.rightIcon, votes: 0, color: 'from-blue-500/20 to-cyan-600/20' },
        voters: [],
        createdAt: serverTimestamp(),
        expiresAt,
        category: poll.category,
        status: 'active'
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
