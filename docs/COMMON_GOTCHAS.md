# Common Deployment Gotchas

A collection of issues encountered during deployment to Google Cloud Run and their solutions.

---

## 1. Build-Time Environment Variable Errors

### Problem
Next.js build fails with errors like:
```
Error: STRIPE_SECRET_KEY is not set
DATABASE_URL undefined
```

### Cause
Code that accesses environment variables at module load time (top-level) runs during the build when env vars aren't available.

### Solution
Use lazy initialization patterns. For example, with Stripe:

```typescript
// ❌ BAD - throws at build time
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ✅ GOOD - lazy initialization
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// Proxy for backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
```

---

## 2. Sensitive Data in Logs

### Problem
Credentials appearing in build or runtime logs.

### Cause
Debug console.log statements left in code:
```typescript
console.log("DATABASE_URL", process.env.DATABASE_URL); // Leaks credentials!
```

### Solution
Remove all console.log statements that output sensitive environment variables. Use proper logging libraries in production that can redact secrets.

---

## 3. Cloud Run Traffic Not Routing to New Revisions

### Problem
After deployment, the app still shows old behavior. Checking revisions shows new ones exist but aren't marked as `ACTIVE`.

```bash
$ gcloud run revisions list --service=handfull-web --region=us-central1
   REVISION                ACTIVE
✔  handfull-web-00003-chj          # New but not active
✔  handfull-web-00001-2qq  yes     # Old one still serving
```

### Cause
Cloud Run doesn't automatically route traffic to new revisions if they fail health checks or if traffic routing isn't configured.

### Solution
Add traffic routing to your deployment workflow:

```yaml
- name: Route traffic to latest
  run: |
    gcloud run services update-traffic ${{ env.SERVICE_NAME }} \
      --region=${{ secrets.GCP_REGION }} \
      --to-latest
```

Or manually:
```bash
gcloud run services update-traffic handfull-web \
  --region=us-central1 \
  --to-latest
```

---

## 4. Auth.js (NextAuth v5) Configuration Error

### Problem
Sign-in redirects to `/error?error=Configuration`

### Cause
Auth.js v5 prefers `AUTH_URL` and `AUTH_SECRET` over the legacy `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.

### Solution
Set both variants in your Cloud Run secrets:
```yaml
--set-secrets="\
  AUTH_SECRET=handfull-nextauth-secret:latest,\
  AUTH_URL=handfull-nextauth-url:latest,\
  NEXTAUTH_SECRET=handfull-nextauth-secret:latest,\
  NEXTAUTH_URL=handfull-nextauth-url:latest,\
  ..."
```

---

## 5. Google OAuth Redirect URI Mismatch

### Problem
Google sign-in fails with redirect_uri_mismatch error.

### Cause
The Cloud Run URL isn't in the authorized redirect URIs in Google Cloud Console.

### Solution
Add these to your OAuth 2.0 Client ID in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

**Authorized redirect URIs:**
```
https://your-service-xxx.run.app/api/auth/callback/google
```

**Authorized JavaScript origins:**
```
https://your-service-xxx.run.app
```

---

## 6. Secret Manager Updates Not Taking Effect

### Problem
After updating a secret in Secret Manager, the app still uses old values.

### Cause
Cloud Run caches secrets at revision startup. Updating a secret doesn't automatically create a new revision.

### Solution
Force a new revision after updating secrets:

```bash
# Update the secret
echo -n "new-value" | gcloud secrets versions add my-secret --data-file=-

# Force new revision
gcloud run services update handfull-web \
  --region=us-central1 \
  --set-env-vars="DEPLOY_TIMESTAMP=$(date +%s)"

# Route traffic to new revision
gcloud run services update-traffic handfull-web \
  --region=us-central1 \
  --to-latest
