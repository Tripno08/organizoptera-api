/**
 * @organizoptera/types - Entities Tests
 */

import { describe, it, expect } from 'vitest';
import type {
  SchoolNetwork,
  School,
  SchoolYear,
  Grade,
  Classroom,
  Student,
  Teacher,
  Enrollment,
  TeacherClassroom,
  SchoolNetworkWithSchools,
  SchoolWithRelations,
  ClassroomWithRelations,
  StudentWithEnrollments,
  TeacherWithAssignments,
  NetworkStatus,
  SchoolStatus,
  YearStatus,
  ClassroomStatus,
  Shift,
  Gender,
  StudentStatus,
  EmploymentType,
  TeacherStatus,
  EnrollmentStatus,
} from '../entities';
import {
  schoolNetworkId,
  schoolId,
  schoolYearId,
  gradeId,
  classroomId,
  studentId,
  teacherId,
  enrollmentId,
} from '../branded';

describe('Entity Types', () => {
  describe('SchoolNetwork', () => {
    it('should accept valid SchoolNetwork', () => {
      const network: SchoolNetwork = {
        id: schoolNetworkId('network-1'),
        name: 'Test Network',
        slug: 'test-network',
        domain: 'network.test.com',
        status: 'ACTIVE' as NetworkStatus,
        settings: { theme: 'dark' },
        metadata: { region: 'south' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(network.id).toBe('network-1');
      expect(network.status).toBe('ACTIVE');
    });

    it('should accept nullable fields', () => {
      const network: SchoolNetwork = {
        id: schoolNetworkId('network-1'),
        name: 'Test Network',
        slug: 'test-network',
        domain: null,
        status: 'TRIAL' as NetworkStatus,
        settings: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(network.domain).toBeNull();
    });
  });

  describe('School', () => {
    it('should accept valid School', () => {
      const school: School = {
        id: schoolId('school-1'),
        networkId: schoolNetworkId('network-1'),
        name: 'Test School',
        slug: 'test-school',
        code: 'TST001',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'Brazil',
        phone: '+55 11 98765-4321',
        email: 'school@test.com',
        principalName: 'John Doe',
        status: 'ACTIVE' as SchoolStatus,
        settings: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(school.id).toBe('school-1');
      expect(school.networkId).toBe('network-1');
    });

    it('should accept nullable fields', () => {
      const school: School = {
        id: schoolId('school-1'),
        networkId: schoolNetworkId('network-1'),
        name: 'Test School',
        slug: 'test-school',
        code: null,
        address: null,
        city: null,
        state: null,
        country: 'Brazil',
        phone: null,
        email: null,
        principalName: null,
        status: 'MAINTENANCE' as SchoolStatus,
        settings: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(school.code).toBeNull();
    });
  });

  describe('SchoolYear', () => {
    it('should accept valid SchoolYear', () => {
      const year: SchoolYear = {
        id: schoolYearId('year-1'),
        schoolId: schoolId('school-1'),
        year: 2024,
        name: '2024 Academic Year',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-12-15'),
        isCurrent: true,
        status: 'ACTIVE' as YearStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(year.year).toBe(2024);
      expect(year.isCurrent).toBe(true);
    });

    it('should accept all year statuses', () => {
      const statuses: YearStatus[] = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
      for (const status of statuses) {
        const year: SchoolYear = {
          id: schoolYearId('year-1'),
          schoolId: schoolId('school-1'),
          year: 2024,
          name: 'Test Year',
          startDate: new Date(),
          endDate: new Date(),
          isCurrent: false,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(year.status).toBe(status);
      }
    });
  });

  describe('Grade', () => {
    it('should accept valid Grade', () => {
      const grade: Grade = {
        id: gradeId('grade-1'),
        schoolId: schoolId('school-1'),
        name: '1st Grade',
        code: 'G1',
        sequenceOrder: 1,
        educationLevel: 'elementary',
        metadata: { ageRange: '6-7' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(grade.sequenceOrder).toBe(1);
    });
  });

  describe('Classroom', () => {
    it('should accept valid Classroom', () => {
      const classroom: Classroom = {
        id: classroomId('classroom-1'),
        schoolId: schoolId('school-1'),
        gradeId: gradeId('grade-1'),
        schoolYearId: schoolYearId('year-1'),
        name: '1A',
        code: 'CL-1A',
        shift: 'MORNING' as Shift,
        capacity: 30,
        room: 'Room 101',
        status: 'ACTIVE' as ClassroomStatus,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(classroom.capacity).toBe(30);
      expect(classroom.shift).toBe('MORNING');
    });

    it('should accept all shifts', () => {
      const shifts: Shift[] = ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_TIME'];
      for (const shift of shifts) {
        const classroom: Classroom = {
          id: classroomId('classroom-1'),
          schoolId: schoolId('school-1'),
          gradeId: gradeId('grade-1'),
          schoolYearId: schoolYearId('year-1'),
          name: '1A',
          code: 'CL-1A',
          shift,
          capacity: 30,
          room: null,
          status: 'ACTIVE' as ClassroomStatus,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(classroom.shift).toBe(shift);
      }
    });
  });

  describe('Student', () => {
    it('should accept valid Student', () => {
      const student: Student = {
        id: studentId('student-1'),
        schoolId: schoolId('school-1'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        birthDate: new Date('2010-05-15'),
        gender: 'MALE' as Gender,
        studentCode: 'STD001',
        guardianName: 'Jane Doe',
        guardianPhone: '+55 11 98765-4321',
        guardianEmail: 'jane@example.com',
        address: '123 Test St',
        status: 'ACTIVE' as StudentStatus,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(student.firstName).toBe('John');
      expect(student.gender).toBe('MALE');
    });

    it('should accept all genders', () => {
      const genders: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
      for (const gender of genders) {
        const student: Student = {
          id: studentId('student-1'),
          schoolId: schoolId('school-1'),
          firstName: 'Test',
          lastName: 'Student',
          email: null,
          birthDate: null,
          gender,
          studentCode: null,
          guardianName: null,
          guardianPhone: null,
          guardianEmail: null,
          address: null,
          status: 'ACTIVE' as StudentStatus,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(student.gender).toBe(gender);
      }
    });

    it('should accept all student statuses', () => {
      const statuses: StudentStatus[] = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED'];
      for (const status of statuses) {
        const student: Student = {
          id: studentId('student-1'),
          schoolId: schoolId('school-1'),
          firstName: 'Test',
          lastName: 'Student',
          email: null,
          birthDate: null,
          gender: null,
          studentCode: null,
          guardianName: null,
          guardianPhone: null,
          guardianEmail: null,
          address: null,
          status,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(student.status).toBe(status);
      }
    });
  });

  describe('Teacher', () => {
    it('should accept valid Teacher', () => {
      const teacher: Teacher = {
        id: teacherId('teacher-1'),
        schoolId: schoolId('school-1'),
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@school.com',
        phone: '+55 11 98765-4321',
        specialization: 'Mathematics',
        employmentType: 'FULL_TIME' as EmploymentType,
        status: 'ACTIVE' as TeacherStatus,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(teacher.firstName).toBe('Maria');
      expect(teacher.employmentType).toBe('FULL_TIME');
    });

    it('should accept all employment types', () => {
      const types: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'SUBSTITUTE'];
      for (const employmentType of types) {
        const teacher: Teacher = {
          id: teacherId('teacher-1'),
          schoolId: schoolId('school-1'),
          firstName: 'Test',
          lastName: 'Teacher',
          email: null,
          phone: null,
          specialization: null,
          employmentType,
          status: 'ACTIVE' as TeacherStatus,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(teacher.employmentType).toBe(employmentType);
      }
    });

    it('should accept all teacher statuses', () => {
      const statuses: TeacherStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
      for (const status of statuses) {
        const teacher: Teacher = {
          id: teacherId('teacher-1'),
          schoolId: schoolId('school-1'),
          firstName: 'Test',
          lastName: 'Teacher',
          email: null,
          phone: null,
          specialization: null,
          employmentType: 'FULL_TIME' as EmploymentType,
          status,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(teacher.status).toBe(status);
      }
    });
  });

  describe('TeacherClassroom', () => {
    it('should accept valid TeacherClassroom', () => {
      const tc: TeacherClassroom = {
        id: 'tc-1',
        teacherId: teacherId('teacher-1'),
        classroomId: classroomId('classroom-1'),
        subject: 'Mathematics',
        isMainTeacher: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(tc.isMainTeacher).toBe(true);
    });
  });

  describe('Enrollment', () => {
    it('should accept valid Enrollment', () => {
      const enrollment: Enrollment = {
        id: enrollmentId('enrollment-1'),
        studentId: studentId('student-1'),
        classroomId: classroomId('classroom-1'),
        schoolYearId: schoolYearId('year-1'),
        enrollmentDate: new Date(),
        status: 'ACTIVE' as EnrollmentStatus,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(enrollment.status).toBe('ACTIVE');
    });

    it('should accept all enrollment statuses', () => {
      const statuses: EnrollmentStatus[] = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'COMPLETED', 'CANCELLED'];
      for (const status of statuses) {
        const enrollment: Enrollment = {
          id: enrollmentId('enrollment-1'),
          studentId: studentId('student-1'),
          classroomId: classroomId('classroom-1'),
          schoolYearId: schoolYearId('year-1'),
          enrollmentDate: new Date(),
          status,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(enrollment.status).toBe(status);
      }
    });
  });

  describe('Nested Types', () => {
    it('should accept SchoolNetworkWithSchools', () => {
      const network: SchoolNetworkWithSchools = {
        id: schoolNetworkId('network-1'),
        name: 'Test Network',
        slug: 'test-network',
        domain: null,
        status: 'ACTIVE' as NetworkStatus,
        settings: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        schools: [
          {
            id: schoolId('school-1'),
            networkId: schoolNetworkId('network-1'),
            name: 'School 1',
            slug: 'school-1',
            code: null,
            address: null,
            city: null,
            state: null,
            country: 'Brazil',
            phone: null,
            email: null,
            principalName: null,
            status: 'ACTIVE' as SchoolStatus,
            settings: null,
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(network.schools).toHaveLength(1);
    });

    it('should accept SchoolWithRelations', () => {
      const school: SchoolWithRelations = {
        id: schoolId('school-1'),
        networkId: schoolNetworkId('network-1'),
        name: 'Test School',
        slug: 'test-school',
        code: null,
        address: null,
        city: null,
        state: null,
        country: 'Brazil',
        phone: null,
        email: null,
        principalName: null,
        status: 'ACTIVE' as SchoolStatus,
        settings: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        grades: [],
        classrooms: [],
        teachers: [],
        students: [],
      };

      expect(school.grades).toEqual([]);
    });

    it('should accept ClassroomWithRelations', () => {
      const classroom: ClassroomWithRelations = {
        id: classroomId('classroom-1'),
        schoolId: schoolId('school-1'),
        gradeId: gradeId('grade-1'),
        schoolYearId: schoolYearId('year-1'),
        name: '1A',
        code: 'CL-1A',
        shift: 'MORNING' as Shift,
        capacity: 30,
        room: null,
        status: 'ACTIVE' as ClassroomStatus,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        enrollments: [],
        teacherAssignments: [],
      };

      expect(classroom.enrollments).toEqual([]);
    });

    it('should accept StudentWithEnrollments', () => {
      const student: StudentWithEnrollments = {
        id: studentId('student-1'),
        schoolId: schoolId('school-1'),
        firstName: 'Test',
        lastName: 'Student',
        email: null,
        birthDate: null,
        gender: null,
        studentCode: null,
        guardianName: null,
        guardianPhone: null,
        guardianEmail: null,
        address: null,
        status: 'ACTIVE' as StudentStatus,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        enrollments: [],
      };

      expect(student.enrollments).toEqual([]);
    });

    it('should accept TeacherWithAssignments', () => {
      const teacher: TeacherWithAssignments = {
        id: teacherId('teacher-1'),
        schoolId: schoolId('school-1'),
        firstName: 'Test',
        lastName: 'Teacher',
        email: null,
        phone: null,
        specialization: null,
        employmentType: 'FULL_TIME' as EmploymentType,
        status: 'ACTIVE' as TeacherStatus,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        classroomAssignments: [],
      };

      expect(teacher.classroomAssignments).toEqual([]);
    });
  });
});
