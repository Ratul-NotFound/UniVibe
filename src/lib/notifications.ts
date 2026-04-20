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
};
