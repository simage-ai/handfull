import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripe fee configuration
const STRIPE_PERCENTAGE_FEE = parseFloat(process.env.STRIPE_PERCENTAGE_TRANSACTION || "2.9");
const STRIPE_FLAT_FEE = parseFloat(process.env.STRIPE_ADDITIONAL_TRANSACTION_FEE || "0.30");

/**
 * Calculate the net amount after Stripe transaction fees
 * Formula: net = gross - (gross * percentage / 100) - flat_fee
 */
function calculateNetAmount(grossAmount: number): number {
  const percentageFee = grossAmount * (STRIPE_PERCENTAGE_FEE / 100);
  const totalFee = percentageFee + STRIPE_FLAT_FEE;
  const netAmount = grossAmount - totalFee;
  // Ensure we don't go negative for very small amounts
  return Math.max(0, Math.round(netAmount * 100) / 100);
}

async function recordContribution(
  userId: string,
  grossAmount: number,
  type: "ONE_TIME" | "MONTHLY",
  stripePaymentId?: string,
  stripeSessionId?: string
) {
  // Calculate net amount after Stripe fees
  const netAmount = calculateNetAmount(grossAmount);
  const feeAmount = Math.round((grossAmount - netAmount) * 100) / 100;

  console.log(
    `Recording contribution: $${grossAmount} gross - $${feeAmount} fees = $${netAmount} net (${type}) for user ${userId}`
  );

  await prisma.$transaction([
    // Create contribution record with net amount
    prisma.contribution.create({
      data: {
        userId,
        amount: netAmount,
        type,
        tip: 0, // We're not tracking tip separately anymore
        stripePaymentId,
        stripeSessionId,
        status: "COMPLETED",
      },
    }),
    // Update user's total contributions with net amount
    prisma.user.update({
      where: { id: userId },
      data: {
        totalContributions: { increment: netAmount },
      },
    }),
  ]);
}

async function updateSubscriptionStatus(
  userId: string,
  subscriptionId: string,
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID",
  amount?: number,
  tier?: string,
  customerId?: string,
  billingPeriodStart?: Date,
  billingPeriodEnd?: Date
) {
  console.log(`Updating subscription status for user ${userId}: ${status}`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: status,
      ...(amount !== undefined && { subscriptionAmount: amount }),
      ...(tier && { subscriptionTier: tier }),
      ...(customerId && { stripeCustomerId: customerId }),
      ...(billingPeriodStart && { billingPeriodStart }),
      ...(billingPeriodEnd && { billingPeriodEnd }),
    },
  });
}

