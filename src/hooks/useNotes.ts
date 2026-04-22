import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useMatches } from './useMatches';

export type UserNote = {
  uid: string;
  text: string;
  expiresAt: number;
  createdAt?: any;
};

export const useNotes = () => {
  const { user } = useAuth();
  const { matches } = useMatches();
  const [notes, setNotes] = useState<Record<string, UserNote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes({});
      setLoading(false);
      return;
    }

    const connectedUids = Array.from(new Set(
      matches.map((m) => m.otherUserId).filter(Boolean) as string[]
    ));
    
    // We listen to ourselves and our friends individually to bypass stricter collection rules
    const watchUids = [user.uid, ...connectedUids];
    const unsubs: (() => void)[] = [];

    watchUids.forEach((uid) => {
      const unsub = onSnapshot(doc(db, 'notes', uid), (snap) => {
        setNotes((prev) => {
          const next = { ...prev };
          
          if (!snap.exists()) {
            delete next[uid];
            return next;
          }

          const data = snap.data();
          const expiresAt = data.expiresAt instanceof Timestamp 
            ? data.expiresAt.toMillis() 
            : typeof data.expiresAt?.toMillis === 'function' 
              ? data.expiresAt.toMillis() 
              : 0;

          // Only include if not expired
          if (expiresAt > Date.now()) {
            next[uid] = {
              uid: uid,
              text: data.text || '',
              expiresAt,
              createdAt: data.createdAt
            };
          } else {
            delete next[uid];
          }
          
          return next;
        });
      }, (error) => {
        // Log individual errors (some might be truly unauthorized if they aren't friends yet)
        console.warn(`Note listener for ${uid} error:`, error.message);
      });

      unsubs.push(unsub);
    });

    setLoading(false);

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user, matches]);

  const postNote = async (text: string) => {
    if (!user) return;
    const cleanText = text.trim();
    if (!cleanText) return;

    await setDoc(doc(db, 'notes', user.uid), {
      ownerUid: user.uid,
      text: cleanText,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
    }, { merge: true });
  };

  const deleteNote = async () => {
    if (!user) return;
    await deleteDoc(doc(db, 'notes', user.uid));
  };

  return {
    notes,
    loading,
    postNote,
    deleteNote,
    myNote: notes[user?.uid || '']
  };
};
