# 🚀 Railway Quick Setup - Organizoptera API

## 📋 Copy-Paste Ready

### 1️⃣ Railway Dashboard
**Open:** https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc

### 2️⃣ Connect GitHub
- **Settings** → **Source** → **Connect Repo**
- Repository: `Tripno08/organizoptera-api`
- Branch: `main`
- Root Directory: (leave empty)

### 3️⃣ Environment Variables
**Variables Tab** → **Add all these:**

```
JWT_SECRET=r02RyPQ3j8pHleQ2VZhYjytvjgUHlPWMakyMyRr6/hU=
PORT=5001
NODE_ENV=production
API_PREFIX=api
SWAGGER_ENABLED=true
CORS_ENABLED=true
CORS_ORIGIN=*
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 4️⃣ Add PostgreSQL
**Plugins** → **Add PostgreSQL**
(DATABASE_URL will be auto-injected)

### 5️⃣ Deploy
**Save** → Railway auto-deploys (~10 minutes)

---

## ✅ Verification Commands

```bash
# Health check (after deployment)
curl https://org-api-production.up.railway.app/health

# Expected response:
# {"status":"ok","database":"connected","version":"1.0.0"}

# Swagger docs
open https://org-api-production.up.railway.app/docs
```

---

## 📦 Demo Data (Optional)

```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway run --service org-api pnpm exec tsx prisma/seed-cogg-copiloto.ts
```

**Creates:**
- 1 School Network
- 1 School: "EMEF Professora Maria Silva"
- 1 Classroom: "Turma A (4ºA - 2026)"
- 12 Students (grid 3×4)
- 1 Teacher: `professora@escola.demo`

---

## 🔑 Generated Credentials

**JWT_SECRET:** `r02RyPQ3j8pHleQ2VZhYjytvjgUHlPWMakyMyRr6/hU=`
**Teacher Login:** `professora@escola.demo` / `demo2026` (after seeding)

---

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT.md` for detailed troubleshooting and advanced configuration.
