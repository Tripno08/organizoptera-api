# @organizoptera/curriculoptera-adapter

Integration adapter for Curriculoptera (BNCC curriculum) skill tracking with Organizoptera student management.

## Overview

This package provides a clean interface to query and manage student skill progress from Curriculoptera within the context of Organizoptera's organizational hierarchy.

### Key Features

- **Student Skill Progress**: Track BNCC skill proficiency for individual students
- **Microskill Mastery**: Granular tracking of skill decomposition
- **Classroom Analytics**: Aggregate skill metrics at classroom level
- **School Dashboards**: Comprehensive curriculum coverage reports
- **Multi-Tenancy**: Full tenant isolation via school network IDs

## Installation

```bash
pnpm add @organizoptera/curriculoptera-adapter
```

## Usage

### Basic Setup

```typescript
import { CurriculopteraAdapter } from '@organizoptera/curriculoptera-adapter';
import { PrismaClient } from '@prisma/client';

// Create Curriculoptera Prisma client
const curriculoptera = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CURRICULOPTERA_DATABASE_URL,
    },
  },
});

// Initialize adapter
const adapter = new CurriculopteraAdapter({
  curriculopteraPrisma: curriculoptera,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
});
```

### Get Student Skill Progress

```typescript
// Get all skill progress for a student
const progress = await adapter.getStudentSkillProgress('student-uuid-123');

console.log(progress);
// [
//   {
//     id: 'progress-uuid',
//     studentId: 'student-uuid-123',
//     tenantId: 'network-uuid',
//     skillId: 'skill-uuid',
//     skillCode: 'EF01MA01',
//     proficiencyLevel: 'proficient',
//     lastPracticed: Date,
//     practiceCount: 15,
//     mastered: false,
//     createdAt: Date,
//     updatedAt: Date,
//   },
//   // ... more skills
// ]
```

### Get Microskill Progress

```typescript
// Get granular microskill progress
const microProgress = await adapter.getStudentMicroSkillProgress('student-uuid-123');

console.log(microProgress);
// [
//   {
//     id: 'micro-progress-uuid',
//     studentId: 'student-uuid-123',
//     microSkillId: 'microskill-uuid',
//     microSkillCode: 'EF01MA01.1',
//     masteryLevel: 0.75, // 75% mastery
//     attempts: 8,
//     successRate: 0.87,
//     lastPracticed: Date,
//     nextReviewDate: Date, // Spaced repetition
//     easeFactor: 2.5,
//     interval: 7, // days
//     totalTimeSeconds: 450,
//     avgSessionSeconds: 56,
//   },
// ]
```

### Get School Dashboard

```typescript
// Get comprehensive school-level curriculum dashboard
const dashboard = await adapter.getSchoolSkillDashboard(
  'school-uuid-456',
  'network-uuid-789'
);

console.log(dashboard);
// {
//   schoolId: 'school-uuid-456',
//   networkId: 'network-uuid-789',
//   totalStudents: 720,
//   skillsTracked: 1407,
//   gradeProgress: [
//     {
//       gradeLevel: '1º EF',
//       studentCount: 80,
//       skillsTracked: 156,
//       averageProficiency: 65.3,
//     },
//     // ... other grades
//   ],
//   subjectPerformance: [
//     {
//       subjectCode: 'matematica',
//       subjectName: 'Matemática',
//       skillsTracked: 450,
//       averageProficiency: 72.1,
//       studentsCovered: 680,
//     },
//     // ... other subjects
//   ],
//   trends: {
//     weeklyProgress: 2.3, // +2.3% improvement
//     studentsImproving: 120,
//     studentsNeedingSupport: 45,
//   },
// }
```

### Get Student Curriculum Report

```typescript
// Get detailed curriculum report for a student
const report = await adapter.getStudentCurriculumReport(
  'student-uuid-123',
  '3º EF'
);

console.log(report);
// {
//   studentId: 'student-uuid-123',
//   gradeLevel: '3º EF',
//   totalSkillsForGrade: 187,
//   skillsStarted: 98,
//   skillsMastered: 42,
//   overallProficiency: 68.5,
//   subjects: [
//     {
//       subjectCode: 'matematica',
//       subjectName: 'Matemática',
//       totalSkills: 52,
//       skillsStarted: 30,
//       skillsMastered: 15,
//       proficiency: 72.0,
//     },
//     // ... other subjects
//   ],
//   recentSkills: [
//     {
//       skillCode: 'EF03MA08',
//       description: 'Resolver e elaborar problemas de adição...',
//       proficiencyLevel: 'proficient',
//       lastPracticed: Date,
//     },
//     // ... more recent skills
//   ],
//   recommendedSkills: [], // To be implemented
// }
```

### Get Content Skill Alignment

