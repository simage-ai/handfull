import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage(
      process.env.GCP_SERVICE_ACCOUNT_KEY
        ? {
            credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY),
          }
        : undefined
    );
  }
  return _storage;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    return NextResponse.json(
      { error: "GCS not configured" },
      { status: 500 }
    );
  }

  const filePath = path.join("/");

  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || "image/jpeg";

    const [buffer] = await file.download();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
