import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, frequency, tier } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Amount must be at least $1" },
        { status: 400 }
      );
    }

    const isSubscription = frequency === "monthly";
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isSubscription
                ? "Monthly HandFull Contribution"
                : "HandFull Contribution",
              description: tier
                ? `${tier} tier - Thanks for keeping the app running!`
                : "Thanks for keeping the app running!",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            ...(isSubscription && {
              recurring: {
                interval: "month" as const,
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/dashboard?contribution=success`,
      cancel_url: `${origin}/dashboard?contribution=canceled`,
      metadata: {
        userId: session.user.id,
        tier: tier || "custom",
      },
    };

    // For subscriptions, attach metadata to the Subscription object too
    if (isSubscription) {
      sessionParams.subscription_data = {
        metadata: {
          userId: session.user.id,
          tier: tier || "custom",
        },
      };
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
