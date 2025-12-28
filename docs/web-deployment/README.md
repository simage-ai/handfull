# HandFull Web Deployment Guide

Deployment guide for the Next.js web application to Google Cloud Run using GitHub Actions and Workload Identity Federation (WIF).

> **Note**: This guide is specifically for the **web application** (`frontend/web`). Mobile deployment will have separate documentation.

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  GitHub Actions │─WIF─▶│   Google Cloud   │      │                 │
│    (CI/CD)      │      │      Run         │◀────▶│   Cloud SQL     │
└─────────────────┘      └──────────────────┘      │   (PostgreSQL)  │
                                │                  └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Cloud Storage   │
                         │    (Images)      │
                         └──────────────────┘
```

**Key Benefits:**
- **No service account keys** - WIF provides keyless authentication
- **Private networking** - Cloud Run connects to Cloud SQL via built-in proxy
- **IAM-based access** - GCS access via service account, no keys in code
- **Auto-scaling** - Scale to zero or set minimum instances

## Prerequisites

- GCP Project with billing enabled
- GitHub repository
- `gcloud` CLI installed locally
- Docker installed locally (for testing)

## Documentation Structure

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file - overview and quick start |
| [WIF_SETUP.md](./WIF_SETUP.md) | Workload Identity Federation setup |
| [DOCKERFILE.md](./DOCKERFILE.md) | Dockerfile explanation |
| [../backend/GCP_POSTGRES_DEPLOYMENT.md](../../backend/GCP_POSTGRES_DEPLOYMENT.md) | Cloud SQL PostgreSQL setup |

## Quick Start

### 1. Set Up GCP Infrastructure

```bash
# Set your project
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
```

**Required GCP Services:**
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com
```

### 2. Set Up Cloud SQL

Follow the [Cloud SQL PostgreSQL Deployment Guide](../../backend/GCP_POSTGRES_DEPLOYMENT.md) to:
- Create a Cloud SQL instance
- Create the database and user
- Note down the connection name (format: `project:region:instance`)

### 3. Set Up Workload Identity Federation

Follow [WIF_SETUP.md](./WIF_SETUP.md) to:
- Create Workload Identity Pool
- Create GitHub Provider
- Create and configure Service Account
- Add GitHub secrets

### 4. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create handfull-web \
  --repository-format=docker \
  --location=$REGION \
  --description="HandFull web application images"
```

### 5. Set Up Secrets in Secret Manager

```bash
# Database URL
echo -n "postgresql://user:pass@localhost/db?host=/cloudsql/PROJECT:REGION:INSTANCE" | \
  gcloud secrets create handfull-database-url --data-file=-

# NextAuth Secret
openssl rand -base64 32 | \
  gcloud secrets create handfull-nextauth-secret --data-file=-

# NextAuth URL
echo -n "https://your-cloud-run-url.run.app" | \
  gcloud secrets create handfull-nextauth-url --data-file=-

# Google OAuth credentials
echo -n "your-google-client-id" | \
  gcloud secrets create handfull-google-client-id --data-file=-

echo -n "your-google-client-secret" | \
  gcloud secrets create handfull-google-client-secret --data-file=-

# Stripe keys
echo -n "sk_live_xxx" | \
  gcloud secrets create handfull-stripe-secret-key --data-file=-

echo -n "whsec_xxx" | \
  gcloud secrets create handfull-stripe-webhook-secret --data-file=-

# GCS Bucket
echo -n "your-bucket-name" | \
  gcloud secrets create handfull-gcs-bucket --data-file=-

# Resend Email variables
echo -n "RESEND_API_KEY" | \
  gcloud secrets create handfull-resend-api-key --data-file=-

echo -n "noreply@notifications.simage.ai" | \
  gcloud secrets create handfull-resend-email-from --data-file=-

```

Grant the service account access to secrets:
```bash
export SA_EMAIL="handfull-web-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

