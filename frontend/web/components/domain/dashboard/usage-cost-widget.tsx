"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  HardDrive,
  Database,
  Heart,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Crown,
  Star,
  Gem,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContributionDialog } from "./contribution-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CostEstimate {
  computeCost: number;
  storageCost: number;
  databaseCost: number;
  totalCost: number;
  totalContributions: number;
  outstandingBalance: number;
  monthlyForecast: {
    compute: number;
    storage: number;
    database: number;
    total: number;
  };
  isEstimatedForecast: boolean;
  subscription: {
    active: boolean;
    status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | null;
    amount: number | null;
    tier: string | null;
    coversUsage: boolean;
    surplus: number;
  };
  billingPeriod: {
    active: boolean;
    start: string | null;
    end: string | null;
    lastPayment: number | null;
    periodUsageCost: number;
    periodBalance: number;
  };
  totalRequests: number;
  lastMonthRequests: number;
  storedGB: number;
  totalMeals: number;
  activeDays: number;
  status: "sustainable" | "moderate" | "heavy";
  balanceStatus: "paid" | "owing" | "ahead";
}

const TIER_CONFIG: Record<
  string,
  { icon: typeof Heart; color: string; bgColor: string }
> = {
  Supporter: {
    icon: Heart,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  Fan: {
    icon: Star,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  Champion: {
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  Legend: {
    icon: Gem,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
};

export function UsageCostWidget() {
  const [cost, setCost] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/rest/v1/users/me/usage");
        if (!res.ok) throw new Error("Failed to fetch usage");
        const data = await res.json();
        setCost(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open portal:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Footprint</CardTitle>
          <CardDescription>What you cost me</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            Calculating...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !cost) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return value < 0.01 ? "<$0.01" : `$${value.toFixed(2)}`;
  };

  const formatStorage = (gb: number) => {
    if (gb < 0.001) return `${(gb * 1024 * 1024).toFixed(0)} KB`;
    if (gb < 1) return `${(gb * 1024).toFixed(1)} MB`;
    return `${gb.toFixed(2)} GB`;
  };

  // Get tier config for subscription
  const tierConfig = cost.subscription.tier
    ? TIER_CONFIG[cost.subscription.tier] || TIER_CONFIG.Supporter
    : null;
  const TierIcon = tierConfig?.icon || Heart;

  // Determine overall status
  const hasActiveSubscription = cost.subscription.active;
  const isCanceledWithPeriod =
    cost.subscription.status === "CANCELED" && cost.billingPeriod.active;
  const isInGreen =
    hasActiveSubscription && cost.subscription.coversUsage;
  const isSubscriptionShort =
    hasActiveSubscription && !cost.subscription.coversUsage;
  const periodBalancePositive = cost.billingPeriod.periodBalance >= 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Footprint</CardTitle>
            {/* Status Badge */}
            {hasActiveSubscription ? (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  isInGreen
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                )}
              >
                {isInGreen ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {isInGreen ? "Covered" : "Short"}
              </div>
            ) : isCanceledWithPeriod ? (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  periodBalancePositive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                )}
              >
                {periodBalancePositive ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                Canceled
              </div>
            ) : cost.balanceStatus === "ahead" ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3 w-3" />
                Supporter
              </div>
            ) : cost.outstandingBalance > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                Balance Due
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Paid Up
              </div>
            )}
          </div>
          <CardDescription>What you cost me</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Canceled Subscription with Period Balance */}
          {isCanceledWithPeriod && (
            <div
              className={cn(
                "p-3 rounded-lg border",
                periodBalancePositive
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Subscription Canceled</span>
                </div>
                {cost.billingPeriod.end && (
                  <span className="text-xs text-muted-foreground">
                    Ends {new Date(cost.billingPeriod.end).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 rounded-lg bg-background/50">
                  <p className="text-lg font-bold">
                    {formatCurrency(cost.billingPeriod.lastPayment || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Payment</p>
                </div>
                <div className="p-2 rounded-lg bg-background/50">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      periodBalancePositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {periodBalancePositive ? "+" : ""}
                    {formatCurrency(Math.abs(cost.billingPeriod.periodBalance))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {periodBalancePositive ? "Credit Left" : "Over Budget"}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Period usage: {formatCurrency(cost.billingPeriod.periodUsageCost)}
              </div>
            </div>
          )}

          {/* Active Subscription Banner */}
          {hasActiveSubscription && tierConfig && (
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border",
                tierConfig.bgColor
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    tierConfig.bgColor
                  )}
                >
                  <TierIcon className={cn("h-4 w-4", tierConfig.color)} />
                </div>
                <div>
                  <p className={cn("font-semibold text-sm", tierConfig.color)}>
                    {cost.subscription.tier} Tier
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${cost.subscription.amount}/mo subscription
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isInGreen ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    +${cost.subscription.surplus.toFixed(2)}/mo
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  >
                    -${Math.abs(cost.subscription.surplus).toFixed(2)}/mo
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Balance Overview - Only show if no subscription and no canceled subscription with period */}
          {!hasActiveSubscription && !isCanceledWithPeriod && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">
                  {formatCurrency(cost.totalCost)}
                </p>
                <p className="text-xs text-muted-foreground">Total Usage</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p
                  className={cn(
                    "text-lg font-bold",
                    cost.outstandingBalance > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400"
                  )}
                >
                  {cost.totalContributions > cost.totalCost
                    ? `+${formatCurrency(cost.totalContributions - cost.totalCost)}`
                    : formatCurrency(cost.outstandingBalance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cost.totalContributions > cost.totalCost
                    ? "Credit"
                    : "Balance Due"}
                </p>
              </div>
            </div>
          )}

          {/* Cost Breakdown - Compact */}
          <div className="grid grid-cols-3 gap-1 text-center text-xs">
            <div className="p-1.5 rounded bg-muted/30">
              <Server className="h-3 w-3 mx-auto mb-0.5 text-blue-500" />
              <p className="font-medium">{formatCurrency(cost.computeCost)}</p>
              <p className="text-[10px] text-muted-foreground">Compute</p>
            </div>
            <div className="p-1.5 rounded bg-muted/30">
              <HardDrive className="h-3 w-3 mx-auto mb-0.5 text-purple-500" />
              <p className="font-medium">{formatCurrency(cost.storageCost)}</p>
              <p className="text-[10px] text-muted-foreground">Storage</p>
            </div>
            <div className="p-1.5 rounded bg-muted/30">
              <Database className="h-3 w-3 mx-auto mb-0.5 text-green-500" />
              <p className="font-medium">{formatCurrency(cost.databaseCost)}</p>
              <p className="text-[10px] text-muted-foreground">Database</p>
            </div>
          </div>

          {/* Usage Stats - Compact Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground border-t pt-2">
            <div className="flex justify-between">
              <span>Meals</span>
              <span className="font-medium text-foreground">
                {cost.totalMeals}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="font-medium text-foreground">
                {formatStorage(cost.storedGB)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Requests</span>
              <span className="font-medium text-foreground">
                {cost.totalRequests.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Days</span>
              <span className="font-medium text-foreground">
                {cost.activeDays}
              </span>
            </div>
          </div>

          {/* Monthly Forecast */}
          <div className="flex items-center justify-between text-xs border-t pt-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Monthly forecast
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  {cost.isEstimatedForecast
                    ? "Estimated based on typical usage: 5 meals/day with 1.5MB images, 5 workout entries, and 20 daily site visits."
                    : "Based on your actual usage over the past 30 days."}
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="font-medium">
              {formatCurrency(cost.monthlyForecast.total)}/mo
              {cost.isEstimatedForecast && (
                <span className="text-muted-foreground ml-1">(est)</span>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          {hasActiveSubscription ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="mr-2 h-4 w-4" />
                )}
                Manage
              </Button>
              {isSubscriptionShort && (
                <Button
                  variant="default"
                  className="flex-1"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant={cost.outstandingBalance > 0 ? "default" : "outline"}
              className="w-full"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Heart className="mr-2 h-4 w-4" />
              {cost.outstandingBalance > 0 ? "Contribute" : "Support HandFull"}
            </Button>
          )}

          {cost.totalContributions > 0 && !hasActiveSubscription && (
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ve contributed {formatCurrency(cost.totalContributions)}{" "}
              total
            </p>
          )}
        </CardContent>
      </Card>

      <ContributionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        outstandingBalance={cost.outstandingBalance}
        monthlyForecast={cost.monthlyForecast.total}
        totalContributions={cost.totalContributions}
      />
    </>
  );
}
