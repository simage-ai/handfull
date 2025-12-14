import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Logo } from "@/components/common/logo";
import {
  Hand,
  Camera,
  ClipboardCheck,
  Share2,
  ArrowRight,
  Zap,
  Heart,
  DollarSign,
} from "lucide-react";
import { PortionGuideMarquee } from "@/components/domain/landing/portion-guide-marquee";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo width={150} height={150} showName={false} />
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              HandFull
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
              Track your nutrition the way humans have measured food for
              thousands of years—with your hands. No barcode scanning. No
              complicated calorie counting. Just simple, sustainable tracking.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/signin">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why We Made HandFull
            </h2>
            <div className="mt-8 space-y-6 text-left text-lg text-muted-foreground">
              <p>
                At{" "}
                <a
                  href="https://simage.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Simage
                </a>
                , we&apos;re on a mission to build products we actually want to
                use ourselves. Staying healthy is important to us, but
                we&apos;re tired of expensive meal tracking apps that charge
                $100+/month to scan barcodes and obsess over exact calorie
                counts. That level of precision isn&apos;t sustainable—and for
                most people, it&apos;s not necessary.
              </p>
              <p className="text-foreground font-medium">
                Our Hypothesis: if we can track 80% of our food
                correctly and consistently, we&apos;ll get 80% of the results (hopefully). 
              </p>
              <p>
                We built HandFull on a simple philosophy: measure with your
                hands, not a food scale. Your palm, your fist, your thumb—these
                are the only measuring tools you need. This approach is based on
                the{" "}
                <a
                  href="https://d1training.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  D1 Training
                </a>{" "}
                nutrition program, which prioritizes consistency over
                perfection.
              </p>
              <p>
                We&apos;re so sick of fitness and healthcare tools being behind
                expensive paywalls, only to find they&apos;re overly complicated
                and require you to change your whole life to use them. So we
                made this free for everyone. Pay what you want, if you want.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Simple</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Look at your food, estimate handfuls, log it. Done in seconds,
                  not minutes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Sustainable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  No lifestyle overhaul required. A system you can actually
                  stick with long-term.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Free</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Health tracking shouldn&apos;t be behind an expensive paywall.
                  Pay what you want, if you want.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four steps. That&apos;s it.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                1
              </div>
              <div className="mt-6">
                <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Snap a Photo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Take a quick picture of your meal. This helps you remember
                  what you ate and share with others for accountability.
                </p>
              </div>
            </div>

            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                2
              </div>
              <div className="mt-6">
                <Hand className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Estimate Handfuls</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  How many palms of protein? Fists of carbs? Thumbs of fat?
                  Quick visual estimates—no measuring cups needed.
                </p>
              </div>
            </div>

            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                3
              </div>
              <div className="mt-6">
                <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Log It</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tap in your portions. Track against your daily plan. See your
                  progress at a glance.
                </p>
              </div>
            </div>

            <div className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                4
              </div>
              <div className="mt-6">
                <Share2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Share (Optional)</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share with your trainer or nutritionist (if you&apos;re lucky
                  enough to have one), or with friends and family to help keep
                  you accountable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portion Guide Section */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The HandFull Portion Guide
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your hands are the only measuring tools you need
            </p>
          </div>
        </div>

        <div className="mt-16 mx-auto max-w-4xl px-4">
          <PortionGuideMarquee />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Based on the{" "}
              <a
                href="https://d1training.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                D1 Training
              </a>{" "}
              nutrition methodology used by professional athletes
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to simplify your nutrition?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop overthinking. Start tracking. Get results.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signin">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