async function recordSubscriptionPayment(
  userId: string,
  grossAmount: number,
  periodStart: Date,
  periodEnd: Date
) {
  // Calculate net amount after Stripe fees
  const netAmount = calculateNetAmount(grossAmount);
  const feeAmount = Math.round((grossAmount - netAmount) * 100) / 100;

  console.log(`Recording subscription payment: $${grossAmount} gross - $${feeAmount} fees = $${netAmount} net for user ${userId}, period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastPaymentAmount: netAmount,
      lastPaymentDate: new Date(),
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      // Reset period usage counters for new billing period
      periodApiRequests: 0,
      periodImageBytes: BigInt(0),
    },
  });
}

async function clearSubscription(userId: string) {
  console.log(`Clearing subscription for user ${userId}`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionAmount: null,
      subscriptionTier: null,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    // CASE 1: Checkout Completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (session.mode === "payment") {
        // One-time payment
        const amount = session.amount_total ? session.amount_total / 100 : 0;

        if (userId && amount > 0) {
          await recordContribution(
            userId,
            amount,
            "ONE_TIME",
            session.payment_intent as string,
            session.id
          );
          console.log(
            `One-time payment recorded: $${amount} for user ${userId}`
          );
        }
      } else if (session.mode === "subscription") {
        // Subscription created - update user's subscription info
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const amount = subscription.items.data[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0;

        if (userId) {
          await updateSubscriptionStatus(
            userId,
            subscriptionId,
            "ACTIVE",
            amount,
            tier,
            session.customer as string
          );
          console.log(
            `Subscription created: $${amount}/mo for user ${userId} (${tier} tier)`
          );
        }
      }
    }

    // CASE 2: Invoice Paid (Every month of a subscription, INCLUDING the first)
    if (event.type === "invoice.payment_succeeded") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;

      // Get subscription ID - can be in different places depending on Stripe API version
      const subscriptionId =
        invoice.subscription ||
        invoice.parent?.subscription_details?.subscription;

      // Only process subscription invoices
      if (subscriptionId) {
        const subId = typeof subscriptionId === "string"
          ? subscriptionId
          : subscriptionId.id;

        const subscription = await stripe.subscriptions.retrieve(subId);

        // Get userId from subscription metadata or invoice parent metadata
        const userId =
          subscription.metadata?.userId ||
          invoice.parent?.subscription_details?.metadata?.userId;

        const amount = (invoice.amount_paid || 0) / 100;

        if (userId && amount > 0) {
          // Record the contribution
          await recordContribution(
            userId,
            amount,
            "MONTHLY",
            invoice.payment?.payment_intent || invoice.payment_intent,
            invoice.id
          );

          // Get billing period - try from subscription items first, then invoice lines
          let periodStart = subscription.items.data[0]?.current_period_start;
          let periodEnd = subscription.items.data[0]?.current_period_end;

          // Fallback to invoice line item period
          if (!periodStart || !periodEnd) {
            const lineItem = invoice.lines?.data?.[0];
            if (lineItem?.period) {
              periodStart = lineItem.period.start;
              periodEnd = lineItem.period.end;
            }
          }

          console.log(`Billing period: start=${periodStart}, end=${periodEnd}`);

          if (periodStart && periodEnd) {
            await recordSubscriptionPayment(
              userId,
              amount,
              new Date(periodStart * 1000),
              new Date(periodEnd * 1000)
            );
            console.log(`Recorded billing period for user ${userId}`);
          } else {
            console.warn(`Missing billing period data for subscription`);
          }

          console.log(
            `Subscription payment recorded: $${amount} for user ${userId}`
          );
        } else {
          console.warn(
            `Could not find userId for subscription ${subId}`
          );
        }
      }
    }

    // CASE 3: Subscription updated (e.g., plan change, payment failed, or scheduled cancellation)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const status = subscription.status;

        // Check if subscription is scheduled to cancel (cancel_at is set) or already canceled
        if (subscription.cancel_at || subscription.cancel_at_period_end || subscription.canceled_at) {
          // Mark as canceled even though it's still technically active until period end
          await updateSubscriptionStatus(userId, subscription.id, "CANCELED");
          console.log(`Subscription scheduled for cancellation for user ${userId} (cancel_at: ${subscription.cancel_at})`);
        } else if (status === "canceled") {
          await clearSubscription(userId);
          console.log(`Subscription canceled for user ${userId}`);
        } else {
          let dbStatus: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" = "ACTIVE";

          if (status === "past_due") dbStatus = "PAST_DUE";
          else if (status === "unpaid") dbStatus = "UNPAID";

          const amount = subscription.items.data[0]?.price?.unit_amount
            ? subscription.items.data[0].price.unit_amount / 100
            : undefined;

          await updateSubscriptionStatus(userId, subscription.id, dbStatus, amount);
          console.log(`Subscription updated for user ${userId}: ${dbStatus}`);
        }
      }
    }

    // CASE 4: Subscription fully deleted (end of billing period after cancellation)
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await clearSubscription(userId);
        console.log(`Subscription fully deleted for user ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing webhook: ${message}`);
    return NextResponse.json(
      { error: `Webhook processing error: ${message}` },
      { status: 500 }
    );
  }
}
