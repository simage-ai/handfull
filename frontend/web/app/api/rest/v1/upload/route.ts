import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadMealImage } from "@/lib/gcs";
import { randomUUID } from "crypto";
import { trackImageStorage, trackApiRequest } from "@/lib/usage-tracking";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mealId = formData.get("mealId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const effectiveMealId = mealId || randomUUID();

    const gcsPath = await uploadMealImage(
      session.user.id,
      effectiveMealId,
      buffer,
      file.type
    );

    // Track usage for the guilt trip widget
    await Promise.all([
      trackImageStorage(session.user.id, file.size),
      trackApiRequest(session.user.id),
    ]);

    return NextResponse.json({ data: { path: gcsPath } }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
