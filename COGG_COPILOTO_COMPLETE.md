# 🎯 CoggCopiloto - Deploy Completo

## 💡 O Que É CoggCopiloto?

**CoggCopiloto** não é um app separado! É uma **camada de demo data** em cima do org-api.

```
org-api (backend base)
   ↓
+ seed-cogg-copiloto.ts (demo data)
   ↓
= CoggCopiloto (sala de aula demo para frontend)
```

## ✅ Status Atual

| Item | Status |
|------|--------|
| org-api deployment | ⚠️ Aguardando 3 passos manuais |
| Variáveis configuradas | ✅ 11/11 vars via CLI |
| GitHub repo | ✅ https://github.com/Tripno08/organizoptera-api |
| Prisma schema | ✅ CoggCopiloto extensions incluídas |
| Seed script | ✅ Pronto em `prisma/seed-cogg-copiloto.ts` |

## 🚀 Deploy em 4 Etapas

### Etapa 1: Conectar GitHub (1 min)

Abrir:
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/settings"
```

- Settings → Source → **Connect Repo**
- Repositório: `Tripno08/organizoptera-api`
- Branch: `main`
- **SAVE**

### Etapa 2: Adicionar PostgreSQL (1 min)

Abrir projeto:
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6"
```

- Click **+ New**
- **Database** → **Add PostgreSQL**
- Pronto! (DATABASE_URL auto-injetado)

### Etapa 3: Aguardar Deploy (~10 min)

Railway inicia build automaticamente após Step 1.

**Monitor:**
```bash
open "https://railway.app/project/0e3fa0a0-fd68-441d-9d38-abb94e14c2a6/service/68257d56-092d-4ffd-b4ef-61ee8e2461dc/deployments"
```

**Ou via CLI:**
```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway logs --tail 50
```

**Verificar health check:**
```bash
# Quando deployment completar
curl https://org-api-production.up.railway.app/health
```

### Etapa 4: Seed CoggCopiloto Demo (2 min)

Após deployment bem-sucedido:

```bash
cd /Users/rahferraz/webdev/Organizoptera-Deploy
railway run pnpm exec tsx prisma/seed-cogg-copiloto.ts
```

**Cria:**
- 1 School Network: "Rede Demo CoggCopiloto"
- 1 School: "EMEF Professora Maria Silva"
- 1 SchoolYear: 2026
- 1 Grade: "4º Ano"
- 1 Classroom: "Turma A (4ºA - 2026)"
- 1 Teacher: `professora@escola.demo`
- **12 Students:** Grid 3 rows × 4 columns

**Posicionamento Grid (para frontend):**
```
Row 0: Col 0, 1, 2, 3
Row 1: Col 0, 1, 2, 3
Row 2: Col 0, 1, 2, 3
```

### Etapa 4.1: Configurar Senha Teacher

```bash
# Gerar bcrypt hash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('demo2026', 10))")
echo "Hash: $HASH"

# Conectar ao banco
railway run psql

# No psql:
UPDATE teachers
SET password_hash = '$HASH_AQUI'
WHERE email = 'professora@escola.demo';

# Verificar
SELECT email, password_hash IS NOT NULL as has_password FROM teachers;

\q
```

## ✅ Verificação Final

### 1. Health Check
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

### 2. Swagger Docs
```bash
open https://org-api-production.up.railway.app/docs
```

### 3. Login Teacher
```bash
curl -X POST https://org-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professora@escola.demo","password":"demo2026"}'
```

Esperado: JWT token

### 4. Listar Estudantes
```bash
# Pegar classroom_id do output do seed
CLASSROOM_ID="<id-do-seed>"

# Com token JWT do passo anterior
curl https://org-api-production.up.railway.app/api/classrooms/$CLASSROOM_ID/students \
  -H "Authorization: Bearer <token>"
```

Esperado: Array com 12 estudantes com grid positions

## 📊 CoggCopiloto Extensions

### Student Schema
```prisma
model Student {
  // ... campos base ...

  // CoggCopiloto Extensions:
  grid_row           Int?      // Grid position: row (0-2)
  grid_col           Int?      // Grid position: col (0-3)

  // Performance Scores (0-100):
  score_math         Float?
  score_literacy     Float?
  score_socioemo     Float?

  // Clinical Flags:
  flag_risk          Boolean?
  flag_excellence    Boolean?
  flag_intervention  Boolean?

  // SENNA Big Five (0-100):
  senna_o            Float?    // Openness
  senna_c            Float?    // Conscientiousness
  senna_e            Float?    // Extraversion
  senna_a            Float?    // Agreeableness
  senna_n            Float?    // Neuroticism
}
```

### API Endpoints CoggCopiloto
```
GET  /api/classrooms/:id/students         # Grid + scores + flags
PATCH /api/students/:id/grid              # Update grid position
PATCH /api/students/:id/scores            # Update performance
PATCH /api/students/:id/flags             # Update clinical flags
PATCH /api/students/:id/senna             # Update Big Five
```

## 🎯 Integração Frontend

Após deploy + seed, configurar frontend CoggCopiloto:

```env
VITE_API_URL=https://org-api-production.up.railway.app
VITE_CLASSROOM_ID=<classroom-id-do-seed>
```

**Login Demo:**
```javascript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'professora@escola.demo',
    password: 'demo2026'
  })
});

const { access_token } = await response.json();
localStorage.setItem('token', access_token);
```

**Fetch Students Grid:**
```javascript
const response = await fetch(
  `${API_URL}/api/classrooms/${CLASSROOM_ID}/students`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const students = await response.json();

// Organizar em grid 3x4
const grid = Array(3).fill(null).map(() => Array(4).fill(null));
students.forEach(student => {
  if (student.grid_row !== null && student.grid_col !== null) {
    grid[student.grid_row][student.grid_col] = student;
  }
});
```

## 📝 Resumo Executivo

**O que é:**
- org-api = Backend base (NestJS + Prisma + Auth)
- CoggCopiloto = Demo data (1 sala, 12 alunos, grid 3×4)

**Deploy:**
1. ✅ Repository GitHub criado
2. ✅ Variáveis configuradas (11 vars)
3. ⚠️ Conectar GitHub (manual, 1 min)
4. ⚠️ Adicionar PostgreSQL (manual, 1 min)
5. ⏱️ Deploy automático (~10 min)
6. ⏱️ Seed demo (1 comando, 30s)

**Credenciais Demo:**
- Email: `professora@escola.demo`
- Password: `demo2026`

**URLs:**
- API: `https://org-api-production.up.railway.app`
- Docs: `https://org-api-production.up.railway.app/docs`
- Health: `https://org-api-production.up.railway.app/health`

---

**Total Time:** ~15 minutos (3 manual + 10 build + 2 seed)
**Status:** ✅ Pronto para executar passos 1-2!
