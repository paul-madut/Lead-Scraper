"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Coins } from "lucide-react";
import { getTokenBalance } from "../services/tokenService";
import { useAuth } from "@/components/AuthProvider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchTokenBalance() {
      if (!user) {
        setUserTokens(null);
        return;
      }

      setIsLoadingTokens(true);
      try {
        const currentBalance = await getTokenBalance();
        if (active) setUserTokens(currentBalance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        if (active) setUserTokens(null);
      } finally {
        if (active) setIsLoadingTokens(false);
      }
    }

    fetchTokenBalance();

    return () => {
      active = false;
    };
  }, [user]);

  const tokenValue = isLoadingTokens
    ? "..."
    : userTokens != null
      ? userTokens.toLocaleString()
      : "-";

  return (
    <nav className="border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Image src="/logo.png" alt="B2Lead" width={32} height={32} />
            </div>
            <span className="hidden text-xl font-semibold text-foreground sm:block">
              B2Lead
            </span>
            <span className="text-lg font-semibold text-foreground sm:hidden">
              B2L
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {/* Token Display */}
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Available Tokens:
              </span>
              <span className="text-sm font-bold text-primary">{tokenValue}</span>
            </div>

            <Link
              href="/dashboard/tokens"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Get More Tokens
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="border-t pt-4 pb-4 md:hidden">
            <div className="flex flex-col gap-3">
              {/* Mobile Token Display */}
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Available Tokens:
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">{tokenValue}</span>
              </div>

              <Link
                href="/dashboard/tokens"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full"
                )}
              >
                Get More Tokens
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
