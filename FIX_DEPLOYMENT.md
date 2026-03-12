# 🔧 Fix Deployment - Railway Railpack Error

## ❌ Problema Identificado

Railway tentou usar Railpack (auto-detect) ao invés do Dockerfile.

**Erro:** `Railpack could not determine how to build the app`

## ✅ Solução Aplicada

1. ✅ Criado `Dockerfile` no root do repositório
2. ✅ Atualizado `railway.json` para apontar para root Dockerfile
3. ✅ Commitado e pushed para GitHub

**Commit:** `51e068a` - fix: add root Dockerfile for Railway deployment

## 🚀 Redeploy - 2 Opções

### Opção A: Redeploy Automático (Recomendado)

Railway deve detectar o novo commit automaticamente e iniciar novo deploy.

**Verificar:**
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/deployments"
```

Se não iniciou automaticamente, prossiga para Opção B.

### Opção B: Redeploy Manual

**1. Verificar Settings:**
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/settings"
```

**2. Na aba Settings → Build:**
- Builder: **Dockerfile**
- Dockerfile Path: `Dockerfile` (sem caminho, root)
- **SAVE**

**3. Trigger Manual Deploy:**

Via Dashboard:
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc"
```

- Click **Deployments** tab
- Click **Redeploy** button

Via CLI:
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway up --detach
```

## 📊 Novo Dockerfile - O Que Mudou

**Antes:**
- ❌ Dockerfile em `services/org-api/Dockerfile.railway`
- ❌ Railway não conseguia encontrar

**Agora:**
- ✅ Dockerfile no root: `Dockerfile`
- ✅ Caminho simples, fácil detecção
- ✅ Multi-stage optimizado (deps → build → production)
- ✅ Prisma migrations incluídas no CMD

## ⏱️ Timeline Esperada

```
1. Railway detecta novo commit       (~30s)
2. Inicia novo build                 (~1 min setup)
3. Stage 1: Dependencies             (~3 min)
4. Stage 2: Build packages           (~2 min)
5. Stage 3: Production image         (~1 min)
6. Deploy + Migrations               (~2 min)
7. Health check                      (~30s)
─────────────────────────────────────────────
Total: ~10 minutos
```

## 🔍 Monitorar Deploy

### Via Dashboard:
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/deployments"
```

### Via CLI (Real-time):
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway logs --tail 100
```

## ✅ Verificação de Sucesso

### 1. Build Completo
Procurar nos logs:
```
✓ Building Docker image
✓ Stage 1: deps (completed)
✓ Stage 2: builder (completed)
✓ Stage 3: production (completed)
✓ Image built successfully
```

### 2. Migrations Aplicadas
```
Running migrations...
✓ Prisma migrations applied
```

### 3. Server Iniciado
```
[Nest] Application successfully started
Listening on port 5001
```

### 4. Health Check Passou
```bash
curl https://org-api-production.up.railway.app/health
```

Esperado:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0"
}
```

## 🐛 Troubleshooting

### Problema: Build ainda falha com Railpack

**Solução:** Configurar manualmente no Settings:
1. Settings → Build
2. Builder: Dockerfile
3. Dockerfile Path: `Dockerfile`
4. Save → Redeploy

### Problema: "Dockerfile not found"

**Verificar:**
```bash
# Confirmar que Dockerfile existe no GitHub
open "https://github.com/Tripno08/organizoptera-api/blob/main/Dockerfile"

# Se não existir, push novamente
cd /Users/rahferraz/webdev/Organizoptera-Deploy
git push origin main --force
```

### Problema: Build timeout

Railway free tier tem limite de 10 min por build.

**Solução:**
- Multi-stage já otimizado
- Se ainda timeout, pode ser problema de network
- Retry: Click **Redeploy**

### Problema: Prisma migrations fail

**Logs mostram:** `Error: P1001: Can't reach database server`

**Solução:**
1. Verificar PostgreSQL plugin está ativo
2. Verificar DATABASE_URL está injetado:
   ```bash
   railway variables | grep DATABASE_URL
   ```
3. Se ausente, adicionar PostgreSQL:
   ```bash
   open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6"
   # Click: + New → Database → PostgreSQL
   ```

## 📚 Próximos Passos

Após deploy bem-sucedido:

### 1. Verificar Health
```bash
curl https://org-api-production.up.railway.app/health
```

### 2. Acessar Swagger
```bash
open https://org-api-production.up.railway.app/docs
```

### 3. Seed Demo Data (CoggCopiloto)
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway run pnpm exec tsx prisma/seed-cogg-copiloto.ts
```

### 4. Configurar Senha Teacher
```bash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('demo2026', 10))")
railway run psql
# UPDATE teachers SET password_hash = '$HASH' WHERE email = 'professora@escola.demo';
```

### 5. Testar Login
```bash
curl -X POST https://org-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professora@escola.demo","password":"demo2026"}'
```

---

## 🎯 Status Atual

- ✅ Dockerfile corrigido e commitado
- ✅ railway.json atualizado
- ✅ Pushed para GitHub (commit 51e068a)
- ⏳ Aguardando Railway detectar e redeploy
- ⏳ Ou trigger manual via Dashboard/CLI

**Próxima ação:** Verificar se Railway iniciou novo deploy automaticamente, ou fazer redeploy manual.

---

**Tempo estimado até sucesso:** ~10 minutos