for secret in handfull-database-url handfull-nextauth-secret handfull-nextauth-url \
  handfull-google-client-id handfull-google-client-secret \
  handfull-stripe-secret-key handfull-stripe-webhook-secret handfull-gcs-bucket \
  handfull-resend-api-key handfull-resend-email-from; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 6. Add GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_REGION` | e.g., `us-central1` |
| `GCP_WIF_PROVIDER` | `projects/PROJECT_NUM/locations/global/workloadIdentityPools/POOL/providers/PROVIDER` |
| `GCP_SERVICE_ACCOUNT` | `handfull-web-deployer@PROJECT_ID.iam.gserviceaccount.com` |
| `CLOUD_SQL_CONNECTION` | `project:region:instance` |

### 7. Copy Deployment Files

Copy the following files to your repository:

```bash
# Dockerfile
cp docs/web-deployment/Dockerfile frontend/web/Dockerfile

# GitHub Actions workflow
mkdir -p .github/workflows
cp docs/web-deployment/deploy-web.yml .github/workflows/deploy-web.yml
```

### 8. Deploy

Push to `main` branch or manually trigger the workflow:

```bash
git add .
git commit -m "Add Cloud Run deployment"
git push origin main
```

## Environment Variables

The Cloud Run service uses these environment variables (pulled from Secret Manager):

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Secret Manager |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Secret Manager |
| `NEXTAUTH_URL` | Public URL of the app | Secret Manager |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Secret Manager |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Secret Manager |
| `STRIPE_SECRET_KEY` | Stripe secret key | Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Secret Manager |
| `GCS_BUCKET_NAME` | GCS bucket for images | Secret Manager |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Build arg |
| `NEXT_PUBLIC_APP_URL` | Public app URL for emails/links | Build arg (hardcoded) |
| `RESEND_API_KEY` | Resend API key to send emails | Secret Manager |
| `EMAIL_FROM` | Resend email address that all emails will be sent from | Secret Manager |


## Local Testing

### Build and run locally:

```bash
cd frontend/web

# Build the image
docker build -t handfull-web .

# Run with local env vars
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="test-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  handfull-web
```

### Test with Cloud SQL Auth Proxy:

```bash
# Start Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE &

# Run container with proxy connection
docker run -p 3000:3000 \
  --network host \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/db" \
  handfull-web
```

## Monitoring

### View Logs

```bash
gcloud run services logs read handfull-web --region=$REGION
```

### Cloud Console

- **Cloud Run**: Console → Cloud Run → handfull-web
- **Logs**: Console → Logging → Select Cloud Run service
- **Metrics**: Console → Monitoring → Dashboards

## Troubleshooting

### Common Issues

**1. Container fails to start**
```bash
# Check logs
gcloud run services logs read handfull-web --region=$REGION --limit=50
```

**2. Database connection fails**
- Verify Cloud SQL connection name is correct
- Check service account has `roles/cloudsql.client`
- Ensure database URL format uses socket: `?host=/cloudsql/PROJECT:REGION:INSTANCE`

**3. Secrets not accessible**
- Verify service account has `roles/secretmanager.secretAccessor`
- Check secret names match exactly

**4. WIF authentication fails**
- Verify GitHub repository matches the attribute condition
- Check Workload Identity Pool and Provider configuration
- Ensure service account has Workload Identity User binding

### Useful Commands

```bash
# List Cloud Run services
gcloud run services list

# Describe service
gcloud run services describe handfull-web --region=$REGION

# Get service URL
gcloud run services describe handfull-web --region=$REGION --format='value(status.url)'

# View revisions
gcloud run revisions list --service=handfull-web --region=$REGION

# Rollback to previous revision
gcloud run services update-traffic handfull-web \
  --region=$REGION \
  --to-revisions=REVISION_NAME=100
```

## Cost Estimation

| Component | Estimated Cost |
|-----------|----------------|
| Cloud Run (low traffic) | $0-10/month |
| Cloud SQL (db-g1-small) | $25-35/month |
| Cloud Storage | $1-5/month |
| Artifact Registry | $1-3/month |
| Secret Manager | < $1/month |
| **Total** | **~$30-55/month** |

*Costs vary based on usage. Cloud Run can scale to zero for minimal charges during low traffic.*
