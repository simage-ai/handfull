import { prisma } from "@/lib/prisma";

/**
 * Cost constants for the "guilt trip" widget
 * These are slightly inflated from actual GCP costs to account for overhead
 */
export const COST_CONSTANTS = {
  // $0.0001 per request (buffers CPU time, network egress, cold starts)
  COST_PER_REQUEST: 0.0001,
  // $0.03 per GB per month (slightly above $0.026 base to account for operations)
  COST_PER_GB_PER_MONTH: 0.03,
  // $0.005 per active day (flat fee for shared DB instance overhead)
  COST_PER_ACTIVE_DAY: 0.005,
  // Monthly base cost for database (fixed cost spread across users)
  MONTHLY_DB_BASE_COST: 0.15, // ~$0.15/month per active user for DB overhead
};

/**
 * Increment the API request counter for a user
 * Also tracks monthly requests for forecasting and period requests for subscription billing
 */
export async function trackApiRequest(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastMonthResetAt: true },
    });

    if (!user) return;

    const now = new Date();
    const lastReset = new Date(user.lastMonthResetAt);
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Reset monthly counter if it's been more than 30 days
    if (daysSinceReset >= 30) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalApiRequests: { increment: 1 },
          lastMonthApiRequests: 1, // Reset to 1 (this request)
          lastMonthResetAt: now,
          periodApiRequests: { increment: 1 }, // Also track period usage
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalApiRequests: { increment: 1 },
          lastMonthApiRequests: { increment: 1 },
          periodApiRequests: { increment: 1 }, // Also track period usage
        },
      });
    }
  } catch (error) {
    // Silently fail - don't break the request if tracking fails
    console.error("Failed to track API request:", error);
  }
}

/**
 * Add to the stored image bytes for a user
 * Call this when uploading an image
 */
export async function trackImageStorage(
  userId: string,
  bytes: number
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        storedImageBytes: { increment: bytes },
        periodImageBytes: { increment: bytes }, // Also track period usage
      },
    });
  } catch (error) {
    console.error("Failed to track image storage:", error);
  }
}

/**
 * Subtract from stored image bytes when an image is deleted
 */
export async function untrackImageStorage(
  userId: string,
  bytes: number
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        storedImageBytes: { decrement: bytes },
      },
    });
  } catch (error) {
    console.error("Failed to untrack image storage:", error);
  }
}

/**
 * Calculate the estimated cost for a user
 */
export interface CostEstimate {
  // Lifetime costs
  computeCost: number;
  storageCost: number;
  databaseCost: number;
  totalCost: number;

  // Contributions and balance
  totalContributions: number;
  outstandingBalance: number; // totalCost - totalContributions

  // Monthly forecast
  monthlyForecast: {
    compute: number;
    storage: number;
    database: number;
    total: number;
  };
  isEstimatedForecast: boolean; // true if user is new (<30 days) and we're estimating

  // Subscription info
  subscription: {
    active: boolean;
    status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | null;
    amount: number | null; // Monthly amount
    tier: string | null;
    coversUsage: boolean; // Does subscription cover monthly forecast?
    surplus: number; // How much extra they're paying (positive) or short (negative)
  };

  // Current billing period info (for subscribers)
  billingPeriod: {
    active: boolean;
    start: Date | null;
    end: Date | null;
    lastPayment: number | null;
    periodUsageCost: number; // Cost of usage in current billing period
    periodBalance: number; // lastPayment - periodUsageCost (positive = credit, negative = over)
  };

  // Raw metrics for display
  totalRequests: number;
  lastMonthRequests: number;
  storedGB: number;
  totalMeals: number;
  activeDays: number;

  // Status for UI coloring
  status: "sustainable" | "moderate" | "heavy";
  balanceStatus: "paid" | "owing" | "ahead"; // ahead = contributed more than cost
}

