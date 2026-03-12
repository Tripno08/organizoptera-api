# Organizoptera REST API

NestJS REST API service for Organizoptera - Multi-Tenant Organization Management System.

## Features

- Complete CRUD operations for all entities
- Swagger/OpenAPI documentation
- Validation pipes with class-validator
- Prisma ORM integration
- TypeScript strict mode
- Error handling with proper HTTP status codes

## Modules

### 1. School Networks
- `POST /api/school-networks` - Create school network
- `GET /api/school-networks` - List all school networks
- `GET /api/school-networks/:id` - Get school network details
- `PATCH /api/school-networks/:id` - Update school network
- `DELETE /api/school-networks/:id` - Delete school network

### 2. Schools
- `POST /api/schools` - Create school
- `GET /api/schools` - List all schools (filter by networkId)
- `GET /api/schools/:id` - Get school details
- `GET /api/schools/:id/classrooms` - Get school's classrooms
- `GET /api/schools/:id/students` - Get school's students
- `GET /api/schools/:id/teachers` - Get school's teachers
- `PATCH /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

### 3. Grades
- `POST /api/grades` - Create grade
- `GET /api/grades` - List all grades (filter by schoolId)
- `GET /api/grades/:id` - Get grade details with classrooms
- `PATCH /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade

### 4. Classrooms
- `POST /api/classrooms` - Create classroom
- `GET /api/classrooms` - List all classrooms (filter by schoolId, gradeId)
- `GET /api/classrooms/:id` - Get classroom details
- `GET /api/classrooms/:id/students` - Get enrolled students
- `PATCH /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### 5. Students
- `POST /api/students` - Create student
- `GET /api/students` - List all students (filter by schoolId)
- `GET /api/students/:id` - Get student details with enrollments
- `POST /api/students/:id/enroll` - Enroll student in classroom
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### 6. Teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers` - List all teachers (filter by schoolId)
- `GET /api/teachers/:id` - Get teacher details with assignments
- `GET /api/teachers/:id/classrooms` - Get assigned classrooms
- `PATCH /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

## Setup

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- PNPM

### Installation

1. Install dependencies:
```bash
cd services/org-api
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DATABASE_URL=postgresql://organizoptera:org_password_123@localhost:5432/organizoptera_dev
PORT=5001
SWAGGER_ENABLED=true
```

4. Generate Prisma client (from Organizoptera root):
```bash
cd ../.. # Go to Organizoptera root
pnpm prisma generate
```

5. Run migrations (if not already done):
```bash
pnpm prisma migrate dev
```

## Running the API

### Development mode
```bash
pnpm dev
```

### Production mode
```bash
pnpm build
pnpm start:prod
```

## Access

- **API Base URL:** http://localhost:5001/api
- **Swagger Documentation:** http://localhost:5001/docs

## API Examples

### Create a School Network
```bash
curl -X POST http://localhost:5001/api/school-networks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rede Municipal de Campinas",
    "slug": "rede-municipal-campinas",
    "status": "ACTIVE"
  }'
```

### Create a School
```bash
curl -X POST http://localhost:5001/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "networkId": "uuid-from-network",
    "name": "EMEF João Silva",
    "slug": "emef-joao-silva",
    "code": "12345678",
    "city": "Campinas",
    "state": "SP"
  }'
```

### Create a Student
```bash
curl -X POST http://localhost:5001/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "uuid-from-school",
    "firstName": "João",
    "lastName": "Silva",
    "birthDate": "2010-05-15",
    "gender": "MALE",
    "studentCode": "RA123456"
  }'
```

### Enroll Student
```bash
curl -X POST http://localhost:5001/api/students/{studentId}/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "classroomId": "uuid-from-classroom",
    "schoolYearId": "uuid-from-school-year"
  }'
```

## Validation

All DTOs have validation using class-validator:
- Required fields are enforced
- UUIDs are validated
- Enums are validated
- Type conversions are automatic

## Error Handling

The API returns standard HTTP status codes:
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input or missing required entity
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (unique constraint violation)
- `500 Internal Server Error` - Server error

## Testing

Run tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:cov
```

## Architecture

```
src/
├── main.ts                     # Application entry point
├── app.module.ts              # Root module
├── prisma/                    # Prisma service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── school-networks/           # School networks module
│   ├── dto/
│   ├── school-networks.controller.ts
│   ├── school-networks.service.ts
│   └── school-networks.module.ts
├── schools/                   # Schools module
│   ├── dto/
│   ├── schools.controller.ts
│   ├── schools.service.ts
│   └── schools.module.ts
├── grades/                    # Grades module
│   ├── dto/
│   ├── grades.controller.ts
│   ├── grades.service.ts
│   └── grades.module.ts
├── classrooms/                # Classrooms module
│   ├── dto/
│   ├── classrooms.controller.ts
│   ├── classrooms.service.ts
│   └── classrooms.module.ts
├── students/                  # Students module
│   ├── dto/
│   ├── students.controller.ts
│   ├── students.service.ts
│   └── students.module.ts
└── teachers/                  # Teachers module
    ├── dto/
    ├── teachers.controller.ts
    ├── teachers.service.ts
    └── teachers.module.ts
```

## Next Steps

1. Add authentication/authorization
2. Add pagination for list endpoints
3. Add filtering and sorting
4. Add caching with Redis
5. Add rate limiting
6. Add request logging
7. Add health check endpoints
8. Add integration tests

## License

Part of the Organizoptera project - See root LICENSE file.