```

---

## 7. Custom Domain - Domain Not Verified

### Problem
```
ERROR: The provided domain does not appear to be verified for the current account
```

### Cause
You must verify domain ownership with Google before mapping it to Cloud Run.

### Solution
```bash
# Verify the root domain (covers all subdomains)
gcloud domains verify yourdomain.com
```

This opens Google Search Console. Add the TXT record provided to your DNS, then retry the domain mapping.

---

## 8. Custom Domain - SSL Certificate Not Provisioning

### Problem
Domain mapping created but HTTPS doesn't work. Status shows:
```
message: Waiting for certificate provisioning. You must configure your DNS records...
reason: CertificatePending
```

### Cause 1: Missing DNS Record
The CNAME record isn't configured.

### Solution
Add the required DNS record (usually shown in the domain mapping output):
```
Type: CNAME
Name: subdomain
Value: ghs.googlehosted.com
```

### Cause 2: CAA Record Blocking Google
Your domain has a CAA record that only allows certain certificate authorities.

Check with:
```bash
dig yourdomain.com CAA
```

If you see only `letsencrypt.org` (or others) but not `pki.goog`, Google can't issue certificates.

### Solution
Add a CAA record allowing Google:
```
Type: CAA
Name: @
Value: 0 issue "pki.goog"
```

After adding, delete and recreate the domain mapping:
```bash
gcloud beta run domain-mappings delete \
  --domain=subdomain.yourdomain.com \
  --region=us-central1 \
  --platform=managed --quiet

gcloud beta run domain-mappings create \
  --service=your-service \
  --domain=subdomain.yourdomain.com \
  --region=us-central1 \
  --platform=managed
```

---

## 9. Cloud SQL Connection Issues

### Problem
Database connection fails in Cloud Run.

### Possible Causes & Solutions

**1. Wrong DATABASE_URL format**

Cloud Run uses Unix sockets, not TCP:
```
# ❌ Wrong
postgresql://user:pass@localhost:5432/db

# ✅ Correct
postgresql://user:pass@localhost/db?host=/cloudsql/PROJECT:REGION:INSTANCE
```

**2. Missing Cloud SQL connection**

Ensure `--set-cloudsql-instances` is in your deploy command:
```yaml
--set-cloudsql-instances=${{ secrets.CLOUD_SQL_CONNECTION }}
```

**3. Missing IAM permissions**

Service account needs `roles/cloudsql.client`:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/cloudsql.client"
```

---

## 10. Cloud SQL API Warning

### Problem
```
Skipped validating Cloud SQL API and Cloud SQL Admin API enablement due to an issue contacting the Service Usage API.
```

### Cause
The service account can't query the Service Usage API. This is usually just a warning.

### Solution
Enable the Service Usage API (optional, for cleaner logs):
```bash
gcloud services enable serviceusage.googleapis.com
```

The deployment should still work even with this warning.

---

## Quick Debugging Commands

```bash
# Check Cloud Run logs
gcloud run services logs read SERVICE_NAME --region=REGION --limit=50

# Describe a revision
gcloud run revisions describe REVISION_NAME --region=REGION

# List all revisions
gcloud run revisions list --service=SERVICE_NAME --region=REGION

# Check domain mapping status
gcloud beta run domain-mappings describe \
  --domain=your.domain.com \
  --region=REGION \
  --platform=managed

# Verify DNS propagation
dig your.domain.com CNAME
dig your.domain.com CAA

# Check secret value
gcloud secrets versions access latest --secret=SECRET_NAME
```

---

## Deployment Checklist

Before deploying:
- [ ] No build-time env var access (use lazy initialization)
- [ ] No sensitive data in console.log statements
- [ ] Workflow includes `--to-latest` traffic routing

After deploying:
- [ ] Verify new revision is active: `gcloud run revisions list`
- [ ] Check logs for errors: `gcloud run services logs read`
- [ ] Test the application end-to-end

For custom domains:
- [ ] Domain verified with Google
- [ ] DNS records configured (CNAME to ghs.googlehosted.com)
- [ ] CAA record includes `pki.goog`
- [ ] OAuth redirect URIs updated for new domain
- [ ] Stripe webhook URL updated for new domain
