# Railway Deployment Guide - Organizoptera API

**Status:** ✅ GitHub Repository Created
**Repository:** https://github.com/Tripno08/organizoptera-api
**Railway Project:** fabulous-flexibility (0e3fa0a0-fd68-441d-9d38-abb94e14c2a6)
**Service ID:** 68257d56-092d-4ffd-b4ef-61ee8e2461dc

---

## Step 1: Connect GitHub Repository ✅ READY

**Railway Dashboard URL:**
```
https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc
```

**Configuration:**
1. Go to **Settings** → **Source**
2. Click **Connect Repo**
3. Select: `Tripno08/organizoptera-api`
4. Branch: `main`
5. Root Directory: (leave empty - auto-detected)

---

## Step 2: Environment Variables ⚠️ ACTION REQUIRED

Navigate to **Variables** tab and add these:

### Core Configuration
```env
JWT_SECRET=r02RyPQ3j8pHleQ2VZhYjytvjgUHlPWMakyMyRr6/hU=
PORT=5001
NODE_ENV=production
API_PREFIX=api
```

### Features
```env
SWAGGER_ENABLED=true
CORS_ENABLED=true
CORS_ORIGIN=*
```

### Authentication
```env
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

### Rate Limiting
```env
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Database
- **PostgreSQL Plugin:** Add if not already added
- `DATABASE_URL` will be auto-injected by Railway

---

## Step 3: Build Configuration ✅ AUTO-DETECTED

Railway will automatically detect:
- **Builder:** Dockerfile
- **Dockerfile Path:** `services/org-api/Dockerfile.railway`
- **Start Command:** `pnpm db:migrate && node services/org-api/dist/main.js`

From `railway.json`:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "services/org-api/Dockerfile.railway"
  },
  "deploy": {
    "startCommand": "pnpm db:migrate && node services/org-api/dist/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Step 4: Deploy 🚀

After connecting the repo and setting variables:
1. Railway will **automatically trigger** the first build
2. Monitor progress in **Deployments** tab
3. Build time: ~8-10 minutes (multi-stage Dockerfile)

### Expected Build Stages:
1. **Dependencies** - Install pnpm packages (~3 min)
2. **Build** - Prisma generate + TypeScript compile (~2 min)
3. **Production** - Create optimized runtime image (~1 min)
4. **Deploy** - Run migrations + start server (~2 min)

---

## Step 5: Verify Deployment ✅

Once deployed, test these endpoints:

### Health Check
```bash
curl https://org-api-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0"
}
```

### Swagger Documentation
```
https://org-api-production.up.railway.app/docs
```

### Test Login (after seeding demo data)
```bash
curl -X POST https://org-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professora@escola.demo","password":"demo2026"}'
```

---

## Step 6: Seed Demo Data (Optional)

After deployment succeeds, seed the database with demo data:

### Via Railway CLI
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway run --service org-api pnpm exec tsx prisma/seed-cogg-copiloto.ts
```

### Demo Data Created:
- 1 School Network: "Rede Demo CoggCopiloto"
- 1 School: "EMEF Professora Maria Silva"
- 1 Classroom: "Turma A (4ºA - 2026)" with 12 students
- 1 Teacher: `professora@escola.demo`

### Set Teacher Password:
```bash
# Generate bcrypt hash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('demo2026', 10))")

# Connect to Railway database
railway run --service org-api psql

# Update password
UPDATE teachers
SET password_hash = '$HASH'
WHERE email = 'professora@escola.demo';
```

---

## Troubleshooting

### Build Fails - Missing Dependencies
**Cause:** Dockerfile not copying all workspace packages
**Solution:** Verify `Dockerfile.railway` includes all 6 @organizoptera packages

### Database Migration Fails
**Cause:** `DATABASE_URL` not set
**Solution:** Add PostgreSQL plugin, verify `DATABASE_URL` in Variables tab

### Health Check Timeout
**Cause:** Service not binding to `PORT` env var
**Solution:** Verify `PORT=5001` is set in Variables, check logs for port binding

### Service Won't Start
**Cause:** Build succeeds but start command fails
**Solution:** Check logs for Prisma client generation errors, verify migrations ran

---

## Service URLs

After deployment, Railway will provide:
- **Public URL:** `https://org-api-production.up.railway.app`
- **Internal URL:** `http://org-api.railway.internal:5001`

---

## Next Steps

1. ✅ Connect GitHub repo via Railway Dashboard
2. ✅ Set all environment variables
3. ✅ Wait for first deployment (~10 min)
4. ✅ Test `/health` endpoint
5. ⚠️ Seed demo data (optional)
6. ⚠️ Integrate with CoggCopiloto frontend

---

**Generated:** 2026-03-11
**JWT_SECRET:** `r02RyPQ3j8pHleQ2VZhYjytvjgUHlPWMakyMyRr6/hU=`
**Repository:** https://github.com/Tripno08/organizoptera-api
