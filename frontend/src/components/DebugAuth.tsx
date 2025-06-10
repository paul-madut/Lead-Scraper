// components/DebugAuth.tsx - Add this temporarily to debug mobile login
"use client";

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const { user, loading, authError } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        user: user ? { uid: user.uid, email: user.email } : null,
        loading,
        authError: authError ? authError.message : null,
        redirectFlag: sessionStorage.getItem('authRedirectInProgress'),
        redirectTimestamp: sessionStorage.getItem('authRedirectTimestamp'),
        url: window.location.href,
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasAuthParams: window.location.search.includes('state') || window.location.search.includes('code') || window.location.hash.includes('access_token')
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    
    // Update debug info periodically
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [user, loading, authError]);

  // Only show in development or with debug flag
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🐛 Auth Debug</div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}