import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth, db, hasKeys } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isVerified: boolean;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasKeys) {
      setLoading(false);
      return;
    }

    let unsubscribeUserDoc: (() => void) | null = null;

    const subscribeToUserDoc = (uid: string, hasRetried = false) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      unsubscribeUserDoc = onSnapshot(
        doc(db, 'users', uid),
        (userDoc) => {
          setUserData(userDoc.exists() ? userDoc.data() : null);
          setLoading(false);
        },
        async (error: any) => {
          // Token claims can be stale right after verify/login; force one refresh and retry.
          if (!hasRetried && error?.code === 'permission-denied' && auth.currentUser) {
            try {
              await auth.currentUser.getIdToken(true);
              subscribeToUserDoc(uid, true);
              return;
            } catch (refreshError) {
              console.error("Token refresh failed:", refreshError);
            }
          }

          console.error("Error listening to user data:", error);
          setLoading(false);
        }
      );
    };

    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        setLoading(true);
        subscribeToUserDoc(user.uid);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
      unsubscribe();
    };
  }, []);


  const value = {
    user,
    userData,
    loading,
    isVerified: user?.emailVerified || false,
    isOnboarded: !!userData?.isOnboarded,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
