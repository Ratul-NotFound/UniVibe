import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasKeys = !!import.meta.env.VITE_FIREBASE_API_KEY;

let app: any;
let auth: any;
let db: any;
let rtdb: any;
let storage: any;
let messaging: any = undefined;
let analytics: any = undefined;

if (hasKeys) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    storage = getStorage(app);
    
    // Initialize Messaging only if supported (browser environment)
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });

    console.log("Firebase stabilized.");
  } catch (error) {
    console.error("Firebase init fatal:", error);
  }
}

export { auth, db, rtdb, storage, messaging, analytics, hasKeys };
export default app;
