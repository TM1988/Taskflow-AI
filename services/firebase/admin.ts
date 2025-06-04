import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp: any = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        adminApp = apps[0];
      } else {
        console.log("Initializing Firebase Admin with project:", process.env.FIREBASE_ADMIN_PROJECT_ID);
        
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        });
        
        console.log("Firebase Admin SDK initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  
  return adminApp;
}

export function getFirebaseAuth() {
  const admin = getFirebaseAdmin();
  return getAuth(admin);
}
