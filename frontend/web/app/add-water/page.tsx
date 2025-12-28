import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WaterForm } from "@/components/domain/water/water-form";

export default async function AddWaterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Log Water</h1>
          <p className="text-muted-foreground">
            Track your hydration throughout the day.
          </p>
        </div>
        <WaterForm />
      </div>
    </div>
  );
}
