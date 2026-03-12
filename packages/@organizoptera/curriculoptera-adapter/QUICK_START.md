# Quick Start Guide

## Installation & Setup (5 minutes)

### 1. Build the Adapter

```bash
cd packages/@organizoptera/curriculoptera-adapter
pnpm install
pnpm build
```

### 2. Configure Environment

Add to your `.env`:

```env
ORGANIZOPTERA_DATABASE_URL="postgresql://user:pass@localhost:5432/organizoptera"
CURRICULOPTERA_DATABASE_URL="postgresql://user:pass@localhost:5432/curriculoptera"
```

### 3. Seed Student Skills

```bash
# From Organizoptera root
bun run scripts/seed-student-skills.ts

# Or with tsx
npx tsx scripts/seed-student-skills.ts
```

Expected output:
```
🌱 Seeding student skills...
✅ Found 720 active students
📚 Fetching skills from Curriculoptera...
...
📊 Seeding Summary:
  Students processed: 720
  Skill progress records: 45,632
  Microskill progress records: 123,456
✨ Seeding complete!
```

### 4. Verify Data

```bash
bun run scripts/verify-student-skills.ts
```

## Basic Usage

### Initialize Adapter

```typescript
import { CurriculopteraAdapter } from '@organizoptera/curriculoptera-adapter';
import { PrismaClient } from '@prisma/client';

const curriculoptera = new PrismaClient({
  datasources: {
    db: { url: process.env.CURRICULOPTERA_DATABASE_URL }
  }
});

const adapter = new CurriculopteraAdapter({
  curriculopteraPrisma: curriculoptera,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
});
```

### Get Student Skills

```typescript
const progress = await adapter.getStudentSkillProgress('student-uuid');
// Returns: SkillProgress[] with proficiency levels, practice counts, etc.
```

### Get Student Report

```typescript
const report = await adapter.getStudentCurriculumReport('student-uuid', '3º EF');
// Returns: Full curriculum report with subject breakdown
```

### Get School Dashboard

```typescript
const dashboard = await adapter.getSchoolSkillDashboard('school-uuid', 'network-uuid');
// Returns: School-wide analytics with grade/subject performance
```

## Complete Example

```typescript
import { CurriculopteraAdapter } from '@organizoptera/curriculoptera-adapter';
import { PrismaClient as OrganizopteraPrisma } from '@prisma/client';
import { PrismaClient as CurriculopteraPrisma } from '@prisma/client';

// Initialize clients
const organizoptera = new OrganizopteraPrisma();
const curriculoptera = new CurriculopteraPrisma({
  datasources: {
    db: { url: process.env.CURRICULOPTERA_DATABASE_URL }
  }
});

const adapter = new CurriculopteraAdapter({
  curriculopteraPrisma: curriculoptera,
});

// Get student with organization data
async function getStudentProfile(studentId: string) {
  const student = await organizoptera.student.findUnique({
    where: { id: studentId },
    include: {
      school: { include: { network: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          classroom: {
            include: { grade: true }
          }
        },
        take: 1,
      }
    }
  });

  if (!student) throw new Error('Student not found');

  const enrollment = student.enrollments[0];
  const gradeLevel = enrollment.classroom.grade.name; // "3º EF"

  // Get curriculum data
  const [skillProgress, report] = await Promise.all([
    adapter.getStudentSkillProgress(studentId),
    adapter.getStudentCurriculumReport(studentId, gradeLevel),
  ]);

  return {
    // Organization data
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    email: student.email,
    school: student.school.name,
    grade: gradeLevel,

    // Curriculum data
    skillsTracked: skillProgress.length,
    skillsMastered: skillProgress.filter(s => s.mastered).length,
    overallProficiency: report.overallProficiency,
    subjects: report.subjects,
    recentActivity: skillProgress
      .filter(s => s.lastPracticed)
      .sort((a, b) =>
        (b.lastPracticed?.getTime() || 0) - (a.lastPracticed?.getTime() || 0)
      )
      .slice(0, 5)
      .map(s => ({
        skill: s.skillCode,
        proficiency: s.proficiencyLevel,
        practiced: s.lastPracticed,
      })),
  };
}

// Usage
const profile = await getStudentProfile('student-uuid-123');
console.log(profile);
```

## Troubleshooting

### "Cannot connect to database"

Check your environment variables:
```bash
echo $ORGANIZOPTERA_DATABASE_URL
echo $CURRICULOPTERA_DATABASE_URL
```

### "No skills found for student"

Run the seed script:
```bash
bun run scripts/seed-student-skills.ts
```

### "Grade mapping not found"

Verify grade codes match:
- Organizoptera: `1EF`, `2EF`, ..., `9EF`
- Curriculoptera: `1ef`, `2ef`, ..., `9ef`

## Next Steps

1. Read the full documentation: `docs/CURRICULOPTERA_INTEGRATION.md`
2. Check the adapter README: `packages/@organizoptera/curriculoptera-adapter/README.md`
3. Build admin dashboards using the adapter methods
4. Add real-time progress updates
5. Implement adaptive learning recommendations

## API Reference

### Methods

- `getStudentSkillProgress(studentId)` → `SkillProgress[]`
- `getStudentMicroSkillProgress(studentId)` → `MicroSkillProgress[]`
- `getSchoolSkillDashboard(schoolId, networkId)` → `SchoolSkillDashboard`
- `getStudentCurriculumReport(studentId, gradeLevel)` → `StudentCurriculumReport`
- `getContentSkillAlignment(contentId, contentType)` → `SkillAlignment`
- `clearCache(key?)` → `void`

### Types

See `src/types.ts` for all exported types:
- `SkillProgress`
- `MicroSkillProgress`
- `ClassSkillSummary`
- `SchoolSkillDashboard`
- `StudentCurriculumReport`
- `SkillAlignment`

## Support

- Integration guide: `/docs/CURRICULOPTERA_INTEGRATION.md`
- Package README: `/packages/@organizoptera/curriculoptera-adapter/README.md`
- Type definitions: `/packages/@organizoptera/curriculoptera-adapter/src/types.ts`
