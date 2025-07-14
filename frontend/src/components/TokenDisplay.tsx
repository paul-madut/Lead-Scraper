"use client";
import { useState, useEffect } from 'react';
import { getTokenBalance } from '@/services/tokenService';
import { useAuth } from '@/components/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';
import { motion } from 'motion/react';
import { IconCoins } from '@tabler/icons-react';
import Link from 'next/link';

export const TokenDisplay = () => {
  const { user } = useAuth();
  const { open, animate } = useSidebar();
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchTokenBalance() {
      if (!user) {
        setUserTokens(null);
        return;
      }
      
      setIsLoading(true);
      try {
        const currentBalance = await getTokenBalance();
        setUserTokens(currentBalance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setUserTokens(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTokenBalance();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 py-2">
      {/* Token Balance Display */}
      <div className="flex items-center gap-2 py-2">
        <IconCoins className="h-5 w-5 shrink-0 text-blue-600" />
        <motion.div
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="flex flex-col md:flex-col"
        >
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            Available Tokens:  
          </span>
          <span className="text-sm font-bold text-blue-600">
            {isLoading ? "..." : userTokens?.toLocaleString() || "0"}
          </span>
        </motion.div>
      </div>

      {/* Get More Tokens Button - Show on mobile always, on desktop only when open */}
      <motion.div
        animate={{
          display: animate ? (open ? "block" : "none") : "block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="w-full"
      >
        <Link href="/dashboard/tokens" className="block w-full">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Get More Tokens
          </button>
        </Link>
      </motion.div>
    </div>
  );
};