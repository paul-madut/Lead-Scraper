"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function AuthPage() {
  const { user, signInWithGoogle, loading, authError } = useAuth();
  const router = useRouter();
  const [authAttempted, setAuthAttempted] = useState(false);

  // Redirect once we have a signed-in user and auth has settled.
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      setAuthAttempted(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  const isBusy = loading && authAttempted;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-accent/40 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 py-4 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            B2Lead
          </Link>
        </div>
      </header>

      <main className="flex flex-grow items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to access your B2Lead dashboard.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {authError && authAttempted && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Authentication failed: {authError.message || "Please try again."}
                  </span>
                </div>
              )}

              {isBusy && (
                <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-accent p-3 text-sm text-accent-foreground">
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                  <span>Opening secure Google sign-in...</span>
                </div>
              )}

              <Button
                onClick={handleSignIn}
                disabled={loading}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link href="#" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>&copy; {new Date().getFullYear()} B2Lead. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
