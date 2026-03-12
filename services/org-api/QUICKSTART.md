# Organizoptera API - Quick Start Guide

## What Was Created

A complete NestJS REST API service with 6 fully functional modules:

### Modules Implemented
1. **School Networks** - Top-level organizations
2. **Schools** - Individual schools within networks
3. **Grades** - Grade levels (1º ano, 2º ano, etc.)
4. **Classrooms** - Classes/Turmas
5. **Students** - Student management with enrollment
6. **Teachers** - Teacher management with classroom assignments

### Files Created (35 TypeScript files)

```
services/org-api/
├── package.json                          # Dependencies & scripts
├── nest-cli.json                         # NestJS CLI config
├── tsconfig.json                         # TypeScript config
├── .env                                  # Environment variables
├── .env.example                          # Environment template
├── README.md                             # Full documentation
├── QUICKSTART.md                         # This file
└── src/
    ├── main.ts                           # Application entry point
    ├── app.module.ts                     # Root module
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── school-networks/                  # Module 1
    │   ├── dto/
    │   │   ├── create-school-network.dto.ts
    │   │   └── update-school-network.dto.ts
    │   ├── school-networks.controller.ts
    │   ├── school-networks.service.ts
    │   └── school-networks.module.ts
    ├── schools/                          # Module 2
    │   ├── dto/
    │   │   ├── create-school.dto.ts
    │   │   └── update-school.dto.ts
    │   ├── schools.controller.ts
    │   ├── schools.service.ts
    │   └── schools.module.ts
    ├── grades/                           # Module 3
    │   ├── dto/
    │   │   ├── create-grade.dto.ts
    │   │   └── update-grade.dto.ts
    │   ├── grades.controller.ts
    │   ├── grades.service.ts
    │   └── grades.module.ts
    ├── classrooms/                       # Module 4
    │   ├── dto/
    │   │   ├── create-classroom.dto.ts
    │   │   └── update-classroom.dto.ts
    │   ├── classrooms.controller.ts
    │   ├── classrooms.service.ts
    │   └── classrooms.module.ts
    ├── students/                         # Module 5
    │   ├── dto/
    │   │   ├── create-student.dto.ts
    │   │   ├── update-student.dto.ts
    │   │   └── enroll-student.dto.ts
    │   ├── students.controller.ts
    │   ├── students.service.ts
    │   └── students.module.ts
    └── teachers/                         # Module 6
        ├── dto/
        │   ├── create-teacher.dto.ts
        │   └── update-teacher.dto.ts
        ├── teachers.controller.ts
        ├── teachers.service.ts
        └── teachers.module.ts
```

## How to Run

### Step 1: Prerequisites

Make sure you have:
- PostgreSQL running on localhost:5432
- Database `organizoptera_dev` created
- Database user `organizoptera` with password `org_password_123`

### Step 2: Install Dependencies

From the Organizoptera root directory:

```bash
cd /Users/rahferraz/webdev/EcoSystem/Organizoptera
pnpm install
```

### Step 3: Generate Prisma Client

```bash
pnpm prisma generate
```

### Step 4: Run Migrations (if not done)

```bash
pnpm prisma migrate dev
```

### Step 5: Start the API

```bash
cd services/org-api
pnpm dev
```

### Step 6: Access the API

- **API:** http://localhost:5001/api
- **Swagger Docs:** http://localhost:5001/docs

## Quick Test

### 1. Create a School Network

```bash
curl -X POST http://localhost:5001/api/school-networks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rede Municipal de Campinas",
    "slug": "rede-municipal-campinas",
    "status": "ACTIVE"
  }'
```

Response:
```json
{
  "id": "uuid-here",
  "name": "Rede Municipal de Campinas",
  "slug": "rede-municipal-campinas",
  "status": "ACTIVE",
  "createdAt": "2025-12-03T...",
  "updatedAt": "2025-12-03T..."
}
```

### 2. List All Networks

```bash
curl http://localhost:5001/api/school-networks
```

### 3. Create a School

```bash
curl -X POST http://localhost:5001/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "networkId": "uuid-from-step-1",
    "name": "EMEF João Silva",
    "slug": "emef-joao-silva",
    "city": "Campinas",
    "state": "SP"
  }'
```

### 4. Create a Student

```bash
curl -X POST http://localhost:5001/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "uuid-from-step-3",
    "firstName": "Maria",
    "lastName": "Santos",
    "birthDate": "2010-05-15",
    "gender": "FEMALE"
  }'
```

## API Endpoints Summary

