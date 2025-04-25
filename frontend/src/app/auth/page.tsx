"use client"
import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
const page = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const router = useRouter()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const pulse = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col">
      <Head>
        <title>Log In - B2Lead | Lead Generation for Web Professionals</title>
        <meta name="description" content="Log in to B2Lead to access your leads dashboard." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="py-4 bg-white shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <Link href="/" className="flex items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold text-blue-600"
            >
              B2Lead
            </motion.div>
          </Link>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your B2Lead dashboard</p>
          </div>
          
          <div className="space-y-6">
            
            
            <motion.button
              variants={pulse}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={login}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md px-4 py-3 space-x-3 shadow-sm hover:shadow-md transition-all duration-200 relative"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 font-medium">Sign in with Google</span>
                </>
              )}
            </motion.button>
            
            <div className="text-center text-sm text-gray-500">
              <p>By signing in, you agree to our <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>.</p>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account? <Link href="/" className="text-blue-600 font-medium hover:underline">Sign up for free</Link>
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} B2Lead. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Help Center</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default page;