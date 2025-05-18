import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Check if we're running on the server side
const isServer = typeof window === "undefined";

let adminApp: any = null;
let adminDb: any = null;
let adminAuth: any = null;
let FieldValueType: any = null;

// Move function declaration outside of conditional block to fix the strict mode error
function initAdmin() {
  if (getApps().length === 0) {
    try {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

      if (!privateKey) {
        console.error("FIREBASE_ADMIN_PRIVATE_KEY is missing!");
        throw new Error(
          "FIREBASE_ADMIN_PRIVATE_KEY environment variable is missing",
        );
      }

      // Log project ID to confirm we're connecting to the right project
      console.log(
        `Initializing Firebase Admin with project: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`,
      );

      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        // If you have a separate database URL, include it here
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      throw error;
    }
  }
  return getApps()[0];
}

if (isServer) {
  try {
    adminApp = initAdmin();
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    FieldValueType = FieldValue;

    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error during Firebase Admin initialization:", error);
    // In production, you might want to handle this differently
    // For now, we'll just log the error and continue with null values
  }
} else {
  console.warn(
    "Attempted to load Firebase Admin on the client side - this is not supported",
  );
}

export { adminApp, adminDb, adminAuth, FieldValueType as FieldValue };
