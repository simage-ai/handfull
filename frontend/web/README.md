# Palm - Meal Tracking Web App

A Next.js application for tracking daily meals and macros with visual progress charts.

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL)
- Google Cloud account (for image storage)

## Getting Started

### 1. Start the Database

```bash
cd ../backend
docker compose up -d
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the required variables in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://postgres:changeme_postgres_password@localhost:5432/palm_db"

# Auth.js - Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Google Cloud Storage
GCS_BUCKET_NAME="your-bucket-name"
```

### 3. Set Up Google Cloud Authentication (Local Development)

For local development, use Google Application Default Credentials (ADC) instead of a service account key. This is more secure and easier to manage.

#### Option A: Using gcloud CLI (Recommended)

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)

2. Authenticate with your Google account:
   ```bash
   gcloud auth application-default login
   ```

3. Set your project (if not already set):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

That's it! The `@google-cloud/storage` library will automatically use these credentials.

#### Option B: Using a Service Account Key

If you prefer using a service account key (e.g., for CI/CD or specific permissions):

1. Create a service account in the Google Cloud Console
2. Grant it the `Storage Object Admin` role on your bucket
3. Download the JSON key file
4. Either:
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
     ```
   - Or set the `GCP_SERVICE_ACCOUNT_KEY` environment variable in `.env.local` with the JSON content:
     ```bash
     GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
     ```

#### Verifying GCS Access

Test that your credentials work:

```bash
# List buckets (requires storage.buckets.list permission)
gcloud storage ls

# Or test access to your specific bucket
gcloud storage ls gs://your-bucket-name/
```

### 4. Initialize the Database

```bash
pnpm db:push
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
frontend/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (signin, error)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── add-meal/          # Add meal page
│   ├── api/               # API routes
│   └── share/             # Public share pages
├── components/
│   ├── common/            # Shared components
│   ├── domain/            # Feature-specific components
│   └── ui/                # shadcn/ui primitives
├── lib/                   # Utilities and configurations
├── prisma/                # Database schema
└── types/                 # TypeScript type definitions
```

## Features

- Google OAuth authentication
- Daily macro tracking with radial progress charts
- Meal logging with optional photos
- Multiple nutrition plans
- Public share links for trainers/nutritionists
