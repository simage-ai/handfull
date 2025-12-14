-- Palm Database Initialization
-- This script runs when the PostgreSQL container is first created

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Palm database initialized successfully';
END $$;
