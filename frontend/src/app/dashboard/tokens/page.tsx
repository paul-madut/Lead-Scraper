"use client";

import { useEffect, useState } from "react";
import { Coins, Check, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getTokenBalance } from "@/services/tokenService";
import { PRICING_CONFIG } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function TokensPage() {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    if (authLoading) return;
    if (!user) {
      setBalance(null);
      setBalanceLoading(false);
      return;
    }
    setBalanceLoading(true);
    setBalanceError(false);
    getTokenBalance()
      .then((b) => {
        if (!ignore) setBalance(b);
      })
      .catch(() => {
        if (!ignore) setBalanceError(true);
      })
      .finally(() => {
        if (!ignore) setBalanceLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, authLoading]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tokens</h1>
        <p className="text-muted-foreground">
          Tokens power your searches. Buy more when you need them.
        </p>
      </div>

      {/* Current balance */}
      <Card>
        <CardHeader>
          <CardTitle>Current balance</CardTitle>
          <CardDescription>Available tokens on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="h-9 w-28 animate-pulse rounded bg-muted" />
          ) : !user ? (
            <p className="text-sm text-muted-foreground">
              Sign in to view your balance.
            </p>
          ) : balanceError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Couldn&apos;t load your balance. Please try again.
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Coins className="h-7 w-7 text-primary" />
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {balance?.toLocaleString() ?? 0}
              </span>
              <span className="text-muted-foreground">tokens</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How tokens work */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">1 token = 1 new lead.</span>{" "}
          You&apos;re only charged for new leads - re-running the same area never
          bills you twice for a business you&apos;ve already pulled, and an empty
          search costs nothing.
        </p>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Buy tokens</h2>
        <p className="text-sm text-muted-foreground">
          Choose a package that fits your outreach.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_CONFIG.TOKEN_PACKAGES.map((pkg) => {
          const isPopular = "popular" in pkg && pkg.popular;
          return (
            <Card
              key={pkg.tokens}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-primary shadow-md"
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-base">{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.tokens.toLocaleString()} tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    ${pkg.price}
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    {pkg.tokens.toLocaleString()} new leads
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    No charge for duplicates
                  </li>
                </ul>
                <div className="mt-auto pt-2">
                  <Button
                    variant={isPopular ? "default" : "outline"}
                    className="w-full"
                    disabled
                  >
                    Coming soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Online checkout isn&apos;t live yet.{" "}
        <span className="text-foreground">Need tokens now? Contact us</span> and
        we&apos;ll top up your account.
      </p>
    </div>
  );
}
