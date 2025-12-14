# Workload Identity Federation (WIF) Setup Guide

This guide walks through setting up Workload Identity Federation to allow GitHub Actions to authenticate to Google Cloud without service account keys.

## How WIF Works

```
┌─────────────────┐     1. Request token     ┌─────────────────┐
│  GitHub Actions │ ─────────────────────▶   │  GitHub OIDC    │
│    Workflow     │                          │    Provider     │
└─────────────────┘                          └─────────────────┘
        │                                            │
        │                                            │ 2. Issue JWT
        │                                            ▼
        │                                    ┌─────────────────┐
        │   3. Exchange JWT for GCP token    │   Workload ID   │
        └───────────────────────────────────▶│      Pool       │
                                             └─────────────────┘
                                                     │
                                                     │ 4. Impersonate SA
                                                     ▼
                                             ┌─────────────────┐
                                             │    Service      │
                                             │    Account      │
                                             └─────────────────┘
                                                     │
                                                     │ 5. Access GCP
                                                     ▼
                                             ┌─────────────────┐
                                             │  Cloud Run      │
                                             │  Cloud SQL      │
                                             │  GCS, etc.      │
                                             └─────────────────┘
```

**Benefits:**
- No service account keys to manage, rotate, or risk leaking
- Short-lived tokens (1 hour) automatically issued
- Fine-grained access control via attribute conditions
- Audit trail in Cloud Logging

## Prerequisites

- GCP project with billing enabled
- `gcloud` CLI installed and authenticated as project owner
- GitHub repository

## Step-by-Step Setup

### 1. Set Environment Variables

```bash
# Your GCP project ID
export PROJECT_ID="your-gcp-project-id"

# Get the project number (needed for WIF)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Your GitHub org/user and repo
export GITHUB_ORG="your-github-username-or-org"
export GITHUB_REPO="palm"

# Names for WIF resources
export POOL_NAME="github-actions-pool"
export PROVIDER_NAME="github-provider"
export SERVICE_ACCOUNT_NAME="handball-web-deployer"

# Region
export REGION="us-central1"

echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo "GitHub: $GITHUB_ORG/$GITHUB_REPO"
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  --project=$PROJECT_ID
```

### 3. Create Workload Identity Pool

The pool is a container for external identities (like GitHub Actions):

```bash
gcloud iam workload-identity-pools create $POOL_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --description="Pool for GitHub Actions OIDC authentication"
```

Verify creation:
```bash
gcloud iam workload-identity-pools describe $POOL_NAME \
  --project=$PROJECT_ID \
  --location="global"
```

### 4. Create Workload Identity Provider

The provider configures how GitHub's OIDC tokens are validated:

```bash
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --display-name="GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="\
google.subject=assertion.sub,\
attribute.actor=assertion.actor,\
attribute.repository=assertion.repository,\
attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '${GITHUB_ORG}'"
```

**Attribute Mapping Explained:**
| GitHub Claim | Google Attribute | Example Value |
|--------------|------------------|---------------|
| `sub` | `google.subject` | `repo:owner/repo:ref:refs/heads/main` |
| `actor` | `attribute.actor` | `username` |
| `repository` | `attribute.repository` | `owner/repo` |
| `repository_owner` | `attribute.repository_owner` | `owner` |

