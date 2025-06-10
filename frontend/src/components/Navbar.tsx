import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTokenBalance } from '../services/tokenService';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';


export default function Navbar({ tokens = 200, }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth();
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const navigate = useRouter();
  
  useEffect(() => {
      async function fetchTokenBalance() {
        if (!user) {
          setUserTokens(null);
          return;
        }
        
        setIsLoadingTokens(true);
        try {
          const currentBalance  = await getTokenBalance(user.uid);
          setUserTokens(currentBalance);
        } catch (error) {
          console.error('Error fetching token balance:', error);
          // Don't show error to user, just set to null
          setUserTokens(null);
        } finally {
          setIsLoadingTokens(false);
        }
      }
      
      fetchTokenBalance();
    }, [user]);

  return (
    <nav className="bg-[#f5f5f5] border-b-2 border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* Business Logo - replace with your actual logo */}
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Image src="/logo.png" alt="Business Logo" width={32} height={32}></Image>
              </div>
              <span className="text-xl font-semibold text-gray-900 hidden sm:block">
                B2Lead
              </span>
              <span className="text-lg font-semibold text-gray-900 sm:hidden">
                B2L
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Token Display */}
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Available Tokens:
              </span>
              <span className="text-sm font-bold text-blue-600">
                {userTokens?.toLocaleString()}
              </span>
            </div>

            {/* Get More Tokens Button */}
            <Link href="/dashboard/tokens">
            <button
              
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
              Get More Tokens
            </button>
                </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <div className="flex flex-col space-y-3">
              {/* Mobile Token Display */}
              <div className="flex items-center justify-between bg-gray-50 px-3 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Available Tokens:
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {tokens.toLocaleString()}
                </span>
              </div>

              {/* Mobile Get More Tokens Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Link href={'/dashboard/tokens'}> 
                Get More Tokens
                </Link>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}