### School Networks (5 endpoints)
- `POST /api/school-networks` - Create
- `GET /api/school-networks` - List all
- `GET /api/school-networks/:id` - Get one
- `PATCH /api/school-networks/:id` - Update
- `DELETE /api/school-networks/:id` - Delete

### Schools (8 endpoints)
- `POST /api/schools` - Create
- `GET /api/schools?networkId=uuid` - List (with filter)
- `GET /api/schools/:id` - Get one
- `GET /api/schools/:id/classrooms` - Get school's classrooms
- `GET /api/schools/:id/students` - Get school's students
- `GET /api/schools/:id/teachers` - Get school's teachers
- `PATCH /api/schools/:id` - Update
- `DELETE /api/schools/:id` - Delete

### Grades (5 endpoints)
- `POST /api/grades` - Create
- `GET /api/grades?schoolId=uuid` - List (with filter)
- `GET /api/grades/:id` - Get one
- `PATCH /api/grades/:id` - Update
- `DELETE /api/grades/:id` - Delete

### Classrooms (6 endpoints)
- `POST /api/classrooms` - Create
- `GET /api/classrooms?schoolId=uuid&gradeId=uuid` - List (with filters)
- `GET /api/classrooms/:id` - Get one
- `GET /api/classrooms/:id/students` - Get enrolled students
- `PATCH /api/classrooms/:id` - Update
- `DELETE /api/classrooms/:id` - Delete

### Students (6 endpoints)
- `POST /api/students` - Create
- `GET /api/students?schoolId=uuid` - List (with filter)
- `GET /api/students/:id` - Get one with enrollments
- `POST /api/students/:id/enroll` - Enroll in classroom
- `PATCH /api/students/:id` - Update
- `DELETE /api/students/:id` - Delete

### Teachers (6 endpoints)
- `POST /api/teachers` - Create
- `GET /api/teachers?schoolId=uuid` - List (with filter)
- `GET /api/teachers/:id` - Get one with assignments
- `GET /api/teachers/:id/classrooms` - Get assigned classrooms
- `PATCH /api/teachers/:id` - Update
- `DELETE /api/teachers/:id` - Delete

**Total: 36 REST endpoints**

## Features Implemented

### Validation
- All inputs validated with class-validator
- Required fields enforced
- UUID format validation
- Enum validation
- Type coercion (strings to numbers, dates, etc.)

### Error Handling
- 400 Bad Request - Invalid input or missing entities
- 404 Not Found - Resource not found
- 409 Conflict - Duplicate resources (unique constraint violations)
- 500 Internal Server Error - Server errors

### Documentation
- Complete Swagger/OpenAPI documentation
- Request/response examples
- Parameter descriptions
- Status code documentation

### Database Integration
- Prisma ORM with PostgreSQL
- Automatic transaction handling
- Cascade deletes configured
- Foreign key validation
- Unique constraint handling

### Code Quality
- TypeScript strict mode
- No `any` types
- Proper DTOs for all operations
- Service layer separation
- Controller layer with decorators

## Troubleshooting

### Port already in use
If port 5001 is in use, change it in `.env`:
```env
PORT=5002
```

### Database connection error
Check your DATABASE_URL in `.env`:
```env
DATABASE_URL=postgresql://organizoptera:org_password_123@localhost:5432/organizoptera_dev
```

### Prisma client not found
Generate it:
```bash
cd /Users/rahferraz/webdev/EcoSystem/Organizoptera
pnpm prisma generate
```

### Dependencies not found
Reinstall from root:
```bash
cd /Users/rahferraz/webdev/EcoSystem/Organizoptera
pnpm install
```

## Next Steps

1. **Add Authentication** - JWT tokens, guards
2. **Add Pagination** - For list endpoints
3. **Add Filtering** - Advanced query filters
4. **Add Sorting** - Sort by any field
5. **Add Caching** - Redis for performance
6. **Add Tests** - Unit & integration tests
7. **Add Logging** - Request/response logging
8. **Add Rate Limiting** - Prevent abuse

## Production Deployment

When ready for production:

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Build: `pnpm build`
4. Start: `pnpm start:prod`
5. Consider using Docker (Dockerfile already exists)
6. Setup reverse proxy (nginx)
7. Enable SSL/TLS
8. Setup monitoring

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review Swagger docs at /docs endpoint
- Check Prisma schema at prisma/schema.prisma
- Review CLAUDE.md in Organizoptera root

---

**Created:** 2025-12-03
**Location:** /Users/rahferraz/webdev/EcoSystem/Organizoptera/services/org-api
**Status:** Ready to use