**Attribute Condition:**
- `assertion.repository_owner == 'your-org'` - Only allow repos from your org/user
- You can make this more restrictive (see [Security Considerations](#security-considerations))

### 5. Create Service Account

Create a service account that GitHub Actions will impersonate:

```bash
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --project=$PROJECT_ID \
  --display-name="HandFull Web Deployer" \
  --description="Service account for deploying HandFull web to Cloud Run"
```

### 6. Grant Service Account Permissions

Grant the permissions needed for deployment:

```bash
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run Admin - deploy services
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Service Account User - use service accounts for Cloud Run
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry Writer - push Docker images
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Cloud SQL Client - connect to Cloud SQL
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"

# Storage Object Admin - manage GCS objects (for image uploads)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

# Secret Manager Accessor - access secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

### 7. Allow GitHub Actions to Impersonate Service Account

This is the key step that connects WIF to the service account:

```bash
# Get the full provider path
WORKLOAD_IDENTITY_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

# Allow the entire repository to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}"
```

**Alternative: Restrict to specific branch**

For tighter security, only allow the `main` branch:

```bash
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/subject/repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/main"
```

### 8. Get Values for GitHub Secrets

Run this to get the values you'll need:

```bash
echo "=== Add these to GitHub Secrets ==="
echo ""
echo "GCP_PROJECT_ID:"
echo "$PROJECT_ID"
echo ""
echo "GCP_REGION:"
echo "$REGION"
echo ""
echo "GCP_WIF_PROVIDER:"
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo ""
echo "GCP_SERVICE_ACCOUNT:"
echo "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
```

### 9. Add GitHub Secrets

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your project ID |
| `GCP_REGION` | `us-central1` (or your region) |
| `GCP_WIF_PROVIDER` | `projects/PROJECT_NUM/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `handball-web-deployer@PROJECT_ID.iam.gserviceaccount.com` |
| `CLOUD_SQL_CONNECTION` | `project:region:instance` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` or `pk_test_xxx` |

## Security Considerations

### Tighten Attribute Conditions

The default condition allows any repo in your org. Restrict to specific repos:

```bash
# Only this specific repository
--attribute-condition="assertion.repository == '${GITHUB_ORG}/${GITHUB_REPO}'"

# Only main branch of this repository
--attribute-condition="assertion.repository == '${GITHUB_ORG}/${GITHUB_REPO}' && assertion.ref == 'refs/heads/main'"
```

### Principle of Least Privilege

Only grant the permissions the service account actually needs:

| Permission | Needed For |
|------------|------------|
| `roles/run.admin` | Deploy Cloud Run services |
| `roles/iam.serviceAccountUser` | Attach SA to Cloud Run |
| `roles/artifactregistry.writer` | Push Docker images |
| `roles/cloudsql.client` | Connect to Cloud SQL |
| `roles/storage.objectAdmin` | Upload images to GCS |
| `roles/secretmanager.secretAccessor` | Access secrets |

If you don't need all of these, remove them.

### Audit Logging

Enable audit logging for the service account:

1. GCP Console → IAM & Admin → Audit Logs
2. Enable Data Access logs for:
   - Cloud Run Admin Activity
   - Cloud SQL Admin Activity
   - Cloud Storage Data Access

## Verification

### Test WIF Configuration

Create a test workflow:

```yaml
# .github/workflows/test-wif.yml
name: Test WIF

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Test Authentication
        run: |
          echo "Authenticated as:"
          gcloud auth list
          echo ""
          echo "Project:"
          gcloud config get-value project
          echo ""
          echo "Testing Cloud Run access:"
          gcloud run services list --region=${{ secrets.GCP_REGION }} || echo "No services yet"
```

Run it manually from GitHub Actions → Test WIF → Run workflow.

## Troubleshooting

### "Unable to generate access token"

Check:
1. Service account exists and has `workloadIdentityUser` binding
2. WIF provider is configured correctly
3. GitHub secrets have correct values
4. Repository matches the attribute condition

```bash
# Verify service account bindings
gcloud iam service-accounts get-iam-policy $SA_EMAIL --project=$PROJECT_ID
```

### "Permission denied" on deployment

Check:
1. Service account has required roles
2. Roles are granted at project level

```bash
# List all roles for the service account
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
  --format="table(bindings.role)"
```

### "Attribute condition not met"

Check:
1. Repository owner matches exactly (case-sensitive)
2. If restricting to branch, ensure workflow runs from that branch

```bash
# View provider configuration
gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL_NAME
```

## Cleanup

If you need to remove WIF configuration:

```bash
# Delete provider
gcloud iam workload-identity-pools providers delete $PROVIDER_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL_NAME

# Delete pool
gcloud iam workload-identity-pools delete $POOL_NAME \
  --project=$PROJECT_ID \
  --location="global"

# Delete service account
gcloud iam service-accounts delete $SA_EMAIL --project=$PROJECT_ID
```

## References

- [Google Cloud WIF Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [google-github-actions/auth](https://github.com/google-github-actions/auth)
