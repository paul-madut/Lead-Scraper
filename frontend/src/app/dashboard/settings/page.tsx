"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut, Loader2, User as UserIcon, Mail } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and session.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ) : !user ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You are not signed in.
          </CardContent>
        </Card>
      ) : (
        (() => {
          const photoURL =
            user.providerData?.[0]?.photoURL ?? user.photoURL ?? null;
          const displayName = user.displayName ?? "Your account";
          return (
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  You are signed in with Google.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  {photoURL ? (
                    <Image
                      src={photoURL}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-lg font-medium text-foreground">
                      {displayName}
                    </div>
                    {user.email != null && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {signingOut ? "Signing out..." : "Sign out"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()
      )}
    </div>
  );
}
