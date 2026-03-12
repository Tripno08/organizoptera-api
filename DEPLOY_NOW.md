# 🚀 Deploy AGORA - 5 Minutos

## ✅ JÁ CONFIGURADO VIA CLI
- JWT_SECRET: ✅
- Todas as 11 variáveis: ✅
- Railway CLI linkado: ✅

## ⚡ 3 PASSOS FINAIS (2 minutos)

### 1. Abrir Dashboard
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/settings"
```

### 2. Conectar GitHub (1 min)
Na aba **Settings**:
- Seção **Source** → **Connect Repo**
- Selecionar: `Tripno08/organizoptera-api`
- Branch: `main`
- **SAVE**

### 3. Adicionar PostgreSQL (1 min)
Voltar para o projeto:
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6"
```

- Click **+ New**
- **Database** → **Add PostgreSQL**
- Pronto! (DATABASE_URL auto-injetado)

---

## 🎯 Resultado

Após salvar em **Step 2**:
- Railway inicia build automaticamente
- Tempo: ~10 minutos
- Monitor em **Deployments** tab

## ✅ Verificação

Após deployment:
```bash
curl https://org-api-production.up.railway.app/health
```

Esperado:
```json
{"status":"ok","database":"connected","version":"1.0.0"}
```

---

**PRONTO!** Depois disso, vamos para o CoggCopiloto deploy! 🚀
