'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User, 
  signInWithRedirect,
  AuthError, 
  getRedirectResult 
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { AuthContextType } from '@/lib/types';
import { createTokenDocument } from '@/services/tokenService';

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
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize auth state and handle redirect results
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check if we're returning from a redirect
        const result = await getRedirectResult(auth);
        
        if (result && mounted) {
          // Successfully returned from redirect
          setUser(result.user);
          setIsRedirecting(false);
          
          // Create token document for new user
          try {
            await createTokenDocument(result.user.uid);
          } catch (tokenError) {
            console.error('Error creating token document:', tokenError);
          }
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
        if (mounted) {
          setAuthError(error as AuthError);
          setIsRedirecting(false);
        }
      }
    };

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!mounted) return;
        
        if (currentUser) {
          // Ensure token document exists for authenticated users
          try {
            await createTokenDocument(currentUser.uid);
          } catch (tokenError) {
            console.error('Error creating token document:', tokenError);
          }
        }
        
        setUser(currentUser);
        setLoading(false);
        setIsRedirecting(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        if (mounted) {
          setAuthError(error as AuthError);
          setLoading(false);
          setIsRedirecting(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in with Google using redirect only
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    setIsRedirecting(true);
    
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Always use redirect for consistency
      await signInWithRedirect(auth, provider);
      return null;
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setAuthError(error as AuthError);
      setLoading(false);
      setIsRedirecting(false);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setAuthError(null);
      setIsRedirecting(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Determine loading state
  const isLoading = loading || isRedirecting;

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