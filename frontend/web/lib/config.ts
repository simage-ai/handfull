/**
 * Typed environment variable access
 * Centralizes all env var access with validation
 */

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || "";
}

// Public constants (not secrets)
export const GITHUB_REPO_URL = "https://github.com/simage-ai/handfull";

export const config = {
  // Database
  databaseUrl: () => getEnvVar("DATABASE_URL"),

  // Auth
  authSecret: () => getEnvVar("AUTH_SECRET"),
  authGoogleId: () => getEnvVar("AUTH_GOOGLE_ID"),
  authGoogleSecret: () => getEnvVar("AUTH_GOOGLE_SECRET"),
  authUrl: () => getEnvVar("AUTH_URL", false) || "http://localhost:3000",

  // GCS
  gcsBucketName: () => getEnvVar("GCS_BUCKET_NAME"),
  gcpServiceAccountKey: () => getEnvVar("GCP_SERVICE_ACCOUNT_KEY", false),

  // Email (Resend)
  resendApiKey: () => getEnvVar("RESEND_API_KEY", false),
  emailFrom: () =>
    getEnvVar("EMAIL_FROM", false) || "HandFull <noreply@handfull.example.com>",

  // App
  appUrl: () =>
    getEnvVar("NEXT_PUBLIC_APP_URL", false) || "http://localhost:3000",
} as const;
