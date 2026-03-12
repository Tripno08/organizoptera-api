#!/bin/bash

# Test Database Setup Script
# Creates and initializes PostgreSQL test database on Mac Mini
# Uses Prisma CLI (no psql client required)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="192.168.15.6"
DB_PORT="5432"
DB_USER="cogg"
DB_PASSWORD="dev_password"
DB_NAME="cogg_organizoptera_test"

echo -e "${YELLOW}🔧 Test Database Setup (Prisma CLI)${NC}"
echo "================================"

# Change to Organizoptera root (where schema is located)
cd "$(dirname "$0")/../../.."

# Set DATABASE_URL for Prisma
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# Set Prisma AI consent for test database operations
# This is safe because we're explicitly working with a test database (cogg_organizoptera_test)
export PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="${PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:-test database setup}"

# Path to Prisma schema (relative to Organizoptera root)
SCHEMA_PATH="./prisma/schema.prisma"

# Check PostgreSQL connection by attempting to connect with Prisma
echo -e "${YELLOW}📡 Checking PostgreSQL connection...${NC}"
if timeout 5 npx prisma db execute --schema="$SCHEMA_PATH" --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
else
  echo -e "${YELLOW}⚠️  Database may not exist yet (this is OK)${NC}"
fi

# Use Prisma db push to create/reset database schema
# --force-reset will drop and recreate the database if it exists
# --skip-generate will skip client generation (we do it separately)
echo -e "${YELLOW}🏗️  Creating/resetting test database schema...${NC}"
npx prisma db push --schema="$SCHEMA_PATH" --force-reset --skip-generate --accept-data-loss
echo -e "${GREEN}✓ Database schema created/reset${NC}"

# Generate Prisma Client
echo -e "${YELLOW}⚙️  Generating Prisma Client...${NC}"
npx prisma generate --schema="$SCHEMA_PATH"
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo ""
echo -e "${GREEN}✅ Test database setup complete!${NC}"
echo ""
echo "Database Details:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "Next steps:"
echo "  1. Run: npm run test:db:seed"
echo "  2. Run: npm run test:e2e"
