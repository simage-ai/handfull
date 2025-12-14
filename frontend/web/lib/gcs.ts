import { Storage, Bucket } from "@google-cloud/storage";

let _storage: Storage | null = null;
let _bucket: Bucket | null = null;

function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage(
      process.env.GCP_SERVICE_ACCOUNT_KEY
        ? {
            credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY),
          }
        : undefined // Falls back to GOOGLE_APPLICATION_CREDENTIALS or ambient creds
    );
  }
  return _storage;
}

function getBucket(): Bucket {
  if (!_bucket) {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME environment variable is not set");
    }
    _bucket = getStorage().bucket(bucketName);
  }
  return _bucket;
}

/**
 * Upload a file to GCS and return the gs:// path
 */
export async function uploadMealImage(
  userId: string,
  mealId: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const extension = contentType.split("/")[1] || "jpg";
  const gcsPath = `meals/${userId}/${mealId}/${filename}.${extension}`;

  await bucket.file(gcsPath).save(file, {
    contentType,
    metadata: {
      userId,
      mealId,
    },
  });

  return `gs://${bucket.name}/${gcsPath}`;
}

/**
 * Generate a signed URL for viewing a meal image
 */
export async function getSignedImageUrl(gcsPath: string): Promise<string> {
  if (!gcsPath.startsWith("gs://")) {
    throw new Error("Invalid GCS path");
  }

  const bucket = getBucket();
  const filePath = gcsPath.replace(`gs://${bucket.name}/`, "");
  const [url] = await bucket.file(filePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}

/**
 * Delete a meal image from GCS
 */
export async function deleteMealImage(gcsPath: string): Promise<void> {
  if (!gcsPath || !gcsPath.startsWith("gs://")) return;

  const bucket = getBucket();
  const filePath = gcsPath.replace(`gs://${bucket.name}/`, "");
  try {
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw - file might already be deleted
  }
}
