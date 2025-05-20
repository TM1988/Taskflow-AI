import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useRouter } from 'next/navigation';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  apiKey?: string;
  theme?: 'light' | 'dark' | 'system';
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('User authenticated:', firebaseUser.uid);
          
          // Get additional user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : undefined;
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || (userData && 'displayName' in userData ? userData.displayName : 'Tanish'),
              photoURL: firebaseUser.photoURL,
              apiKey: userData && 'apiKey' in userData ? userData.apiKey : undefined,
              theme: userData && 'theme' in userData ? userData.theme : 'system',
              hasCompletedOnboarding: userData && 'hasCompletedOnboarding' in userData ? userData.hasCompletedOnboarding : false
            });
            
            // If user document doesn't exist, create it
            if (!userDoc.exists()) {
              console.log('Creating new user document for:', firebaseUser.uid);
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Tanish',
                createdAt: new Date().toISOString(),
                hasCompletedOnboarding: false,
                theme: 'system'
              });
            }
          } catch (firestoreError) {
            console.error('Error fetching user data from Firestore:', firestoreError);
            // Still set the user with basic Firebase auth data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Tanish',
              photoURL: firebaseUser.photoURL,
              theme: 'system',
              hasCompletedOnboarding: false
            });
          }
        } else {
          console.log('No authenticated user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to create user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: 'Tanish', // Default name
          createdAt: new Date().toISOString(),
          hasCompletedOnboarding: false,
          theme: 'system',
          comments: []
        });
        console.log('User document created in Firestore');
      } catch (firestoreError) {
        console.error('Error creating user document:', firestoreError);
        // Continue even if Firestore fails
      }
      
      // Redirect to onboarding
      router.push('/onboarding');
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error in signUp:', error.code, error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has completed onboarding
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            displayName: 'Tanish',
            createdAt: new Date().toISOString(),
            hasCompletedOnboarding: false,
            theme: 'system'
          });
          router.push('/onboarding');
        } else {
          const userData = userDoc.data();
          if (!userData.hasCompletedOnboarding) {
            router.push('/onboarding');
          } else {
            router.push('/board');
          }
        }
      } catch (firestoreError) {
        console.error('Error checking user onboarding status:', firestoreError);
        // Default to board if we can't check onboarding status
        router.push('/board');
      }
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error in signIn:', error.code, error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting to sign in with Google');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          // Create user document in Firestore for new Google sign-ins
          const displayName = userCredential.user.displayName || 'Tanish';
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            displayName: displayName,
            photoURL: userCredential.user.photoURL,
            createdAt: new Date().toISOString(),
            hasCompletedOnboarding: false,
            theme: 'system'
          });
          
          console.log('New Google user, created document and redirecting to onboarding');
          router.push('/onboarding');
        } else {
          const userData = userDoc.data();
          if (!userData.hasCompletedOnboarding) {
            router.push('/onboarding');
          } else {
            router.push('/board');
          }
        }
      } catch (firestoreError) {
        console.error('Error checking/creating Google user document:', firestoreError);
        // Default to onboarding if we can't check user status
        router.push('/onboarding');
      }
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error.code, error.message);
      throw error;
    }
  };

  const logOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user) throw new Error('No authenticated user');
    
    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // If apiKey is undefined or empty string, remove it from the update
    if (data.apiKey === undefined || data.apiKey === '') {
      delete updateData.apiKey;
    }
    
    try {
      // Update Firestore document
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
      // Update local state
      setUser({
        ...user,
        ...data
      });
      
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
