import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Check if we're running on the server side
const isServer = typeof window === "undefined";

// Global variables to store singleton instances
let adminApp: any = null;
let adminDb: any = null;
let adminAuth: any = null;
let initialized = false;

export function getAdminSdk() {
  if (isServer && !initialized) {
    console.log("Initializing Firebase Admin SDK (singleton)");

    if (
      !process.env.FIREBASE_ADMIN_PROJECT_ID ||
      !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
      !process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ) {
      throw new Error("Firebase Admin environment variables are missing");
    }

    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
            /\\n/g,
            "\n",
          ),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    initialized = true;
  }

  return { adminApp, adminDb, adminAuth };
}
