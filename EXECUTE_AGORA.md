# ⚡ EXECUTE AGORA - 3 Passos

## ✅ JÁ FEITO AUTOMATICAMENTE
- ✅ Repositório GitHub criado e commitado
- ✅ 11 variáveis de ambiente configuradas via CLI
- ✅ Railway CLI linkado ao projeto
- ✅ Documentação completa gerada
- ✅ JWT_SECRET gerado

## 🎯 FALTA FAZER (3 minutos)

### 📋 PASSO 1: Conectar GitHub (1 min)

**Comando:**
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/settings"
```

**Ações:**
1. Na aba **Settings**
2. Seção **Source**
3. Click **Connect Repo**
4. Selecionar: `Tripno08/organizoptera-api`
5. Branch: `main`
6. Click **Connect** (ou **Save**)

**✅ Resultado:** Railway inicia o build automaticamente!

---

### 📋 PASSO 2: Adicionar PostgreSQL (1 min)

**Comando:**
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6"
```

**Ações:**
1. Click botão **+ New**
2. Selecionar **Database**
3. Click **Add PostgreSQL**

**✅ Resultado:** DATABASE_URL é auto-injetado no serviço!

---

### 📋 PASSO 3: Monitorar Deploy (~10 min)

**Comando:**
```bash
# Opção 1: Dashboard
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/deployments"

# Opção 2: CLI (tempo real)
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway logs --tail 100
```

**Fases do Deploy:**
1. ⏱️ Building Docker image (~3 min)
2. ⏱️ Installing dependencies (~2 min)
3. ⏱️ Generating Prisma Client (~1 min)
4. ⏱️ Building TypeScript (~2 min)
5. ⏱️ Running migrations (~1 min)
6. ✅ Starting server (~30s)

**Verificar quando completar:**
```bash
curl https://org-api-production.up.railway.app/health
```

Esperado: `{"status":"ok","database":"connected","version":"1.0.0"}`

---

## 🎓 DEPOIS DO DEPLOY: CoggCopiloto Demo Data

### Seed Demo Classroom
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway run pnpm exec tsx prisma/seed-cogg-copiloto.ts
```

**Cria:**
- 1 Escola: "EMEF Professora Maria Silva"
- 1 Turma: "4ºA - 2026"
- 12 Alunos (grid 3×4)
- 1 Professora: `professora@escola.demo`

### Configurar Senha
```bash
# Gerar hash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('demo2026', 10))")

# Aplicar
railway run psql
```

No psql:
```sql
UPDATE teachers
SET password_hash = '$HASH_AQUI'
WHERE email = 'professora@escola.demo';

\q
```

### Testar Login
```bash
curl -X POST https://org-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professora@escola.demo","password":"demo2026"}'
```

Esperado: `{"access_token":"eyJ..."}`

---

## 📊 Resumo Timeline

| Etapa | Tempo | Status |
|-------|-------|--------|
| Criar repo GitHub | - | ✅ Feito |
| Configurar vars | - | ✅ Feito |
| Conectar GitHub | 1 min | ⏳ Aguardando você |
| Adicionar PostgreSQL | 1 min | ⏳ Aguardando você |
| Deploy Railway | 10 min | ⏳ Automático |
| Seed demo data | 1 min | ⏳ Opcional |
| **TOTAL** | **13 min** | |

---

## 🚀 COMANDOS RÁPIDOS

### Abrir tudo de uma vez:
```bash
# Abrir Settings (conectar GitHub)
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/settings"

# Abrir Project (adicionar PostgreSQL)
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6"

# Monitorar logs
cd /Users/rahferraz/webdev/Organizoptera-Deploy && railway logs --tail 50
```

---

## ✅ CHECKLIST

- [ ] PASSO 1: GitHub conectado
- [ ] PASSO 2: PostgreSQL adicionado
- [ ] Deploy iniciou automaticamente
- [ ] Health check passou (200 OK)
- [ ] Seed demo data executado
- [ ] Senha teacher configurada
- [ ] Login testado com sucesso

---

**PRONTO! Após esses 3 passos, org-api + CoggCopiloto estarão 100% deployados! 🎉**

**Documentação completa:**
- `DEPLOY_NOW.md` - Quick ref
- `COGG_COPILOTO_COMPLETE.md` - Guia completo
- `RAILWAY_DEPLOYMENT.md` - Troubleshooting

**VAMOS LÁ! Execute os passos 1 e 2 agora! ⚡**