```typescript
// Check which BNCC skills are covered by an activity
const alignment = await adapter.getContentSkillAlignment('activity-123', 'activity');

console.log(alignment);
// {
//   contentId: 'activity-123',
//   contentType: 'activity',
//   alignedSkills: [
//     {
//       skillCode: 'EF02MA03',
//       skillDescription: 'Comparar quantidades de objetos...',
//       gradeLevel: '2º EF',
//       subjectCode: 'matematica',
//     },
//     // ... more aligned skills
//   ],
//   coveragePercentage: 85,
// }
```

## Integration with Organizoptera

### Tenant Isolation

The adapter uses `tenantId` (mapped to Organizoptera's `SchoolNetwork.id`) for multi-tenancy:

```typescript
// In Organizoptera context
const student = await organizopteraPrisma.student.findUnique({
  where: { id: studentId },
  include: {
    school: {
      include: { network: true },
    },
  },
});

const tenantId = student.school.networkId; // Use this as tenantId

// Query Curriculoptera with tenant isolation
const progress = await adapter.getStudentSkillProgress(studentId);
// All results are automatically filtered by tenantId in Curriculoptera
```

### Grade Level Mapping

Organizoptera grades map directly to Curriculoptera grade levels:

| Organizoptera Grade | Curriculoptera GradeLevel |
|---------------------|---------------------------|
| `1º Ano` (code: `1EF`) | `1º EF` |
| `2º Ano` (code: `2EF`) | `2º EF` |
| ... | ... |
| `9º Ano` (code: `9EF`) | `9º EF` |

```typescript
// Get grade from Organizoptera
const enrollment = await organizopteraPrisma.enrollment.findFirst({
  where: { studentId },
  include: {
    classroom: {
      include: { grade: true },
    },
  },
});

const gradeLevel = enrollment.classroom.grade.name; // "1º EF", "2º EF", etc.

// Use in Curriculoptera queries
const report = await adapter.getStudentCurriculumReport(studentId, gradeLevel);
```

## Architecture

### Data Flow

```
┌─────────────────────┐
│  Organizoptera      │
│  (Student Management)│
│                     │
│  - 720 Students     │
│  - Grades 1-9 EF    │
│  - School Network   │
└──────────┬──────────┘
           │
           │ studentId, tenantId (networkId)
           ▼
┌─────────────────────┐
│  Adapter Layer      │
│  (This Package)     │
│                     │
│  - Queries          │
│  - Caching          │
│  - Type Mapping     │
└──────────┬──────────┘
           │
           │ Prisma queries
           ▼
┌─────────────────────┐
│  Curriculoptera     │
│  (Curriculum/Skills)│
│                     │
│  - 1,407 Skills     │
│  - 6,867 MicroSkills│
│  - Progress Tracking│
└─────────────────────┘
```

### Database Schema Mapping

**Curriculoptera Tables:**
- `StudentSkillProgress` - Macro skill progress (proficiency levels)
- `StudentMicroSkillProgress` - Micro skill mastery (0-1.0 scale)
- `Skill` - BNCC skills (1,407 skills)
- `MicroSkill` - Granular decomposition (6,867 microskills)
- `ContentSkillMapping` - Content-to-skill alignments

**Key Fields:**
- `studentId` → Organizoptera `Student.id` (UUID)
- `tenantId` → Organizoptera `SchoolNetwork.id` (UUID)
- `skillId` → Curriculoptera `Skill.id` (CUID)

## Performance

### Caching

The adapter includes built-in caching to reduce database load:

```typescript
// Cache is enabled by default with 5-minute TTL
const adapter = new CurriculopteraAdapter({
  curriculopteraPrisma,
  cacheEnabled: true,
  cacheTTL: 300, // seconds
});

// Clear cache manually if needed
adapter.clearCache(); // Clear all
adapter.clearCache('skill-progress:student-123'); // Clear specific key
```

### Query Optimization

- All queries include proper indexes on `studentId`, `tenantId`, `skillId`
- Pagination support (to be added)
- Batch queries for classroom/school aggregations

## Testing

```bash
# Run unit tests
pnpm test

# Run integration tests (requires Curriculoptera database)
pnpm test:integration
```

## TypeScript Support

Full TypeScript support with strict type checking:

```typescript
import type {
  SkillProgress,
  MicroSkillProgress,
  SchoolSkillDashboard,
} from '@organizoptera/curriculoptera-adapter';

// All types are fully typed and validated
```

## License

AGPL v3 (Open Core) + Commercial

## Related Packages

- `@curriculoptera/types` - Curriculoptera type definitions
- `@organizoptera/types` - Organizoptera type definitions
- `@organizoptera/core` - Core Organizoptera utilities

## Support

For issues or questions, see the main Cogg Ecosystem documentation.
