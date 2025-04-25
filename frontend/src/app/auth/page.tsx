"use client"
import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
const page = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const router = useRouter()

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }

    console.log("button")
    console.log(user);

  };

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);
  return (
    <div>
      <button className='btn flex border-2 p-4  hover:bg-accent' onClick={login}>Sign in with Google</button>
    </div>
  );
};

export default page;