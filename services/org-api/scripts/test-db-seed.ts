/**
 * Test Database Seed Script
 *
 * Populates test database with minimal data required for E2E tests
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Seeding test database...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.schoolYear.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.school.deleteMany();
  await prisma.schoolNetwork.deleteMany();

  console.log('  ✓ Cleaned existing data');

  // Create test school network (let Prisma auto-generate UUIDs)
  const network = await prisma.schoolNetwork.create({
    data: {
      name: 'Demo Network',
      slug: 'demo-network',
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created school network:', network.name, `(${network.id})`);

  // Create test school
  const school = await prisma.school.create({
    data: {
      networkId: network.id,
      name: 'Demo School 1',
      slug: 'demo-school-1',
      code: 'DS001',
      country: 'BR',
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created school:', school.name, `(${school.id})`);

  // Create school year (required for classrooms)
  const schoolYear = await prisma.schoolYear.create({
    data: {
      schoolId: school.id,
      year: 2025,
      name: '2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created school year:', schoolYear.name);

  // Create test grades
  const grade1 = await prisma.grade.create({
    data: {
      schoolId: school.id,
      name: '1º Ano EF',
      code: '1EF',
      educationLevel: 'EF',
      sequenceOrder: 1,
    },
  });

  const grade2 = await prisma.grade.create({
    data: {
      schoolId: school.id,
      name: '2º Ano EF',
      code: '2EF',
      educationLevel: 'EF',
      sequenceOrder: 2,
    },
  });
  console.log('  ✓ Created grades:', grade1.name, ',', grade2.name);

  // Create test classrooms
  const classroom = await prisma.classroom.create({
    data: {
      schoolId: school.id,
      gradeId: grade1.id,
      schoolYearId: schoolYear.id,
      name: '1º A',
      code: '1A',
      capacity: 30,
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created classroom:', classroom.name);

  // Create test students
  const student1 = await prisma.student.create({
    data: {
      schoolId: school.id,
      studentCode: 'STU001',
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao.silva@test.com',
      birthDate: new Date('2015-03-15'),
      status: 'ACTIVE',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      schoolId: school.id,
      studentCode: 'STU002',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@test.com',
      birthDate: new Date('2015-07-22'),
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created students:', student1.firstName, ',', student2.firstName);

  // Create test teacher
  const teacher = await prisma.teacher.create({
    data: {
      schoolId: school.id,
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana.costa@test.com',
      status: 'ACTIVE',
    },
  });
  console.log('  ✓ Created teacher:', teacher.firstName, teacher.lastName);

  console.log('\n✅ Test database seeded successfully!\n');
  console.log('Test Data Summary:');
  console.log(`  - 1 School Network: ${network.name}`);
  console.log(`  - 1 School: ${school.name}`);
  console.log(`  - 2 Grades: ${grade1.name}, ${grade2.name}`);
  console.log(`  - 1 Classroom: ${classroom.name}`);
  console.log(`  - 2 Students: ${student1.firstName}, ${student2.firstName}`);
  console.log(`  - 1 Teacher: ${teacher.firstName} ${teacher.lastName}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
