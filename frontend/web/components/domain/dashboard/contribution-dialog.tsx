"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Heart,
  Sparkles,
  Calendar,
  Receipt,
  Crown,
  Star,
  Gem,
  Zap,
  Loader2,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outstandingBalance: number;
  monthlyForecast: number;
  totalContributions: number;
}

// Tier configuration - Twitch-inspired naming
interface Tier {
  id: string;
  name: string;
  multiplier: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

// Stripe fee configuration (should match webhook)
const STRIPE_PERCENTAGE_FEE = 2.9;
const STRIPE_FLAT_FEE = 0.30;

// Calculate net amount after Stripe fees
function calculateFees(grossAmount: number) {
  const percentageFee = grossAmount * (STRIPE_PERCENTAGE_FEE / 100);
  const totalFee = percentageFee + STRIPE_FLAT_FEE;
  const netAmount = Math.max(0, Math.round((grossAmount - totalFee) * 100) / 100);
  const feeAmount = Math.round(totalFee * 100) / 100;
  return { grossAmount, feeAmount, netAmount };
}

const TIERS: Tier[] = [
  {
    id: "supporter",
    name: "Supporter",
    multiplier: 1,
    icon: Heart,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    borderColor: "border-pink-300 dark:border-pink-700",
    description: "Cover your costs",
  },
  {
    id: "fan",
    name: "Fan",
    multiplier: 2,
    icon: Star,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-300 dark:border-amber-700",
    description: "Help keep the lights on",
  },
  {
    id: "champion",
    name: "Champion",
    multiplier: 5,
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
    description: "Support development",
  },
  {
    id: "legend",
    name: "Legend",
    multiplier: 10,
    icon: Gem,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    description: "You're incredible!",
  },
];

export function ContributionDialog({
  open,
  onOpenChange,
  outstandingBalance,
  monthlyForecast,
  totalContributions,
}: ContributionDialogProps) {
  const [activeTab, setActiveTab] = useState<"one-time" | "monthly">("monthly");
  const [selectedTierId, setSelectedTierId] = useState<string | null>("fan");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    if (value < 0.01) return "$0.00";
    return `$${value.toFixed(2)}`;
  };

  // Calculate base amounts (round up to nearest dollar, minimum $1)
  const oneTimeBase = Math.max(1, Math.ceil(outstandingBalance));
  const monthlyBase = Math.max(1, Math.ceil(monthlyForecast));

  // Get tier amounts based on base
  const getTierAmount = (tier: Tier, base: number) => {
    return base * tier.multiplier;
  };

