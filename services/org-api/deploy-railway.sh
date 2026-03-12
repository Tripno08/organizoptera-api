#!/bin/bash
set -e

echo "🚀 Deploying org-api to Railway Project: fabulous-flexibility"
echo "=============================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check we're in the right directory
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}⚠️  Not in org-api directory${NC}"
    echo "Run this from: Organizoptera/services/org-api/"
    exit 1
fi

echo -e "${GREEN}✅ Correct directory${NC}"
echo ""

# Verify Railway project
echo -e "${BLUE}Project Status:${NC}"
railway status
echo ""

# Confirm deployment
echo -e "${YELLOW}This will:${NC}"
echo "  1. Create a NEW service 'org-api' in fabulous-flexibility"
echo "  2. Upload and build Dockerfile"
echo "  3. Run database migrations automatically"
echo "  4. Deploy to production"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting deployment...${NC}"
echo ""

# Deploy (this will prompt for service name)
railway up

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo "Next steps:"
echo "  1. railway variables set JWT_SECRET=\$(openssl rand -base64 32)"
echo "  2. railway variables set PORT=5001"
echo "  3. railway domain"
echo ""
