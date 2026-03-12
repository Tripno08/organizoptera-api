/**
 * Seed Script: Jedi Schools Network
 *
 * Creates a complete school network with:
 * - 1 Network: Jedi Schools
 * - 3 Schools: Yoda Masters, Princesa Lea, Skywalkers
 * - 9 Grades per school (1º-9º ano)
 * - 2 Classrooms per grade (A/B) = 18 classrooms per school
 * - 1 Math teacher per classroom = 18 teachers per school
 * - 18 students per classroom = 324 students per school
 * - 1 Coordinator per school + 1 Network coordinator
 * - 1 Psychologist per school
 * - 2 RTI Tier 2 Tutors per school (1 for grades 1-4, 1 for grades 5-9)
 *
 * Total: ~2,100 records
 */

import { PrismaClient } from '../services/org-api/generated/prisma';

const prisma = new PrismaClient();

// Brazilian first names for students
const firstNames = [
  'Lucas', 'Gabriel', 'Miguel', 'Arthur', 'Heitor', 'Theo', 'Davi', 'Bernardo',
  'Sofia', 'Helena', 'Valentina', 'Laura', 'Isabella', 'Manuela', 'Julia', 'Alice',
  'Pedro', 'Lorenzo', 'Benjamin', 'Nicolas', 'Guilherme', 'Rafael', 'Joaquim', 'Samuel',
  'Maria', 'Luisa', 'Giovanna', 'Beatriz', 'Lara', 'Mariana', 'Isadora', 'Antonella',
  'Enzo', 'Matheus', 'Felipe', 'Eduardo', 'Gustavo', 'Leonardo', 'Daniel', 'Bruno',
  'Ana', 'Livia', 'Cecilia', 'Clara', 'Lorena', 'Fernanda', 'Camila', 'Carolina',
  'Thiago', 'Murilo', 'Caio', 'Vinicius', 'Ryan', 'Cauã', 'João', 'Henrique',
  'Leticia', 'Amanda', 'Bruna', 'Larissa', 'Natalia', 'Patricia', 'Rebeca', 'Sarah'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Gonçalves', 'Santana', 'Teixeira', 'Araújo', 'Pinto', 'Correia', 'Monteiro', 'Campos'
];

const guardianFirstNames = [
  'Carlos', 'Roberto', 'José', 'Antonio', 'Francisco', 'Paulo', 'Marcos', 'Luis',
  'Maria', 'Ana', 'Francisca', 'Adriana', 'Juliana', 'Márcia', 'Sandra', 'Claudia',
  'André', 'Ricardo', 'Sérgio', 'Rodrigo', 'Fernando', 'Marcelo', 'Jorge', 'Claudio',
  'Rosana', 'Simone', 'Cristina', 'Luciana', 'Renata', 'Fabiana', 'Denise', 'Paula'
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const ddd = ['11', '21', '31', '41', '51', '61', '71', '81'][Math.floor(Math.random() * 8)];
  const number = Math.floor(Math.random() * 900000000 + 100000000);
  return `(${ddd}) 9${number.toString().substring(0, 4)}-${number.toString().substring(4, 8)}`;
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  return `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@${domain}`;
}

