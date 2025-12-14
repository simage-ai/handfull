import {
  Beef,
  Droplets,
  Wheat,
  Salad,
  Cookie,
  Hand,
  CircleDot,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Portion Guide</h2>
        <p className="text-muted-foreground">
          Your hands are the only measuring tools you need. Here&apos;s how to
          estimate portions for each macro.
        </p>
      </div>

      {/* Hand Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Quick Reference
          </CardTitle>
          <CardDescription>
            Use these hand measurements to estimate your portions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <span className="text-lg">🖐️</span>
              </div>
              <div>
                <p className="font-medium">Palm</p>
                <p className="text-sm text-muted-foreground">
                  For protein - the size and thickness of your palm (no fingers)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <span className="text-lg">✊</span>
              </div>
              <div>
                <p className="font-medium">Fist</p>
                <p className="text-sm text-muted-foreground">
                  For carbs & veggies - about the size of your closed fist
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <span className="text-lg">👍</span>
              </div>
              <div>
                <p className="font-medium">Thumb</p>
                <p className="text-sm text-muted-foreground">
                  For fats - about 1-2 tablespoons worth
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <CircleDot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Half Portions</p>
                <p className="text-sm text-muted-foreground">
                  Use 0.5 when you eat less than a full portion
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Portion Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Protein */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Beef className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Protein
                </CardTitle>
                <CardDescription>1 Palm = 1 Portion (~6oz / 170g)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Lean Meats</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• Chicken breast (skinless)</li>
                <li>• Turkey breast</li>
                <li>• Lean ground beef (96/4)</li>
                <li>• Pork tenderloin</li>
                <li>• Bison</li>
                <li>• Venison</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Seafood</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• Any white fish</li>
                <li>• Salmon</li>
                <li>• Shrimp</li>
                <li>• Tuna (1.5 cans)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Other Sources</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 6 egg whites</li>
                <li>• 1.25 cups egg whites</li>
                <li>• 1.5 cups 0% Greek yogurt</li>
                <li>• 1.5 cups 0% cottage cheese</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Fats */}
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Droplets className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">
                  Fats
                </CardTitle>
                <CardDescription>1 Thumb = 1 Portion (~1-2 Tbsp)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Nut Butters</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 2 Tbsp peanut butter</li>
                <li>• 2 Tbsp almond butter</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Oils & Butter</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 1.5 Tbsp coconut oil</li>
                <li>• 1.5 Tbsp olive oil</li>
                <li>• 2 Tbsp grass-fed butter</li>
                <li>• 1.5 Tbsp any cooking oil*</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-1">
                *Avoid vegetable or canola oil
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">Whole Foods</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• ½ medium avocado</li>
                <li>• ¼ cup any nuts</li>
                <li>• 4 Tbsp coffee creamer</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Carbs */}
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Wheat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-orange-600 dark:text-orange-400">
                  Carbs
                </CardTitle>
                <CardDescription>1 Fist = 1 Portion (~1 cup cooked)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Grains</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 1 cup brown rice</li>
                <li>• 1 cup white rice</li>
                <li>• 1 cup quinoa</li>
                <li>• 1 cup pasta</li>
                <li>• ⅔ cup dry rolled oats</li>
                <li>• 3 slices Ezekiel bread</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Starchy Foods</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 1.5 cups mashed sweet potato</li>
                <li>• 1.5 cups mashed red potato</li>
                <li>• 1 cup beans/legumes</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Fruits</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• 1 piece of fruit</li>
                <li>• 1.5 cups any berries</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Veggies */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Salad className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-600 dark:text-green-400">
                  Veggies
                </CardTitle>
                <CardDescription>1 Fist = 1 Portion (eat freely!)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2 text-green-600 dark:text-green-400">
                Go for green & leafy
              </p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• Spinach</li>
                <li>• Kale</li>
                <li>• Lettuce</li>
                <li>• Broccoli</li>
                <li>• Asparagus</li>
                <li>• Green beans</li>
                <li>• Peppers</li>
                <li>• Cucumbers</li>
                <li>• Zucchini</li>
                <li>• Celery</li>
                <li>• Cauliflower</li>
                <li>• Cabbage</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2 text-red-500">
                Avoid starchy veggies (count as carbs)
              </p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <li>• Peas</li>
                <li>• Carrots</li>
                <li>• Corn</li>
                <li>• Squash</li>
                <li>• Eggplant</li>
                <li>• Pumpkin</li>
                <li>• Beets</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Junk */}
      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Cookie className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-purple-600 dark:text-purple-400">
                Junk
              </CardTitle>
              <CardDescription>
                1 Fist = 1 Portion — Track honestly, no judgment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The &quot;junk&quot; category is for anything that doesn&apos;t fit
            neatly into the other categories—processed foods, sweets, fried
            foods, etc. The goal isn&apos;t to eliminate these entirely, but to
            be aware of how much you&apos;re eating.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
            <span>• Chips & crackers</span>
            <span>• Cookies & candy</span>
            <span>• Ice cream</span>
            <span>• Pizza</span>
            <span>• Burgers</span>
            <span>• Fried foods</span>
            <span>• Pastries</span>
            <span>• Sugary drinks</span>
          </div>
        </CardContent>
      </Card>

      {/* Zero Calorie Section */}
      <Card>
        <CardHeader>
          <CardTitle>Free Foods (0 Calories)</CardTitle>
          <CardDescription>
            These don&apos;t count toward your portions—use freely!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="font-medium mb-2">Condiments</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mustard</li>
                <li>• Soy sauce</li>
                <li>• Lemon juice</li>
                <li>• Balsamic vinegar</li>
                <li>• Hot sauces</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Spices</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All dry spices</li>
                <li>• Dry seasonings</li>
                <li>• Dry rubs</li>
                <li>• Salt & pepper</li>
                <li>• Mrs. Dash spices</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Beverages</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Water</li>
                <li>• Green tea</li>
                <li>• Black coffee</li>
                <li>• Unsweetened iced tea</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Pro Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Don&apos;t overthink it.</strong>{" "}
            The goal is 80% accuracy, not perfection. A rough estimate is better
            than not tracking at all.
          </p>
          <p>
            <strong className="text-foreground">When in doubt, round up.</strong>{" "}
            If you&apos;re unsure whether something is 1 or 1.5 portions, go with
            the higher number.
          </p>
          <p>
            <strong className="text-foreground">Take photos.</strong> They help
            you remember what you ate and make it easier to share with a trainer
            for feedback.
          </p>
          <p>
            <strong className="text-foreground">Your hands scale with you.</strong>{" "}
            Bigger person = bigger hands = appropriately larger portions. The
            system adjusts automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
