import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth, db, hasKeys } from '@/lib/firebase';
import { doc, FirestoreError, onSnapshot } from 'firebase/firestore';

interface UserData {
  isOnboarded?: boolean;
  isVerified?: boolean;
  uid?: string;
  name?: string;
  email?: string;
  username?: string;
  usernameLower?: string;
  phone?: string;
  phoneNormalized?: string;
  birthDate?: string;
  gender?: string;
  hometown?: string;
  currentCity?: string;
  engagementType?: string;
  engagementDetails?: string;
  role?: 'admin' | 'moderator' | 'user' | string;
  department?: string;
  year?: string;
  lookingFor?: string;
  bio?: string;
  photoURL?: string;
  blockedUsers?: string[];
  isGhostMode?: boolean;
  isProfileLocked?: boolean;
  isBanned?: boolean;
  dailyRequestCount?: number;
  vibePoints?: number;
  snapScore?: number;
  uniCoins?: number;
  credits?: number;
  privacy?: {
    phone?: 'private' | 'friends' | 'public' | string;
    birthdate?: 'private' | 'public' | string;
  };
  interests?: Record<string, string[]>;
}

const hasCompletedOnboarding = (data: UserData | null): boolean => {
  if (typeof window !== 'undefined' && auth.currentUser) {
    const sessionOnboarded = sessionStorage.getItem(`onboarding-complete:${auth.currentUser.uid}`) === '1';
    if (sessionOnboarded) {
      return true;
    }
  }

  if (!data) return false;
  if (data.isOnboarded === true) return true;

  // Backward compatibility for older accounts that completed onboarding
  // before isOnboarded was stored.
  const interestCount = Object.values(data.interests || {}).flat().length;
  return Boolean(data.department && data.year && data.lookingFor && interestCount >= 5);
};

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isVerified: boolean;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(hasKeys);

  useEffect(() => {
    if (!hasKeys) {
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
          const data = userDoc.exists() ? userDoc.data() : null;

          if (typeof window !== 'undefined' && data?.isOnboarded === true) {
            sessionStorage.setItem(`onboarding-complete:${uid}`, '1');
          }

          setUserData(data);
          setLoading(false);
        },
        async (error: FirestoreError) => {
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
        if (typeof window !== 'undefined') {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i += 1) {
            const key = sessionStorage.key(i);
            if (key?.startsWith('onboarding-complete:')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        }
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
    isOnboarded: hasCompletedOnboarding(userData),
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
