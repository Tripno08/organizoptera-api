/**
 * CoggCopiloto Demo Seed Script
 *
 * Creates a complete demo environment matching actual Organizoptera schema:
 * - 1 SchoolNetwork
 * - 1 School
 * - 1 SchoolYear (2026)
 * - 1 Grade (4º Ano)
 * - 1 Classroom (4ºA)
 * - 1 Teacher (professora@escola.demo / demo2026)
 * - 12 Students (matching App.jsx mock)
 * - 12 Enrollments
 *
 * Usage:
 *   cd Organizoptera
 *   DATABASE_URL="..." pnpm exec tsx prisma/seed-cogg-copiloto.ts
 */

import { PrismaClient } from '../services/org-api/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 CoggCopiloto Seed: Starting...\n');

  // ========== 1. SchoolNetwork ==========
  const network = await prisma.schoolNetwork.upsert({
    where: { slug: 'rede-demo-coggcopiloto' },
    update: {},
    create: {
      name: 'Rede Demo CoggCopiloto',
      slug: 'rede-demo-coggcopiloto',
      domain: 'demo.coggcopiloto.com',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ SchoolNetwork created: ${network.name} (${network.id})`);

  // ========== 2. School ==========
  const school = await prisma.school.upsert({
    where: {
      networkId_slug: {
        networkId: network.id,
        slug: 'emef-maria-silva',
      },
    },
    update: {},
    create: {
      networkId: network.id,
      name: 'EMEF Professora Maria Silva',
      slug: 'emef-maria-silva',
      code: 'DEMO-SCHOOL-001',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ School created: ${school.name} (${school.id})`);

  // ========== 3. SchoolYear ==========
  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      schoolId_year: {
        schoolId: school.id,
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      year: 2026,
      name: '2026',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-15'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ SchoolYear created: 2026 (${schoolYear.id})`);

  // ========== 4. Grade ==========
  const grade = await prisma.grade.upsert({
    where: {
      schoolId_code: {
        schoolId: school.id,
        code: '4EF',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: '4º Ano',
      code: '4EF',
      sequenceOrder: 4,
      educationLevel: 'EF',
    },
  });
  console.log(`✅ Grade created: ${grade.name} (${grade.id})`);

  // ========== 5. Classroom ==========
  const classroom = await prisma.classroom.upsert({
    where: {
      schoolId_gradeId_schoolYearId_code: {
        schoolId: school.id,
        gradeId: grade.id,
        schoolYearId: schoolYear.id,
        code: '4A',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      gradeId: grade.id,
      schoolYearId: schoolYear.id,
      name: 'Turma A',
      code: '4A',
      shift: 'MORNING',
      capacity: 30,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Classroom created: ${classroom.name} (${classroom.id})`);

  // ========== 6. Teacher ==========
  // Try to find existing teacher first
  let teacher = await prisma.teacher.findFirst({
    where: {
      schoolId: school.id,
      email: 'professora@escola.demo',
    },
  });

  if (!teacher) {
    // Create new teacher (without passwordHash for now - database column doesn't exist yet)
    teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        email: 'professora@escola.demo',
        firstName: 'Ana',
        lastName: 'Costa',
        specialization: 'Pedagogia',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Teacher created: ${teacher.firstName} ${teacher.lastName}`);
  } else {
    console.log(`✅ Teacher already exists: ${teacher.firstName} ${teacher.lastName}`);
  }
  console.log(`   📧 Email: ${teacher.email}`)
  console.log(`   ⚠️  Note: Password authentication not set up yet (database needs migration)\n`);

  // ========== 7. Assign Teacher to Classroom ==========
  await prisma.teacherClassroom.upsert({
    where: {
      teacherId_classroomId: {
        teacherId: teacher.id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher.id,
      classroomId: classroom.id,
      isMainTeacher: true,
    },
  });

  // ========== 8. Students (12 total, matching App.jsx mock) ==========
  const studentsData = [
    // Row 0 (cols 0-4)
    { firstName: 'Ana', lastName: 'Silva', birthDate: new Date('2015-03-10'), code: 'RA001' },
    { firstName: 'Bruno', lastName: 'Costa', birthDate: new Date('2015-05-22'), code: 'RA002' },
    { firstName: 'Carlos', lastName: 'Souza', birthDate: new Date('2015-01-15'), code: 'RA003' },
    { firstName: 'Diana', lastName: 'Oliveira', birthDate: new Date('2015-07-08'), code: 'RA004' },
    { firstName: 'Eduardo', lastName: 'Santos', birthDate: new Date('2015-09-30'), code: 'RA005' },

    // Row 1 (cols 0-4)
    { firstName: 'Fernanda', lastName: 'Lima', birthDate: new Date('2015-11-12'), code: 'RA006' },
    { firstName: 'Gabriel', lastName: 'Pereira', birthDate: new Date('2015-02-28'), code: 'RA007' },
    { firstName: 'Helena', lastName: 'Rodrigues', birthDate: new Date('2015-04-17'), code: 'RA008' },
    { firstName: 'Igor', lastName: 'Almeida', birthDate: new Date('2015-06-05'), code: 'RA009' },
    { firstName: 'Julia', lastName: 'Ferreira', birthDate: new Date('2015-08-21'), code: 'RA010' },

    // Row 2 (cols 0-1)
    { firstName: 'Kevin', lastName: 'Martins', birthDate: new Date('2015-10-03'), code: 'RA011' },
    { firstName: 'Laura', lastName: 'Carvalho', birthDate: new Date('2015-12-19'), code: 'RA012' },
  ];

  const students: any[] = [];
  for (const data of studentsData) {
    // Try to find existing student first
    let student = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        studentCode: data.code,
      },
    });

    if (!student) {
      // Create new student
      student = await prisma.student.create({
        data: {
          schoolId: school.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: `${data.firstName.toLowerCase()}@escola.demo`,
          birthDate: data.birthDate,
          studentCode: data.code,
          gender: 'PREFER_NOT_TO_SAY',
          status: 'ACTIVE',
        },
      });
    }
    students.push(student);
  }
  console.log(`✅ Students created: ${students.length} students`);

  // ========== 9. Enrollments ==========
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: {
        studentId_classroomId_schoolYearId: {
          studentId: student.id,
          classroomId: classroom.id,
          schoolYearId: schoolYear.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        classroomId: classroom.id,
        schoolYearId: schoolYear.id,
        enrollmentDate: new Date('2026-02-01'),
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✅ Enrollments created: ${students.length} enrollments\n`);

  // ========== Summary ==========
  console.log('📊 Summary:');
  console.log(`   Network ID:   ${network.id}`);
  console.log(`   School ID:    ${school.id}`);
  console.log(`   Classroom ID: ${classroom.id}`);
  console.log(`   Teacher ID:   ${teacher.id}`);
  console.log(`   Students:     ${students.length}`);
  console.log('\n🎉 Seed complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Use Classroom ID in frontend: VITE_CLASSROOM_ID=' + classroom.id);
  console.log('   2. Login with: professora@escola.demo / demo2026');
  console.log('   3. Run Profileoptera seed next');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
