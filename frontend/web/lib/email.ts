import { Resend } from "resend";
import { config } from "./config";

// Initialize Resend client (lazy to avoid errors if API key not set)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = config.resendApiKey();
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - emails will be logged only");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();
  const from = config.emailFrom();

  if (!client) {
    // Development fallback - log email content
    console.log("=".repeat(60));
    console.log("EMAIL (Development Mode - Not Sent)");
    console.log("=".repeat(60));
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("-".repeat(60));
    console.log(text || html);
    console.log("=".repeat(60));
    return { success: true };
  }

  try {
    const result = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("Failed to send email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", message);
    return { success: false, error: message };
  }
}

// Follow request email templates
interface FollowEmailParams {
  requesterName: string;
  requesterEmail: string;
  targetEmail: string;
  token: string;
}

export async function sendFollowRequestEmail({
  requesterName,
  requesterEmail,
  targetEmail,
  token,
}: FollowEmailParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = config.appUrl();
  const acceptUrl = `${appUrl}/follow/${token}`;

  const subject = `${requesterName} wants to follow your meal log`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Follow Request</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        <strong>${requesterName}</strong> (${requesterEmail}) would like to follow your meal log on Palm.
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        If you accept, they will be able to see your meals in their feed.
      </p>
      <div style="margin: 32px 0;">
        <a href="${acceptUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          View Request
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This link expires in 7 days. If you don't recognize this request, you can ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        Palm - Meal Tracking Made Simple
      </p>
    </div>
  `;

  const text = `
Follow Request

${requesterName} (${requesterEmail}) would like to follow your meal log on Palm.

If you accept, they will be able to see your meals in their feed.

View and respond to this request:
${acceptUrl}

This link expires in 7 days. If you don't recognize this request, you can ignore this email.
  `.trim();

  return sendEmail({ to: targetEmail, subject, html, text });
}

export async function sendFollowInviteEmail({
  requesterName,
  requesterEmail,
  targetEmail,
  token,
}: FollowEmailParams): Promise<{ success: boolean; error?: string }> {
  const appUrl = config.appUrl();
  const acceptUrl = `${appUrl}/follow/${token}`;

  const subject = `${requesterName} invited you to follow their meal log`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Follow Invitation</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        <strong>${requesterName}</strong> (${requesterEmail}) has invited you to follow their meal log on Palm.
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        If you accept, you'll be able to see their meals in your feed.
      </p>
      <div style="margin: 32px 0;">
        <a href="${acceptUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This link expires in 7 days. If you don't recognize this invitation, you can ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        Palm - Meal Tracking Made Simple
      </p>
    </div>
  `;

  const text = `
Follow Invitation

${requesterName} (${requesterEmail}) has invited you to follow their meal log on Palm.

If you accept, you'll be able to see their meals in your feed.

Accept this invitation:
${acceptUrl}

This link expires in 7 days. If you don't recognize this invitation, you can ignore this email.
  `.trim();

  return sendEmail({ to: targetEmail, subject, html, text });
}

// Generate a secure random token
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}
