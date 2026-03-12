# Organizoptera Deploy

Standalone deployment package for Organizoptera org-api service on Railway.

## Structure

```
Organizoptera-Deploy/
├── packages/@organizoptera/    # 6 shared packages
│   ├── types/
│   ├── domain/
│   ├── auth/
│   ├── subscription/
│   ├── billing/
│   └── audit/
├── services/org-api/          # Main service
├── prisma/                    # Database schema & migrations
├── railway.json               # Railway configuration
└── package.json               # Workspace root
```

## Deployment

This repository is configured for automatic deployment to Railway via GitHub integration.

### Railway Configuration

- **Build:** Multi-stage Dockerfile
- **Start:** `pnpm db:migrate && node services/org-api/dist/main.js`
- **Health Check:** `/health` endpoint
- **Port:** 5001 (configurable via `PORT` env var)

### Environment Variables

Required environment variables in Railway:

```env
# Database
DATABASE_URL=postgresql://...

# JWT Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=24h

# Server
NODE_ENV=production
PORT=5001
API_PREFIX=api
```

## Local Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Build all packages
pnpm build

# Run migrations (requires DATABASE_URL)
pnpm db:migrate

# Start service
pnpm start
```

## Source Repository

This is a deployment-optimized extraction from the main Cogg Ecosystem monorepo.

**Main Repository:** Internal Gitea at `192.168.15.6:3000/cogg/EcoSystem`

## License

MIT
