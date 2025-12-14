import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MealForm } from "@/components/domain/meals/meal-form";

export default async function AddMealPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add Meal</h1>
          <p className="text-muted-foreground">
            Log your meal with macro information and optional photo.
          </p>
        </div>
        <MealForm />
      </div>
    </div>
  );
}
