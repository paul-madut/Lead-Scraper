"use client"
import Image from 'next/image'
import { TokenDisplay } from './TokenDisplay'

export default function Navbar() {
  return (
    <nav className="bg-[#f5f5f5] border-b-2 border-gray-200 px-4 sm:px-6 lg:px-8 hidden md:block">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Hidden on mobile since sidebar has logo */}
          <div className="hidden md:flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Image src="/logo.png" alt="Business Logo" width={32} height={32}></Image>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                B2Lead
              </span>
             
            </div>
          </div>
          <TokenDisplay />
        </div>
      </div>
    </nav>
  )
}