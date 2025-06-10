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

// Enhanced mobile detection
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile user agents
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
    'iemobile', 'opera mini', 'mobile', 'tablet'
  ];
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Consider it mobile if any of these conditions are true
  return isMobileUA || (isTouchDevice && isSmallScreen);
};

// Check if we're in a mobile browser that has popup issues
const hasPoorPopupSupport = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // iOS Safari and Chrome mobile often have popup issues
  const problematicBrowsers = [
    'crios',           // Chrome on iOS
    'fxios',           // Firefox on iOS
    'mobile safari',   // Mobile Safari
    'webview',         // WebView
    'wv',              // WebView indicator
  ];
  
  return problematicBrowsers.some(browser => userAgent.includes(browser)) || 
         (userAgent.includes('safari') && userAgent.includes('mobile'));
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
  const [authAttempted, setAuthAttempted] = useState(false);

  // Check for redirect result + set up auth state listener on component mount
  useEffect(() => {
    let mounted = true;
    
    // First, check if we're returning from a redirect
    const checkRedirectResult = async () => {
      try {
        console.log('Checking redirect result...');
        
        // Add a small delay to ensure Firebase is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we have a pending redirect operation
        const result = await getRedirectResult(auth);
        
        if (result && mounted) {
          // We have returned from a redirect, set the user
          console.log('Redirect result received:', result.user.email);
          setUser(result.user);
          setRedirectInProgress(false);
          
          // Clear any redirect flags
          sessionStorage.removeItem('authRedirectInProgress');
          sessionStorage.removeItem('authRedirectTimestamp');
          
          // Create token document for new user
          try {
            await createTokenDocument(result.user.uid);
            console.log('Token document created for user:', result.user.uid);
          } catch (tokenError) {
            console.error('Error creating token document:', tokenError);
          }
        } else {
          console.log('No redirect result found');
          
          // Check if we're expecting a redirect but didn't get one
          const redirectFlag = sessionStorage.getItem('authRedirectInProgress');
          const redirectTimestamp = sessionStorage.getItem('authRedirectTimestamp');
          
          if (redirectFlag && redirectTimestamp) {
            const timeSinceRedirect = Date.now() - parseInt(redirectTimestamp);
            console.log('Time since redirect started:', timeSinceRedirect + 'ms');
            
            // If it's been more than 30 seconds, clear the flags
            if (timeSinceRedirect > 30000) {
              console.log('Redirect timeout, clearing flags');
              sessionStorage.removeItem('authRedirectInProgress');
              sessionStorage.removeItem('authRedirectTimestamp');
              setRedirectInProgress(false);
              setAuthError(new Error('Authentication timeout. Please try again.') as AuthError);
            }
          }
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
        if (mounted) {
          setAuthError(error as AuthError);
          setRedirectInProgress(false);
          sessionStorage.removeItem('authRedirectInProgress');
          sessionStorage.removeItem('authRedirectTimestamp');
        }
      } finally {
        if (mounted) {
          setInitialCheckDone(true);
        }
      }
    };

    // Set up auth state listener FIRST
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', currentUser?.email || 'No user');
        
        // If we get a user and we were expecting a redirect, this is success
        const redirectFlag = sessionStorage.getItem('authRedirectInProgress');
        if (currentUser && redirectFlag) {
          console.log('User authenticated via redirect (from auth state change)');
          setRedirectInProgress(false);
          sessionStorage.removeItem('authRedirectInProgress');
          sessionStorage.removeItem('authRedirectTimestamp');
          
          // Create token document
          try {
            await createTokenDocument(currentUser.uid);
            console.log('Token document created for user:', currentUser.uid);
          } catch (tokenError) {
            console.error('Error creating token document:', tokenError);
          }
        }
        
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        if (mounted) {
          setAuthError(error as AuthError);
          setLoading(false);
        }
      }
    );

    // Then check for redirect result
    checkRedirectResult();

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in with Google - with better mobile detection
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    setAuthAttempted(true);
    
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure provider for better mobile experience
      provider.setCustomParameters({
        prompt: 'select_account',
        // This helps with mobile experience
        login_hint: '',
      });

      // Determine which method to use based on device capabilities
      const shouldUseRedirect = isMobileDevice() || hasPoorPopupSupport();
      
      console.log('Device detection:', {
        isMobile: isMobileDevice(),
        hasPoorPopup: hasPoorPopupSupport(),
        willUseRedirect: shouldUseRedirect,
        userAgent: navigator.userAgent
      });

      if (shouldUseRedirect) {
        console.log('Using redirect sign-in method for mobile/problematic browser');
        setRedirectInProgress(true);
        
        // Store a flag to help with loading states after redirect
        sessionStorage.setItem('authRedirectInProgress', 'true');
        
        // Add a timestamp to help with debugging
        sessionStorage.setItem('authRedirectTimestamp', Date.now().toString());
        
        // This will redirect the page, so we won't reach code after this
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        console.log('Using popup sign-in method for desktop');
        try {
          const result = await signInWithPopup(auth, provider);
          setUser(result.user);
          
          // Create token document
          await createTokenDocument(result.user.uid);
          
          setLoading(false);
          return result.user;
        } catch (popupError: any) {
          // If popup fails, fallback to redirect
          console.warn('Popup failed, falling back to redirect:', popupError.message);
          
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            
            console.log('Popup blocked or closed, using redirect fallback');
            setRedirectInProgress(true);
            sessionStorage.setItem('authRedirectInProgress', 'true');
            sessionStorage.setItem('authRedirectTimestamp', Date.now().toString());
            await signInWithRedirect(auth, provider);
            return null;
          }
          
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setAuthError(error as AuthError);
      setLoading(false);
      setRedirectInProgress(false);
      
      // Clear any redirect flags
      sessionStorage.removeItem('authRedirectInProgress');
      sessionStorage.removeItem('authRedirectTimestamp');
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setAuthAttempted(false);
      
      // Clear any stored redirect flags
      sessionStorage.removeItem('authRedirectInProgress');
      sessionStorage.removeItem('authRedirectTimestamp');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if we're in the middle of a redirect flow on mount
  useEffect(() => {
    const redirectFlag = sessionStorage.getItem('authRedirectInProgress');
    const redirectTimestamp = sessionStorage.getItem('authRedirectTimestamp');
    
    if (redirectFlag === 'true') {
      console.log('Detected redirect in progress from sessionStorage');
      setRedirectInProgress(true);
      setAuthAttempted(true);
      
      // Check if redirect is too old (more than 5 minutes)
      if (redirectTimestamp) {
        const timeSinceRedirect = Date.now() - parseInt(redirectTimestamp);
        if (timeSinceRedirect > 300000) { // 5 minutes
          console.log('Redirect too old, clearing flags');
          sessionStorage.removeItem('authRedirectInProgress');
          sessionStorage.removeItem('authRedirectTimestamp');
          setRedirectInProgress(false);
        }
      }
    }
    
    // Also check URL for any redirect indicators
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthParams = urlParams.get('state') || urlParams.get('code') || 
                           window.location.hash.includes('access_token') ||
                           urlParams.get('authuser') !== null; // Google auth parameter
      
      if (hasAuthParams) {
        console.log('Detected auth parameters in URL:', {
          search: window.location.search,
          hash: window.location.hash,
          state: urlParams.get('state'),
          code: urlParams.get('code'),
          authuser: urlParams.get('authuser')
        });
        setRedirectInProgress(true);
        setAuthAttempted(true);
        
        // Set a flag to indicate we found auth params
        sessionStorage.setItem('authParamsDetected', 'true');
      }
    }
  }, []);

  // Enhanced effect to handle successful authentication
  useEffect(() => {
    if (user && authAttempted) {
      console.log('User successfully authenticated, clearing redirect state');
      setRedirectInProgress(false);
      sessionStorage.removeItem('authRedirectInProgress');
      sessionStorage.removeItem('authRedirectTimestamp');
      sessionStorage.removeItem('authParamsDetected');
      setLoading(false);
    }
  }, [user, authAttempted]);

  // Additional effect to handle cases where auth state change happens without getRedirectResult
  useEffect(() => {
    const checkAuthStateWithTimeout = () => {
      const authParamsDetected = sessionStorage.getItem('authParamsDetected');
      const redirectFlag = sessionStorage.getItem('authRedirectInProgress');
      
      if ((authParamsDetected || redirectFlag) && !user && initialCheckDone) {
        console.log('Auth params detected but no user after initial check, waiting for auth state...');
        
        // Wait a bit more for auth state to update
        setTimeout(() => {
          if (!user && (authParamsDetected || redirectFlag)) {
            console.log('Still no user after waiting, clearing flags and showing error');
            sessionStorage.removeItem('authRedirectInProgress');
            sessionStorage.removeItem('authRedirectTimestamp');
            sessionStorage.removeItem('authParamsDetected');
            setRedirectInProgress(false);
            setAuthError(new Error('Authentication failed. Please try again.') as AuthError);
          }
        }, 3000); // Wait 3 seconds for auth state to settle
      }
    };

    if (initialCheckDone) {
      checkAuthStateWithTimeout();
    }
  }, [user, initialCheckDone]);

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