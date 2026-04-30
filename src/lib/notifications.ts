import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AppNotificationType =
  | 'request'
  | 'requestAccepted'
  | 'message'
  | 'profileUpdate'
  | 'system';

export const createAppNotification = async ({
  toUid,
  fromUid,
  type,
  title,
  body,
  link,
  metadata,
}: {
  toUid: string;
  fromUid?: string;
  type: AppNotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (!db || !toUid) return;

  try {
    // 1. Save to Firestore (for the in-app notification center)
    await addDoc(collection(db, 'notifications'), {
      toUid,
      fromUid: fromUid || null,
      type,
      title,
      body,
      link: link || null,
      metadata: metadata || null,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    // 2. Trigger Mobile Push via Vercel API
    // We don't 'await' this so that the UI isn't blocked if the push is slow
    fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toUid,
        title,
        body,
        link: link || '/'
      })
    }).catch(err => console.error('Push trigger failed:', err));

  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