function generateBirthDate(gradeLevel: number): Date {
  // Grade 1 = ~6-7 years old, Grade 9 = ~14-15 years old
  const baseAge = 5 + gradeLevel;
  const year = 2026 - baseAge - Math.floor(Math.random() * 2);
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

async function main() {
  console.log('🚀 Starting Jedi Schools seed...\n');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.enrollment.deleteMany({});
  await prisma.teacherClassroom.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.schoolYear.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.schoolNetwork.deleteMany({});

  // 1. Create School Network
  console.log('🌐 Creating Jedi Schools network...');
  const network = await prisma.schoolNetwork.create({
    data: {
      name: 'Jedi Schools',
      slug: 'jedi-schools',
      domain: 'jedischools.edu.br',
      status: 'ACTIVE',
      settings: {
        theme: 'star-wars',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo'
      },
      metadata: {
        networkCoordinator: {
          name: 'Mestre Yoda',
          email: 'yoda@jedischools.edu.br',
          phone: '(11) 99999-9999',
          role: 'NETWORK_COORDINATOR'
        }
      }
    }
  });
  console.log(`   ✅ Network created: ${network.name} (${network.id})`);

  // 2. Create Schools
  const schoolsData = [
    {
      name: 'Yoda Masters',
      slug: 'yoda-masters',
      code: 'JEDI001',
      city: 'São Paulo',
      state: 'SP',
      principalName: 'Mestre Qui-Gon Jinn'
    },
    {
      name: 'Princesa Lea',
      slug: 'princesa-lea',
      code: 'JEDI002',
      city: 'Rio de Janeiro',
      state: 'RJ',
      principalName: 'Princesa Leia Organa'
    },
    {
      name: 'Skywalkers',
      slug: 'skywalkers',
      code: 'JEDI003',
      city: 'Brasília',
      state: 'DF',
      principalName: 'Luke Skywalker'
    }
  ];

  console.log('\n🏫 Creating schools...');
  const schools = [];
  for (const schoolData of schoolsData) {
    const school = await prisma.school.create({
      data: {
        networkId: network.id,
        name: schoolData.name,
        slug: schoolData.slug,
        code: schoolData.code,
        city: schoolData.city,
        state: schoolData.state,
        country: 'BR',
        principalName: schoolData.principalName,
        email: `contato@${schoolData.slug}.jedischools.edu.br`,
        phone: generatePhone(),
        status: 'ACTIVE',
        metadata: {
          coordinator: {
            name: `Coordenador ${schoolData.name}`,
            email: `coordenador@${schoolData.slug}.jedischools.edu.br`,
            role: 'SCHOOL_COORDINATOR'
          },
          psychologist: {
            name: `Dr. Jedi ${randomFrom(lastNames)}`,
            email: `psicologo@${schoolData.slug}.jedischools.edu.br`,
            role: 'SCHOOL_PSYCHOLOGIST',
            crp: `${schoolData.state === 'SP' ? '06' : schoolData.state === 'RJ' ? '05' : '01'}/${Math.floor(Math.random() * 90000 + 10000)}`
          },
          rtiTutors: [
            {
              name: `Tutor RTI Anos Iniciais - ${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
              email: `rti-iniciais@${schoolData.slug}.jedischools.edu.br`,
              role: 'RTI_TIER2_TUTOR',
              grades: [1, 2, 3, 4],
              specialization: 'Anos Iniciais (1º-4º)'
            },
            {
              name: `Tutor RTI Anos Finais - ${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
              email: `rti-finais@${schoolData.slug}.jedischools.edu.br`,
              role: 'RTI_TIER2_TUTOR',
              grades: [5, 6, 7, 8, 9],
              specialization: 'Anos Finais (5º-9º)'
            }
          ]
        }
      }
    });
    schools.push(school);
    console.log(`   ✅ School created: ${school.name} (${school.city}/${school.state})`);
  }

  // 3. Create Grades for each school
  console.log('\n📚 Creating grades (1º-9º ano)...');
  const gradesPerSchool: Record<string, typeof prisma.grade.create extends (args: { data: infer D }) => Promise<infer R> ? R[] : never> = {};

  for (const school of schools) {
    gradesPerSchool[school.id] = [];
    for (let i = 1; i <= 9; i++) {
      const grade = await prisma.grade.create({
        data: {
          schoolId: school.id,
          name: `${i}º Ano`,
          code: `${i}EF`,
          sequenceOrder: i,
          educationLevel: 'EF',
          metadata: {
            ageRange: `${5 + i}-${6 + i} anos`,
            segment: i <= 5 ? 'Anos Iniciais' : 'Anos Finais'
          }
        }
      });
      gradesPerSchool[school.id].push(grade as any);
    }
    console.log(`   ✅ Created 9 grades for ${school.name}`);
  }

  // 4. Create School Year 2026
  console.log('\n📅 Creating school year 2026...');
  const schoolYearsPerSchool: Record<string, any> = {};

  for (const school of schools) {
    const schoolYear = await prisma.schoolYear.create({
      data: {
        schoolId: school.id,
        year: 2026,
        name: 'Ano Letivo 2026',
        startDate: new Date('2026-02-02'),
        endDate: new Date('2026-12-18'),
        isCurrent: true,
        status: 'ACTIVE'
      }
    });
    schoolYearsPerSchool[school.id] = schoolYear;
    console.log(`   ✅ School year 2026 created for ${school.name}`);
  }

  // 5. Create Classrooms (2 per grade = 18 per school)
  console.log('\n🏛️ Creating classrooms (2 per grade)...');
  const classroomsPerSchool: Record<string, any[]> = {};

  for (const school of schools) {
    classroomsPerSchool[school.id] = [];
    for (const grade of gradesPerSchool[school.id]) {
      for (const suffix of ['A', 'B']) {
        const classroom = await prisma.classroom.create({
          data: {
            schoolId: school.id,
            gradeId: grade.id,
            schoolYearId: schoolYearsPerSchool[school.id].id,
            name: `Turma ${suffix}`,
            code: `${grade.code}${suffix}`,
            shift: suffix === 'A' ? 'MORNING' : 'AFTERNOON',
            capacity: 25,
            room: `Sala ${grade.sequenceOrder}${suffix}`,
            status: 'ACTIVE'
          }
        });
        classroomsPerSchool[school.id].push({ ...classroom, grade });
      }
    }
    console.log(`   ✅ Created 18 classrooms for ${school.name}`);
  }

  // 6. Create Math Teachers (1 per classroom = 18 per school)
  console.log('\n👨‍🏫 Creating math teachers (1 per classroom)...');
  const teachersPerSchool: Record<string, any[]> = {};

  for (const school of schools) {
    teachersPerSchool[school.id] = [];
    let teacherIndex = 0;

    for (const classroom of classroomsPerSchool[school.id]) {
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);

      const teacher = await prisma.teacher.create({
        data: {
          schoolId: school.id,
          firstName: firstName,
          lastName: lastName,
          email: generateEmail(firstName, lastName, `${school.slug}.jedischools.edu.br`),
          phone: generatePhone(),
          specialization: 'Matemática',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          metadata: {
            registration: `PROF${school.code}${(++teacherIndex).toString().padStart(3, '0')}`,
            formation: 'Licenciatura em Matemática',
            yearsOfExperience: Math.floor(Math.random() * 15) + 2
          }
        }
      });
      teachersPerSchool[school.id].push(teacher);

      // Assign teacher to classroom
      await prisma.teacherClassroom.create({
        data: {
          teacherId: teacher.id,
          classroomId: classroom.id,
          subject: 'Matemática',
          isMainTeacher: true
        }
      });
    }
    console.log(`   ✅ Created 18 math teachers for ${school.name}`);
  }

  // 7. Create Students (18 per classroom = 324 per school)
  console.log('\n👨‍🎓 Creating students (18 per classroom)...');
  let totalStudents = 0;

  for (const school of schools) {
    let studentIndex = 0;

    for (const classroom of classroomsPerSchool[school.id]) {
      for (let i = 0; i < 18; i++) {
        const firstName = randomFrom(firstNames);
        const lastName = randomFrom(lastNames);
        const guardianFirstName = randomFrom(guardianFirstNames);
        const guardianLastName = randomFrom(lastNames);

        const student = await prisma.student.create({
          data: {
            schoolId: school.id,
            firstName: firstName,
            lastName: lastName,
            email: generateEmail(firstName, lastName, `aluno.${school.slug}.jedischools.edu.br`),
            birthDate: generateBirthDate(classroom.grade.sequenceOrder),
            gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
            studentCode: `RA${school.code}${(++studentIndex).toString().padStart(4, '0')}`,
            guardianName: `${guardianFirstName} ${guardianLastName}`,
            guardianPhone: generatePhone(),
            guardianEmail: generateEmail(guardianFirstName, guardianLastName, 'gmail.com'),
            status: 'ACTIVE',
            metadata: {
              guardianRelation: Math.random() > 0.5 ? 'Pai/Mãe' : 'Responsável Legal',
              emergencyContact: generatePhone(),
              bloodType: randomFrom(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
              allergies: Math.random() > 0.9 ? randomFrom(['Amendoim', 'Lactose', 'Glúten']) : null
            }
          }
        });

        // Create enrollment
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            classroomId: classroom.id,
            schoolYearId: schoolYearsPerSchool[school.id].id,
            enrollmentDate: new Date('2026-01-15'),
            status: 'ACTIVE'
          }
        });

        totalStudents++;
      }
    }
    console.log(`   ✅ Created 324 students for ${school.name}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 JEDI SCHOOLS NETWORK CREATED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log(`
📊 Summary:
   • 1 School Network: Jedi Schools
   • 3 Schools: Yoda Masters, Princesa Lea, Skywalkers
   • 27 Grades (9 per school)
   • 3 School Years (2026)
   • 54 Classrooms (18 per school)
   • 54 Math Teachers (1 per classroom)
   • 54 Teacher-Classroom assignments
   • ${totalStudents} Students (18 per classroom)
   • ${totalStudents} Enrollments

🎭 Staff (stored in metadata):
   • 1 Network Coordinator: Mestre Yoda
   • 3 School Coordinators (1 per school)
   • 3 School Psychologists (1 per school)
   • 6 RTI Tier 2 Tutors (2 per school: 1 for grades 1-4, 1 for grades 5-9)

🔗 API Endpoints:
   • GET http://192.168.15.6:3200/api/school-networks
   • GET http://192.168.15.6:3200/api/schools
   • GET http://192.168.15.6:3200/api/classrooms
   • GET http://192.168.15.6:3200/api/teachers
   • GET http://192.168.15.6:3200/api/students
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
