"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  resetPassword,
} from "./firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<void>;
  signInWithGithubProvider: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  // Enhanced auth initialization
  useEffect(() => {
    console.log("AuthProvider initializing...");

    // Attempt to get the current user immediately
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log("Current user found immediately");
      setUser(currentUser);
      setLoading(false);
      setAuthInitialized(true);
      return;
    }

    const unsubscribe = onAuthStateChanged((authUser) => {
      console.log("Auth state changed:", { hasUser: !!authUser });
      setUser(authUser);
      setLoading(false);
      setAuthInitialized(true);
    });

    // Add a timeout to prevent permanent loading state
    const timeoutId = setTimeout(() => {
      if (!authInitialized) {
        console.warn("Auth initialization timeout - forcing completion");
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 10000); // 10 second timeout

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [authInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      router.push("/");
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await signUpWithEmail(email, password, name);
      router.push("/");
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signInWithGoogleProvider = async () => {
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithGithubProvider = async () => {
    try {
      await signInWithGithub();
      router.push("/");
    } catch (error) {
      console.error("Error signing in with GitHub:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    await resetPassword(email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogleProvider,
    signInWithGithubProvider,
    logout,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
