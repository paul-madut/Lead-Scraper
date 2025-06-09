'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User, 
  signInWithRedirect, 
  signInWithPopup,
  AuthError, 
  getRedirectResult 
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { AuthContextType } from '@/lib/types';
import { createTokenDocument } from '@/services/tokenService';

// Detect browser environment
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Detect if running in Safari, where redirect auth often has issues
const isSafari = () => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  authError: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check for redirect result + set up auth state listener on component mount
  useEffect(() => {
    // First, check if we're returning from a redirect
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        console.log('Checking redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          // We have returned from a redirect, set the user
          console.log('Redirect result received:', result.user.email);
          setUser(result.user);
          setRedirectInProgress(false);
        } else {
          console.log('No redirect result found');
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
        setAuthError(error as AuthError);
        setRedirectInProgress(false);
      } finally {
        setInitialCheckDone(true);
        setLoading(false);
        if (user){
          console.log(user.uid + "User signed in");
          await createTokenDocument(user.uid);
        }
      }
    };

    // Immediately check for redirect result
    checkRedirectResult();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log('Auth state changed:', currentUser?.email || 'No user');
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error as AuthError);
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Sign in with Google - with adaptive approach based on device/browser
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
      
      // Enable one-tap sign-in for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Use popup for Safari or desktop, redirect for mobile
      // This helps avoid some common cross-domain issues
      if (isSafari() || !isMobile()) {
        console.log('Using popup sign-in method');
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
        return result.user;
      } else {
        console.log('Using redirect sign-in method');
        setRedirectInProgress(true);
        // This will redirect the page, so we'll lose this execution context
        await signInWithRedirect(auth, provider);

        // We won't reach here until after redirect returns
        return null;
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setAuthError(error as AuthError);
      setLoading(false);
      setRedirectInProgress(false);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // The actual loading state combines several factors
  const isLoading = loading || redirectInProgress || !initialCheckDone;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        signInWithGoogle,
        signOut,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);