export async function calculateUserCost(userId: string): Promise<CostEstimate> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalApiRequests: true,
      storedImageBytes: true,
      lastMonthApiRequests: true,
      lastMonthResetAt: true,
      totalContributions: true,
      createdAt: true,
      subscriptionStatus: true,
      subscriptionAmount: true,
      subscriptionTier: true,
      billingPeriodStart: true,
      billingPeriodEnd: true,
      lastPaymentAmount: true,
      lastPaymentDate: true,
      periodApiRequests: true,
      periodImageBytes: true,
      _count: {
        select: { meals: true },
      },
    },
  });

  if (!user) {
    return {
      computeCost: 0,
      storageCost: 0,
      databaseCost: 0,
      totalCost: 0,
      totalContributions: 0,
      outstandingBalance: 0,
      monthlyForecast: { compute: 0, storage: 0, database: 0, total: 0 },
      isEstimatedForecast: true,
      subscription: {
        active: false,
        status: null,
        amount: null,
        tier: null,
        coversUsage: false,
        surplus: 0,
      },
      billingPeriod: {
        active: false,
        start: null,
        end: null,
        lastPayment: null,
        periodUsageCost: 0,
        periodBalance: 0,
      },
      totalRequests: 0,
      lastMonthRequests: 0,
      storedGB: 0,
      totalMeals: 0,
      activeDays: 0,
      status: "sustainable",
      balanceStatus: "paid",
    };
  }

  // Calculate days since account creation
  const now = new Date();
  const createdAt = new Date(user.createdAt);
  const activeDays = Math.max(
    1,
    Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate months active (for storage cost calculation)
  const monthsActive = Math.max(1, Math.ceil(activeDays / 30));

  // Convert bytes to GB
  const storedGB = Number(user.storedImageBytes) / (1024 * 1024 * 1024);

  // Calculate lifetime costs
  const computeCost = user.totalApiRequests * COST_CONSTANTS.COST_PER_REQUEST;
  const storageCost =
    storedGB * COST_CONSTANTS.COST_PER_GB_PER_MONTH * monthsActive;
  const databaseCost = activeDays * COST_CONSTANTS.COST_PER_ACTIVE_DAY;

  const totalCost = computeCost + storageCost + databaseCost;

  // Calculate outstanding balance
  const outstandingBalance = Math.max(0, totalCost - user.totalContributions);

  // Calculate monthly forecast
  // If user is new (<30 days), estimate based on typical usage:
  // - 5 meals/day (3 meals + 2 snacks) with 1.5MB images each
  // - 10 site visits/day (API requests)
  // If user has been active 30+ days, use actual data
  const isEstimatedForecast = activeDays < 30;

  let monthlyComputeForecast: number;
  let monthlyStorageForecast: number;
  const monthlyDatabaseForecast = COST_CONSTANTS.MONTHLY_DB_BASE_COST;

  if (isEstimatedForecast) {
    // Estimated usage for new users
    const estimatedDailyMeals = 5; // 3 meals + 2 snacks
    const estimatedDailyWorkouts = 5; // workout log entries
    const estimatedImageSizeMB = 1.5;
    const estimatedDailyVisits = 20; // site visits (page loads, API calls)
    const daysPerMonth = 30;

    // Estimated monthly requests: 20 visits/day * 30 days + workout logging
    const estimatedMonthlyRequests = (estimatedDailyVisits + estimatedDailyWorkouts) * daysPerMonth;
    monthlyComputeForecast =
      estimatedMonthlyRequests * COST_CONSTANTS.COST_PER_REQUEST;

    // Estimated monthly storage: 5 meals/day * 1.5MB * 30 days (workouts don't use storage)
    const estimatedMonthlyStorageGB =
      (estimatedDailyMeals * estimatedImageSizeMB * daysPerMonth) / 1024;
    monthlyStorageForecast =
      estimatedMonthlyStorageGB * COST_CONSTANTS.COST_PER_GB_PER_MONTH;
  } else {
    // Use actual data for established users
    monthlyComputeForecast =
      user.lastMonthApiRequests * COST_CONSTANTS.COST_PER_REQUEST;
    monthlyStorageForecast = storedGB * COST_CONSTANTS.COST_PER_GB_PER_MONTH;
  }

  const monthlyTotalForecast =
    monthlyComputeForecast + monthlyStorageForecast + monthlyDatabaseForecast;

  // Determine usage status
  let status: "sustainable" | "moderate" | "heavy" = "sustainable";
  if (totalCost > 1.0) {
    status = "heavy";
  } else if (totalCost > 0.25) {
    status = "moderate";
  }

  // Determine balance status
  let balanceStatus: "paid" | "owing" | "ahead" = "paid";
  if (user.totalContributions > totalCost) {
    balanceStatus = "ahead";
  } else if (outstandingBalance > 0.01) {
    balanceStatus = "owing";
  }

  // Calculate subscription status
  const hasActiveSubscription = user.subscriptionStatus === "ACTIVE";
  const subscriptionAmount = user.subscriptionAmount ?? null;
  const subscriptionSurplus = subscriptionAmount
    ? subscriptionAmount - monthlyTotalForecast
    : -monthlyTotalForecast;
  const subscriptionCoversUsage = hasActiveSubscription && subscriptionSurplus >= 0;

  // Calculate billing period usage cost
  const periodStoredGB = Number(user.periodImageBytes) / (1024 * 1024 * 1024);
  const periodComputeCost = user.periodApiRequests * COST_CONSTANTS.COST_PER_REQUEST;
  const periodStorageCost = periodStoredGB * COST_CONSTANTS.COST_PER_GB_PER_MONTH;

  // Calculate days in current billing period for pro-rated DB cost
  let periodDays = 0;
  if (user.billingPeriodStart) {
    const periodStart = new Date(user.billingPeriodStart);
    periodDays = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
  }
  const periodDbCost = (periodDays / 30) * COST_CONSTANTS.MONTHLY_DB_BASE_COST;

  const periodUsageCost = periodComputeCost + periodStorageCost + periodDbCost;
  const hasBillingPeriod = !!(user.billingPeriodStart && user.lastPaymentAmount);
  const periodBalance = user.lastPaymentAmount
    ? user.lastPaymentAmount - periodUsageCost
    : 0;

  return {
    computeCost,
    storageCost,
    databaseCost,
    totalCost,
    totalContributions: user.totalContributions,
    outstandingBalance,
    monthlyForecast: {
      compute: monthlyComputeForecast,
      storage: monthlyStorageForecast,
      database: monthlyDatabaseForecast,
      total: monthlyTotalForecast,
    },
    isEstimatedForecast,
    subscription: {
      active: hasActiveSubscription,
      status: user.subscriptionStatus,
      amount: subscriptionAmount,
      tier: user.subscriptionTier,
      coversUsage: subscriptionCoversUsage,
      surplus: subscriptionSurplus,
    },
    billingPeriod: {
      active: hasBillingPeriod,
      start: user.billingPeriodStart,
      end: user.billingPeriodEnd,
      lastPayment: user.lastPaymentAmount,
      periodUsageCost,
      periodBalance,
    },
    totalRequests: user.totalApiRequests,
    lastMonthRequests: user.lastMonthApiRequests,
    storedGB,
    totalMeals: user._count.meals,
    activeDays,
    status,
    balanceStatus,
  };
}
