import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  UserCredential,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { auth } from "@/config/firebase";

// Email/Password Authentication
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const resetPassword = async (email: string): Promise<void> => {
  return await sendPasswordResetEmail(auth, email);
};

// Google Authentication
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};

// GitHub Authentication
export const signInWithGithub = async (): Promise<UserCredential> => {
  const provider = new GithubAuthProvider();
  // Add scopes to request GitHub permissions for repos
  provider.addScope("repo");
  provider.addScope("read:user");
  return await signInWithPopup(auth, provider);
};

// Sign out
export const signOut = async (): Promise<void> => {
  return await firebaseSignOut(auth);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const listenToAuthStateChanges = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};
