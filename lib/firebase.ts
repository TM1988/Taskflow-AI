import { initializeApp } from "firebase/app";
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Handle network connectivity gracefully
if (typeof window !== 'undefined') {
  // Suppress Firebase offline warnings by overriding console.warn temporarily
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('Could not reach Cloud Firestore backend') || 
        message.includes('client is offline') ||
        message.includes('Backend didn\'t respond within')) {
      // Skip Firebase offline warnings
      return;
    }
    originalWarn.apply(console, args);
  };

  // Listen for online/offline events
  window.addEventListener('online', () => {
    enableNetwork(db).catch(() => {
      // Silently fail if already enabled
    });
  });
  
  window.addEventListener('offline', () => {
    disableNetwork(db).catch(() => {
      // Silently fail if already disabled
    });
  });
}

export default app;