  // Calculate selected amount
  const getSelectedAmount = (base: number) => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    const selectedTier = TIERS.find((t) => t.id === selectedTierId);
    if (selectedTier) {
      return getTierAmount(selectedTier, base);
    }
    return base;
  };

  const oneTimeTotal = getSelectedAmount(oneTimeBase);
  const monthlyTotal = getSelectedAmount(monthlyBase);

  // Determine which tier the current amount qualifies for
  const getAchievedTier = (amount: number, base: number): Tier | null => {
    const sortedTiers = [...TIERS].sort((a, b) => b.multiplier - a.multiplier);
    for (const tier of sortedTiers) {
      if (amount >= getTierAmount(tier, base)) {
        return tier;
      }
    }
    return null;
  };

  const currentBase = activeTab === "one-time" ? oneTimeBase : monthlyBase;
  const currentTotal = activeTab === "one-time" ? oneTimeTotal : monthlyTotal;
  const achievedTier = getAchievedTier(currentTotal, currentBase);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentTotal,
          frequency: activeTab,
          tier: achievedTier?.name || "Custom",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const renderTierCard = (tier: Tier, base: number) => {
    const amount = getTierAmount(tier, base);
    const isSelected = selectedTierId === tier.id && !customAmount;
    const TierIcon = tier.icon;

    return (
      <button
        key={tier.id}
        onClick={() => {
          setSelectedTierId(tier.id);
          setCustomAmount("");
        }}
        className={cn(
          "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all",
          "hover:scale-105 hover:shadow-md",
          isSelected
            ? `${tier.borderColor} ${tier.bgColor} shadow-sm`
            : "border-muted bg-muted/30 hover:border-muted-foreground/30"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full mb-1",
            tier.bgColor
          )}
        >
          <TierIcon className={cn("h-4 w-4", tier.color)} />
        </div>
        <span className={cn("font-bold text-lg", isSelected && tier.color)}>
          ${amount}
        </span>
        <span className="text-xs font-medium">{tier.name}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {tier.description}
        </span>
        {isSelected && (
          <div
            className={cn(
              "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
              tier.bgColor
            )}
          >
            <Zap className={cn("h-2.5 w-2.5", tier.color)} />
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support HandFull
            <span className="text-muted-foreground font-normal text-sm">
              by{" "}
              <a
                href="https://simage.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Simage
              </a>
            </span>
          </DialogTitle>
          <DialogDescription>
            Help keep HandFull free for everyone. Choose a tier that feels right
            for you!
          </DialogDescription>
        </DialogHeader>

        {totalContributions > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              You&apos;ve contributed{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(totalContributions)}
              </span>{" "}
              so far. Thank you!
            </span>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "one-time" | "monthly")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="one-time" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              One-Time
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Best
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="one-time" className="space-y-4 mt-4">
            <div className="text-center text-sm text-muted-foreground">
              Your usage so far:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(outstandingBalance)}
              </span>
            </div>

            {/* Tier Selection Grid */}
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map((tier) => renderTierCard(tier, oneTimeBase))}
            </div>

            {/* Custom Amount */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="custom-amount-onetime" className="text-sm shrink-0">
                Custom amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount-onetime"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={oneTimeBase.toString()}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedTierId(null);
                  }}
                  className="h-9 w-28 pl-6"
                />
              </div>
              {customAmount && achievedTier && (
                <Badge
                  className={cn(
                    "text-xs",
                    achievedTier.bgColor,
                    achievedTier.color
                  )}
                >
                  {achievedTier.name}
                </Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-4">
            <div className="text-center text-sm text-muted-foreground">
              Your estimated monthly cost:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(monthlyForecast)}
              </span>
            </div>

            {/* Tier Selection Grid */}
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map((tier) => renderTierCard(tier, monthlyBase))}
            </div>

            {/* Custom Amount */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="custom-amount-monthly" className="text-sm shrink-0">
                Custom amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount-monthly"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={monthlyBase.toString()}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedTierId(null);
                  }}
                  className="h-9 w-28 pl-6"
                />
              </div>
              <span className="text-sm text-muted-foreground">/mo</span>
              {customAmount && achievedTier && (
                <Badge
                  className={cn(
                    "text-xs",
                    achievedTier.bgColor,
                    achievedTier.color
                  )}
                >
                  {achievedTier.name}
                </Badge>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Tier Summary */}
        {achievedTier && (
          <Card className={cn("border-2", achievedTier.borderColor)}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      achievedTier.bgColor
                    )}
                  >
                    <achievedTier.icon
                      className={cn("h-4 w-4", achievedTier.color)}
                    />
                  </div>
                  <div>
                    <p className={cn("font-semibold", achievedTier.color)}>
                      {achievedTier.name} Tier
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievedTier.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-bold">
                      {formatCurrency(currentTotal)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="p-3 max-w-[200px]">
                        {(() => {
                          const fees = calculateFees(currentTotal);
                          return (
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span>Your payment:</span>
                                <span className="font-medium">{formatCurrency(fees.grossAmount)}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-red-300">
                                <span>Stripe fees (~2.9% + $0.30):</span>
                                <span>-{formatCurrency(fees.feeAmount)}</span>
                              </div>
                              <div className="border-t border-muted pt-1 mt-1 flex justify-between gap-4">
                                <span>HandFull receives:</span>
                                <span className="font-medium text-green-300">{formatCurrency(fees.netAmount)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {activeTab === "monthly" && (
                    <p className="text-xs text-muted-foreground">per month</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <Button
          onClick={handleCheckout}
          className="w-full"
          size="lg"
          disabled={currentTotal < 1 || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {activeTab === "one-time"
                ? `Pay ${formatCurrency(currentTotal)}`
                : `Subscribe ${formatCurrency(currentTotal)}/mo`}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Payments processed securely via Stripe. Cancel anytime.
          <br />
          HandFull is a product of Simage AI. Your payment will be made to Simage AI LLC.
        </p>
      </DialogContent>
    </Dialog>
  );
}
