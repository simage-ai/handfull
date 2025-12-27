import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WaterForm } from "@/components/domain/water/water-form";

export default async function AddWaterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/water">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Water
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
              <Droplets className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle className="text-2xl">Log Water Intake</CardTitle>
            <CardDescription>
              Track your hydration throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
