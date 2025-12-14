# Palm Backend

Local development backend services using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Copy `.env.example` to `.env` and customize if needed

## Quick Start

```bash
# Start PostgreSQL only
docker-compose up -d

# Start with pgAdmin (dev profile)
docker-compose --profile dev up -d
```

## Services

| Service  | Port | Description                    |
|----------|------|--------------------------------|
| postgres | 5432 | PostgreSQL 16 database         |
| pgadmin  | 5050 | pgAdmin web UI (dev only)      |

## Connection

Use this connection string in `frontend/web/.env.local`:

```
DATABASE_URL="postgresql://postgres:changeme_postgres_password@localhost:5432/palm_db"
```

## Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (destroy data)
docker-compose down -v
```
