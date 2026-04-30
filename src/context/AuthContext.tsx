import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth, db, hasKeys } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserData {
  role: 'client' | 'admin' | 'Operator';
  email: string;
  name: string;
  photoURL?: string;
  onboarded: boolean;
  onboardingStep?: string;
  claimedWelcomeBonus?: boolean;
  // Profile fields
  username?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  department?: string;
  year?: string;
  lookingFor?: string;
  bio?: string;
  hometown?: string;
  currentCity?: string;
  engagementType?: string;
  engagementDetails?: string;
  interests?: string[];
  // Privacy / visibility
  isGhostMode?: boolean;
  isProfileLocked?: boolean;
  privacy?: {
    showEmail?: boolean;
    showPhone?: boolean;
    [key: string]: any;
  };
  // Social
  blockedUsers?: string[];
  // Gamification
  coins?: number;
  vibe?: string;
  vibeHistory?: any[];
  // Presence / misc
  fcmToken?: string;
  lastSeen?: any;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any; // allow arbitrary extra fields
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isVerified: boolean;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isEligibleDiuSession = (user: { email?: string | null; emailVerified?: boolean } | null): boolean => {
  if (!user?.email) return false;
  return /@diu\.edu\.bd$/i.test(user.email) && user.emailVerified === true;
};

const hasCompletedOnboarding = (data: UserData | null): boolean => {
  // 1. Check sessionStorage — set immediately by OnboardingWizard on success.
  //    This resolves the ProtectedRoute race condition where the Firestore
  //    onSnapshot hasn't fired yet but the write already succeeded.
  if (typeof window !== 'undefined' && auth?.currentUser?.uid) {
    const sessionOnboarded = sessionStorage.getItem(`onboarding-complete:${auth.currentUser.uid}`) === '1';
    if (sessionOnboarded) return true;
  }
  if (!data) return false;
  // 2. Trust only the canonical onboarded flag written by OnboardingWizard.
  //    Removed the onboardingStep heuristic (false-positive risk) and the
  //    isOnboarded alias (never written by any code path).
  return data.onboarded === true;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(!!hasKeys);

  // Track the UID of the user whose Firestore listener is currently active.
  // onIdTokenChanged fires on EVERY token refresh (e.g. getIdToken(true)),
  // not just on login/logout. Without this guard, each token refresh would
  // tear down and rebuild the listener with loading=true, causing a full-screen
  // spinner flash (the flicker the user sees after completing onboarding).
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasKeys || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribeUserDoc: (() => void) | null = null;

    const subscribeToUserDoc = (uid: string, hasRetried = false) => {
      if (!db) {
        setLoading(false);
        return;
      }
      // Tear down any existing listener before creating a new one.
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      try {
        unsubscribeUserDoc = onSnapshot(
          doc(db, 'users', uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error: any) => {
            if (!hasRetried && error.code === 'permission-denied' && auth.currentUser) {
              auth.currentUser.getIdToken(true)
                .then(() => subscribeToUserDoc(uid, true))
                .catch(() => setLoading(false));
            } else {
              setLoading(false);
            }
          }
        );
      } catch (err) {
        console.error('Firestore snapshot failed:', err);
        setLoading(false);
      }
    };

    const unsubscribe = onIdTokenChanged(auth, (authUser) => {
      const newUid = authUser?.uid ?? null;

      // If this is just a token refresh for the SAME user (e.g. getIdToken(true)
      // called during onboarding), do NOT reset loading or recreate the listener.
      // Doing so caused the full-screen spinner to flash after onboarding finished.
      if (newUid !== null && newUid === activeUidRef.current) {
        // Still update the user object so emailVerified etc. stay fresh.
        setUser(authUser);
        return;
      }

      // UID changed — real login, logout, or account switch.
      activeUidRef.current = newUid;
      setUser(authUser);

      // Tear down the old listener whenever the user changes.
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (authUser && db) {
        setLoading(true);
        subscribeToUserDoc(authUser.uid);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userData,
    loading,
    isVerified: user?.emailVerified || false,
    isOnboarded: hasCompletedOnboarding(userData),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
