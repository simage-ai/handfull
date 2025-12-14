# GCP Cloud SQL PostgreSQL Deployment Guide

A comprehensive guide for deploying and managing a PostgreSQL instance on Google Cloud Platform for HandFull.

## Table of Contents

1. [Instance Selection](#instance-selection)
2. [Creating the Instance](#creating-the-instance)
3. [Configuration Best Practices](#configuration-best-practices)
4. [Local Development Setup](#local-development-setup)
5. [Connecting from Cloud Run](#connecting-from-cloud-run)
6. [Security Best Practices](#security-best-practices)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Performance Tuning](#performance-tuning)
10. [Cost Optimization](#cost-optimization)
11. [Maintenance Operations](#maintenance-operations)

---

## Instance Selection

### Recommended Starting Configuration

For HandFull's current scale (meal tracking app with users, meals, plans, contributions):

| Setting | Recommendation | Rationale |
|---------|----------------|-----------|
| **PostgreSQL Version** | 16 | Latest stable, matches local dev |
| **Edition** | Enterprise | Better performance, more features |
| **Machine Type** | `db-f1-micro` or `db-g1-small` | Start small, scale as needed |
| **vCPUs** | 1 shared | Sufficient for < 1000 daily users |
| **Memory** | 0.6 - 1.7 GB | Adequate for your schema |
| **Storage** | 10 GB SSD | Start small, auto-grow enabled |
| **Region** | Same as Vercel deployment | Minimize latency |

### Instance Tiers Overview

```
db-f1-micro    →  $7-10/month   →  Hobby/Dev (< 100 users)
db-g1-small    →  $25-35/month  →  Small Production (100-1000 users)
db-custom-1-4  →  $50-70/month  →  Growing Production (1000-10000 users)
db-custom-2-8  →  $100-140/month → Established Production (10000+ users)
```

### When to Scale Up

Monitor these metrics and scale when:
- CPU utilization consistently > 70%
- Memory utilization consistently > 80%
- Connection count approaching limit
- Query latency increasing

---

## Creating the Instance

### Via GCP Console (UI)

1. **Navigate to Cloud SQL**
   - GCP Console → SQL → Create Instance → PostgreSQL

2. **Basic Configuration**
   ```
   Instance ID: handfull-prod (or handfull-staging)
   Password: [Generate strong password, save in Secret Manager]
   Database version: PostgreSQL 16
   Cloud SQL Edition: Enterprise
   ```

3. **Choose Region & Zonal Availability**
   ```
   Region: us-central1 (or closest to your Vercel region)
   Zonal availability: Single zone (cost-effective for starting)

   # For production with HA later:
   Zonal availability: Multiple zones (automatic failover)
   ```

4. **Machine Configuration**
   ```
   Machine shapes: Shared core
   Machine type: db-f1-micro (start) or db-g1-small (recommended)
   ```

5. **Storage**
   ```
   Storage type: SSD
   Storage capacity: 10 GB
   Enable automatic storage increases: Yes
   ```

6. **Connections**
   ```
   Instance IP assignment: Private IP + Public IP
   # Or just Public IP with authorized networks for simpler setup
   ```

7. **Data Protection**
   ```
   Automate backups: Yes
   Enable point-in-time recovery: Yes
   Backup retention: 7 days (adjust based on needs)
   ```

8. **Maintenance**
   ```
   Maintenance window: Sunday 3:00 AM - 4:00 AM (your local time)
   Order of update: Later (more stable)
   ```

---

## Configuration Best Practices

### Database Flags (Set in Console → Instance → Edit → Flags)

```yaml
# Connection Management
max_connections: 100  # Default is fine for small instances

# Memory Settings (adjust based on instance size)
shared_buffers: 256MB  # ~25% of available RAM for small instances
effective_cache_size: 512MB  # ~50% of available RAM

# Query Planning
random_page_cost: 1.1  # Lower for SSD storage
effective_io_concurrency: 200  # Higher for SSD

# Logging (for debugging, disable in production for performance)
log_min_duration_statement: 1000  # Log queries > 1 second
log_connections: off
log_disconnections: off

# Autovacuum (usually defaults are fine)
autovacuum: on
```

### Create the Database and User

After instance creation, connect via Cloud Shell or local `psql`:

```sql
-- Create the application database
CREATE DATABASE handfull_prod;

-- Create application user (don't use postgres superuser)
CREATE USER handfull_app WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE handfull_prod TO handfull_app;

-- Connect to the database and set up schema permissions
\c handfull_prod
GRANT ALL ON SCHEMA public TO handfull_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO handfull_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO handfull_app;
```

---

## Local Development Setup

Connect to your Cloud SQL instance from your local machine for development and testing.

### Option 1: Cloud SQL Auth Proxy (Recommended)

The Cloud SQL Auth Proxy provides secure access without needing to whitelist IPs. It authenticates using your `gcloud` credentials.

**Install the proxy:**

```bash
# macOS (Apple Silicon)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# macOS (Intel)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Or via Homebrew
brew install cloud-sql-proxy

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

**Authenticate with GCP:**

```bash
gcloud auth application-default login
```

**Start the proxy:**

```bash
# Replace with your instance connection name
# Format: PROJECT_ID:REGION:INSTANCE_NAME
./cloud-sql-proxy PROJECT_ID:us-central1:handfull-prod --port=5432

# Or if port 5432 is in use (e.g., local Docker postgres)
./cloud-sql-proxy PROJECT_ID:us-central1:handfull-prod --port=5433
```

**Configure your local environment:**

```bash
# frontend/web/.env.local
DATABASE_URL="postgresql://handfull_app:YOUR_PASSWORD@localhost:5432/handfull_prod"

# If using port 5433
DATABASE_URL="postgresql://handfull_app:YOUR_PASSWORD@localhost:5433/handfull_prod"
```

**Run your app:**

```bash
cd frontend/web
pnpm dev
```

### Option 2: Whitelist Your IP (Simpler, Less Secure)

If you prefer direct access without running the proxy:

**1. Get your public IP:**

```bash
curl ifconfig.me
```

**2. Add to authorized networks:**

- GCP Console → SQL → Your instance → Connections → Networking
- Under "Authorized networks", click "Add a network"
- Name: `My Home` (or descriptive name)
- Network: `YOUR_IP/32` (e.g., `203.0.113.42/32`)
- Click Save

**3. Configure your local environment:**

```bash
# frontend/web/.env.local
DATABASE_URL="postgresql://handfull_app:YOUR_PASSWORD@CLOUD_SQL_PUBLIC_IP:5432/handfull_prod?sslmode=require"
```

> **Note:** Your home IP may change periodically. You'll need to update the authorized network when this happens. The Cloud SQL Auth Proxy (Option 1) avoids this issue.

### Switching Between Local and Cloud Databases

You can maintain multiple environment files:

```bash
# .env.local - Local Docker database (default for dev)
DATABASE_URL="postgresql://postgres:changeme@localhost:5433/palm_db"

# .env.cloud - Cloud SQL via proxy
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod"
```

To use Cloud SQL locally:

```bash
# Terminal 1: Start the proxy
./cloud-sql-proxy PROJECT_ID:us-central1:handfull-prod --port=5432

# Terminal 2: Run with cloud env
cp .env.cloud .env.local
pnpm dev
```

### Running Prisma Commands Against Cloud SQL

```bash
# With proxy running on port 5432
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod" npx prisma db push

# Generate client
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod" npx prisma generate

# Open Prisma Studio
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod" npx prisma studio

# Run migrations
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod" npx prisma migrate deploy
```

### Troubleshooting Local Connection

**Proxy fails to start:**
```bash
# Check you're authenticated
gcloud auth application-default login

# Verify instance name
gcloud sql instances list
```

**Connection refused:**
```bash
# Check proxy is running
ps aux | grep cloud-sql-proxy

# Check correct port
lsof -i :5432
```

**SSL errors with direct connection:**
```bash
# Ensure sslmode=require in connection string
DATABASE_URL="...?sslmode=require"
```

**Permission denied:**
```bash
# Verify user has access to database
gcloud sql connect handfull-prod --user=postgres --database=handfull_prod

# Then check grants
\du handfull_app
```

---

## Connecting from Cloud Run

Cloud Run has built-in support for Cloud SQL connections via Unix sockets. This is the recommended approach.

### Cloud Run with Built-in Cloud SQL Connection (Recommended)

When you deploy to Cloud Run with `--set-cloudsql-instances`, Cloud Run automatically:
- Runs the Cloud SQL Auth Proxy as a sidecar
- Creates a Unix socket at `/cloudsql/PROJECT:REGION:INSTANCE`
- Handles authentication via the service account

**Connection String Format for Cloud Run:**

```bash
# Unix socket connection (used by Cloud Run)
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost/handfull_prod?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"

# Example
DATABASE_URL="postgresql://handfull_app:mypassword@localhost/handfull_prod?host=/cloudsql/my-project:us-central1:handfull-prod"
```

**Deploy command with Cloud SQL:**

```bash
gcloud run deploy handfull-web \
  --image=IMAGE_URL \
  --region=us-central1 \
  --set-cloudsql-instances=PROJECT_ID:us-central1:handfull-prod \
  --set-secrets=DATABASE_URL=handfull-database-url:latest \
  --service-account=handfull-web-deployer@PROJECT_ID.iam.gserviceaccount.com
```

**Required IAM Role:**

The Cloud Run service account needs:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:handfull-web-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Store Connection String in Secret Manager

```bash
# Create the secret with Unix socket connection string
echo -n "postgresql://handfull_app:PASSWORD@localhost/handfull_prod?host=/cloudsql/PROJECT_ID:us-central1:handfull-prod" | \
  gcloud secrets create handfull-database-url --data-file=-

# Grant access to the service account
gcloud secrets add-iam-policy-binding handfull-database-url \
  --member="serviceAccount:handfull-web-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Connection Pooling for Serverless

Cloud SQL doesn't have built-in connection pooling. For Cloud Run, manage connections via:

**Option 1: Limit connections in Prisma (Simplest)**

```bash
# Add connection_limit to your DATABASE_URL
DATABASE_URL="postgresql://...?host=/cloudsql/...&connection_limit=5"
```

With Cloud Run settings of `--max-instances=10` and `connection_limit=5`:
- Max connections = 10 × 5 = 50 (under the 100 default limit)

**Option 2: Prisma Accelerate (Managed pooling)**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Accelerate URL (pooled)
  directUrl = env("DIRECT_DATABASE_URL") // Direct for migrations
}
```

### Prisma Configuration

Your `schema.prisma` works as-is:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

For production, the `DATABASE_URL` will be the Unix socket connection string stored in Secret Manager.

---

## Security Best Practices

### 1. Network Security

```yaml
# Minimum required:
- Enable SSL/TLS (require_ssl = on)
- Use authorized networks (not 0.0.0.0/0 in production)
- Consider Private IP for production

# In Cloud SQL Console:
Instance → Connections → Security:
  - Allow only SSL connections: Yes
  - Require trusted client certificates: Optional (adds complexity)
```

### 2. Authentication

```sql
-- Never use default postgres user for app connections
-- Create role with minimum required privileges

CREATE ROLE handfull_app WITH
  LOGIN
  PASSWORD 'strong_password_here'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE;

-- Grant only what's needed
GRANT CONNECT ON DATABASE handfull_prod TO handfull_app;
GRANT USAGE ON SCHEMA public TO handfull_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO handfull_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO handfull_app;
```

### 3. Secrets Management

Store credentials in GCP Secret Manager:

```bash
# Create secret
gcloud secrets create handfull-db-password \
  --data-file=./password.txt

# Access in your app via environment variable in Vercel
# Or use GCP Secret Manager client library
```

### 4. Audit Logging

Enable in Cloud SQL:
- Instance → Edit → Flags
- Add: `log_connections: on`, `log_disconnections: on`
- Or use Cloud Audit Logs for compliance

---

## Backup & Recovery

### Automated Backups

Configure in Console → Instance → Backups:

```yaml
Automated backups:
  Enabled: Yes
  Backup window: 02:00 - 06:00 (low traffic period)
  Retention: 7-30 days depending on needs

Point-in-time recovery:
  Enabled: Yes
  Log retention: 7 days
```

### Manual Backup (Before Major Changes)

```bash
# Via gcloud CLI
gcloud sql backups create \
  --instance=handfull-prod \
  --description="Pre-migration backup"

# List backups
gcloud sql backups list --instance=handfull-prod
```

### Export to Cloud Storage (Long-term Archive)

```bash
# Export to GCS bucket
gcloud sql export sql handfull-prod \
  gs://your-bucket/backups/handfull-$(date +%Y%m%d).sql \
  --database=handfull_prod
```

### Restore Procedures

```bash
# Restore from automated backup
gcloud sql backups restore BACKUP_ID \
  --restore-instance=handfull-prod

# Point-in-time recovery
gcloud sql instances clone handfull-prod handfull-prod-recovery \
  --point-in-time="2024-01-15T10:00:00.000Z"
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Utilization | > 70% | > 90% | Scale up instance |
| Memory Utilization | > 80% | > 95% | Scale up or optimize queries |
| Disk Utilization | > 70% | > 85% | Increase storage |
| Connections | > 80% of max | > 95% | Increase max_connections or pool |
| Replication Lag | > 1s | > 5s | Check replica health |

### Set Up Cloud Monitoring Alerts

1. **Go to**: Cloud Console → Monitoring → Alerting → Create Policy

2. **Create alerts for**:
   ```yaml
   - CPU utilization > 80% for 5 minutes
   - Memory utilization > 85% for 5 minutes
   - Disk utilization > 80%
   - Database connections > 80 (if max is 100)
   ```

3. **Notification channels**:
   - Email
   - Slack webhook
   - PagerDuty (for critical)

### Query Performance Insights

Enable in Console → Instance → Query Insights:
- Identifies slow queries
- Shows query patterns
- Helps optimize indexes

### Custom Dashboard

Create a Cloud Monitoring dashboard with:
- CPU, Memory, Disk utilization
- Active connections
- Read/Write operations
- Query latency (P50, P95, P99)

---

## Performance Tuning

### Indexing Strategy for HandFull Schema

Based on your Prisma schema, ensure these indexes exist:

```sql
-- Already in schema (Prisma creates these)
-- users.email (unique)
-- users.stripe_customer_id (unique)
-- meals(user_id, date_time)

-- Additional recommended indexes
CREATE INDEX CONCURRENTLY idx_meals_user_date
  ON meals(user_id, date_time DESC);

CREATE INDEX CONCURRENTLY idx_contributions_user_created
  ON contributions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_meals_date_time
  ON meals(date_time DESC);
```

### Connection Pooling

For serverless (Vercel), implement connection pooling:

**Option 1: Prisma Accelerate** (Recommended for Prisma users)
```bash
# In Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations
}
```

**Option 2: PgBouncer** (Self-managed)
- Deploy PgBouncer on Cloud Run or GCE
- Connect app to PgBouncer, PgBouncer to Cloud SQL

### Query Optimization

Monitor slow queries and optimize:

```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM meals
WHERE user_id = 'xxx'
AND date_time > NOW() - INTERVAL '7 days';
```

---

## Cost Optimization

### Right-Sizing

```bash
# Check current utilization before scaling
gcloud sql instances describe handfull-prod \
  --format="value(settings.tier)"

# Scale down if underutilized
gcloud sql instances patch handfull-prod \
  --tier=db-f1-micro
```

### Cost-Saving Strategies

1. **Start Small**: Begin with `db-f1-micro` (~$7/month)

2. **Use Committed Use Discounts**: 1-3 year commits save 25-52%

3. **Storage Optimization**:
   - Enable automatic storage increases
   - Start with minimum needed
   - Clean up old data periodically

4. **Development Instance**:
   - Use smallest tier for staging
   - Stop instance when not in use:
   ```bash
   gcloud sql instances patch handfull-staging --activation-policy=NEVER
   ```

5. **Regional vs Multi-Regional**:
   - Single zone for dev/staging
   - Multi-zone only when HA is critical

### Estimated Monthly Costs

```
Development:
  db-f1-micro, 10GB SSD, single zone
  ~$10-15/month

Small Production:
  db-g1-small, 20GB SSD, single zone
  ~$35-50/month

Production with HA:
  db-custom-1-4, 50GB SSD, multi-zone
  ~$100-150/month
```

---

## Maintenance Operations

### Regular Maintenance Tasks

```bash
# Weekly: Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

# Monthly: Update table statistics
ANALYZE;

# Monthly: Check table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Running Migrations

```bash
# 1. Create backup first
gcloud sql backups create --instance=handfull-prod

# 2. Run migration
cd frontend/web
DATABASE_URL="production_url" npx prisma migrate deploy

# 3. Verify
DATABASE_URL="production_url" npx prisma db pull
```

### Version Upgrades

1. **Test in staging first**
2. **Schedule during maintenance window**
3. **Create backup before upgrade**

```bash
# Check available versions
gcloud sql instances describe handfull-prod \
  --format="value(databaseVersion)"

# Upgrade (causes brief downtime)
gcloud sql instances patch handfull-prod \
  --database-version=POSTGRES_16
```

### Disaster Recovery Checklist

1. **Document**:
   - [ ] Instance connection details
   - [ ] Backup schedule and retention
   - [ ] Recovery procedures
   - [ ] Escalation contacts

2. **Test quarterly**:
   - [ ] Restore from backup
   - [ ] Point-in-time recovery
   - [ ] Failover (if HA enabled)

---

## Quick Reference

### gcloud Commands

```bash
# List instances
gcloud sql instances list

# Describe instance
gcloud sql instances describe handfull-prod

# Connect via Cloud Shell
gcloud sql connect handfull-prod --user=handfull_app --database=handfull_prod

# Create backup
gcloud sql backups create --instance=handfull-prod

# View logs
gcloud sql instances describe handfull-prod --format="value(settings.databaseFlags)"

# Restart instance
gcloud sql instances restart handfull-prod
```

### Connection Strings

```bash
# Local Docker database (backend/docker-compose.yml)
DATABASE_URL="postgresql://postgres:changeme@localhost:5433/palm_db"

# Local development with Cloud SQL Auth Proxy
# (Start proxy first: ./cloud-sql-proxy PROJECT:REGION:INSTANCE --port=5432)
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost:5432/handfull_prod"

# Production (Cloud Run with Unix socket)
DATABASE_URL="postgresql://handfull_app:PASSWORD@localhost/handfull_prod?host=/cloudsql/PROJECT_ID:us-central1:handfull-prod"
```

### Useful Links

- [Cloud SQL Pricing](https://cloud.google.com/sql/pricing)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [Prisma with Cloud SQL](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-sql)
- [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
