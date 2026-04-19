import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export const useSafety = () => {
  const { user } = useAuth();

  const blockUser = async (targetUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        blockedUsers: arrayUnion(targetUid)
      });
      toast.success('User blocked successfully');
    } catch (error) {
      console.error("Block error:", error);
      toast.error('Failed to block user');
    }
  };

  const reportUser = async (targetUid: string, reason: string, description: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reportedUserId: targetUid,
        reportedBy: user.uid,
        reason,
        description,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Report submitted correctly');
    } catch (error) {
      console.error("Report error:", error);
      toast.error('Failed to submit report');
    }
  };

  return { blockUser, reportUser };
};
