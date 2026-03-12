/**
 * @organizoptera/types - DTO Tests
 */

import { describe, it, expect } from 'vitest';
import type {
  CreateSchoolNetworkDto,
  UpdateSchoolNetworkDto,
  CreateSchoolDto,
  UpdateSchoolDto,
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  CreateGradeDto,
  UpdateGradeDto,
  CreateClassroomDto,
  UpdateClassroomDto,
  CreateStudentDto,
  UpdateStudentDto,
  CreateTeacherDto,
  UpdateTeacherDto,
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  BulkEnrollmentDto,
  AssignTeacherDto,
  UpdateTeacherAssignmentDto,
  PaginationDto,
  SchoolFilterDto,
  StudentFilterDto,
  TeacherFilterDto,
  ClassroomFilterDto,
  PaginatedResponse,
  ApiResponse,
} from '../dto';

describe('DTO Types', () => {
  describe('CreateSchoolNetworkDto', () => {
    it('should accept required fields only', () => {
      const dto: CreateSchoolNetworkDto = {
        name: 'Test Network',
        slug: 'test-network',
      };

      expect(dto.name).toBe('Test Network');
      expect(dto.status).toBeUndefined();
    });

    it('should accept all optional fields', () => {
      const dto: CreateSchoolNetworkDto = {
        name: 'Test Network',
        slug: 'test-network',
        domain: 'test.network.com',
        status: 'ACTIVE',
        settings: { theme: 'dark' },
        metadata: { region: 'south' },
      };

      expect(dto.domain).toBe('test.network.com');
      expect(dto.settings?.theme).toBe('dark');
    });
  });

  describe('UpdateSchoolNetworkDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateSchoolNetworkDto = {
        name: 'Updated Network',
      };

      expect(dto.name).toBe('Updated Network');
      expect(dto.slug).toBeUndefined();
    });

    it('should accept empty update', () => {
      const dto: UpdateSchoolNetworkDto = {};
      expect(Object.keys(dto)).toHaveLength(0);
    });
  });

  describe('CreateSchoolDto', () => {
    it('should accept required fields only', () => {
      const dto: CreateSchoolDto = {
        networkId: 'network-1',
        name: 'Test School',
        slug: 'test-school',
      };

      expect(dto.networkId).toBe('network-1');
    });

    it('should accept all optional fields', () => {
      const dto: CreateSchoolDto = {
        networkId: 'network-1',
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
        status: 'ACTIVE',
        settings: {},
        metadata: {},
      };

      expect(dto.code).toBe('TST001');
      expect(dto.country).toBe('Brazil');
    });
  });

  describe('UpdateSchoolDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateSchoolDto = {
        principalName: 'New Principal',
        status: 'MAINTENANCE',
      };

      expect(dto.principalName).toBe('New Principal');
      expect(dto.status).toBe('MAINTENANCE');
    });
  });

  describe('CreateSchoolYearDto', () => {
    it('should accept required fields', () => {
      const dto: CreateSchoolYearDto = {
        schoolId: 'school-1',
        year: 2024,
        name: '2024 Academic Year',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-12-15'),
      };

      expect(dto.year).toBe(2024);
    });

    it('should accept string dates', () => {
      const dto: CreateSchoolYearDto = {
        schoolId: 'school-1',
        year: 2024,
        name: '2024 Academic Year',
        startDate: '2024-02-01',
        endDate: '2024-12-15',
      };

      expect(dto.startDate).toBe('2024-02-01');
    });

    it('should accept optional fields', () => {
      const dto: CreateSchoolYearDto = {
        schoolId: 'school-1',
        year: 2024,
        name: '2024',
        startDate: new Date(),
        endDate: new Date(),
        isCurrent: true,
        status: 'ACTIVE',
      };

      expect(dto.isCurrent).toBe(true);
    });
  });

  describe('UpdateSchoolYearDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateSchoolYearDto = {
        status: 'COMPLETED',
        isCurrent: false,
      };

      expect(dto.status).toBe('COMPLETED');
    });
  });

  describe('CreateGradeDto', () => {
    it('should accept required fields', () => {
      const dto: CreateGradeDto = {
        schoolId: 'school-1',
        name: '1st Grade',
        code: 'G1',
        sequenceOrder: 1,
      };

      expect(dto.sequenceOrder).toBe(1);
    });

    it('should accept optional fields', () => {
      const dto: CreateGradeDto = {
        schoolId: 'school-1',
        name: '1st Grade',
        code: 'G1',
        sequenceOrder: 1,
        educationLevel: 'elementary',
        metadata: { ageRange: '6-7' },
      };

      expect(dto.educationLevel).toBe('elementary');
    });
  });

  describe('UpdateGradeDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateGradeDto = {
        sequenceOrder: 2,
      };

      expect(dto.sequenceOrder).toBe(2);
    });
  });

  describe('CreateClassroomDto', () => {
    it('should accept required fields', () => {
      const dto: CreateClassroomDto = {
        schoolId: 'school-1',
        gradeId: 'grade-1',
        schoolYearId: 'year-1',
        name: '1A',
        code: 'CL-1A',
      };

      expect(dto.name).toBe('1A');
    });

    it('should accept optional fields', () => {
      const dto: CreateClassroomDto = {
        schoolId: 'school-1',
        gradeId: 'grade-1',
        schoolYearId: 'year-1',
        name: '1A',
        code: 'CL-1A',
        shift: 'MORNING',
        capacity: 30,
        room: 'Room 101',
        status: 'ACTIVE',
        metadata: {},
      };

      expect(dto.shift).toBe('MORNING');
      expect(dto.capacity).toBe(30);
    });
  });

  describe('UpdateClassroomDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateClassroomDto = {
        capacity: 35,
        shift: 'AFTERNOON',
      };

      expect(dto.capacity).toBe(35);
    });
  });

  describe('CreateStudentDto', () => {
    it('should accept required fields', () => {
      const dto: CreateStudentDto = {
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(dto.firstName).toBe('John');
    });

    it('should accept all optional fields', () => {
      const dto: CreateStudentDto = {
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        birthDate: new Date('2010-05-15'),
        gender: 'MALE',
        studentCode: 'STD001',
        guardianName: 'Jane Doe',
        guardianPhone: '+55 11 98765-4321',
        guardianEmail: 'jane@example.com',
        address: '123 Test St',
        status: 'ACTIVE',
        metadata: {},
      };

      expect(dto.gender).toBe('MALE');
      expect(dto.guardianName).toBe('Jane Doe');
    });
  });

  describe('UpdateStudentDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateStudentDto = {
        status: 'TRANSFERRED',
        address: 'New Address',
      };

      expect(dto.status).toBe('TRANSFERRED');
    });
  });

  describe('CreateTeacherDto', () => {
    it('should accept required fields', () => {
      const dto: CreateTeacherDto = {
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
      };

      expect(dto.firstName).toBe('Maria');
    });

    it('should accept optional fields', () => {
      const dto: CreateTeacherDto = {
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@school.com',
        phone: '+55 11 98765-4321',
        specialization: 'Mathematics',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        metadata: {},
      };

      expect(dto.employmentType).toBe('FULL_TIME');
    });
  });

  describe('UpdateTeacherDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateTeacherDto = {
        specialization: 'Physics',
        status: 'ON_LEAVE',
      };

      expect(dto.specialization).toBe('Physics');
    });
  });

  describe('CreateEnrollmentDto', () => {
    it('should accept required fields', () => {
      const dto: CreateEnrollmentDto = {
        studentId: 'student-1',
        classroomId: 'classroom-1',
        schoolYearId: 'year-1',
      };

      expect(dto.studentId).toBe('student-1');
    });

    it('should accept optional fields', () => {
      const dto: CreateEnrollmentDto = {
        studentId: 'student-1',
        classroomId: 'classroom-1',
        schoolYearId: 'year-1',
        enrollmentDate: new Date(),
        status: 'ACTIVE',
        metadata: {},
      };

      expect(dto.status).toBe('ACTIVE');
    });
  });

  describe('UpdateEnrollmentDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateEnrollmentDto = {
        status: 'COMPLETED',
      };

      expect(dto.status).toBe('COMPLETED');
    });
  });

  describe('BulkEnrollmentDto', () => {
    it('should accept bulk enrollment data', () => {
      const dto: BulkEnrollmentDto = {
        studentIds: ['student-1', 'student-2', 'student-3'],
        classroomId: 'classroom-1',
        schoolYearId: 'year-1',
      };

      expect(dto.studentIds).toHaveLength(3);
    });
  });

  describe('AssignTeacherDto', () => {
    it('should accept teacher assignment', () => {
      const dto: AssignTeacherDto = {
        teacherId: 'teacher-1',
        classroomId: 'classroom-1',
        subject: 'Mathematics',
        isMainTeacher: true,
      };

      expect(dto.isMainTeacher).toBe(true);
    });
  });

  describe('UpdateTeacherAssignmentDto', () => {
    it('should accept partial updates', () => {
      const dto: UpdateTeacherAssignmentDto = {
        isMainTeacher: false,
      };

      expect(dto.isMainTeacher).toBe(false);
    });
  });

  describe('PaginationDto', () => {
    it('should accept pagination options', () => {
      const dto: PaginationDto = {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      expect(dto.page).toBe(1);
      expect(dto.sortOrder).toBe('asc');
    });

    it('should accept descending sort order', () => {
      const dto: PaginationDto = {
        sortOrder: 'desc',
      };

      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('SchoolFilterDto', () => {
    it('should extend PaginationDto with filters', () => {
      const dto: SchoolFilterDto = {
        page: 1,
        limit: 10,
        networkId: 'network-1',
        status: 'ACTIVE',
        search: 'test',
      };

      expect(dto.networkId).toBe('network-1');
      expect(dto.search).toBe('test');
    });
  });

  describe('StudentFilterDto', () => {
    it('should extend PaginationDto with filters', () => {
      const dto: StudentFilterDto = {
        schoolId: 'school-1',
        classroomId: 'classroom-1',
        gradeId: 'grade-1',
        status: 'ACTIVE',
        search: 'john',
      };

      expect(dto.gradeId).toBe('grade-1');
    });
  });

  describe('TeacherFilterDto', () => {
    it('should extend PaginationDto with filters', () => {
      const dto: TeacherFilterDto = {
        schoolId: 'school-1',
        classroomId: 'classroom-1',
        status: 'ACTIVE',
        specialization: 'Math',
        search: 'silva',
      };

      expect(dto.specialization).toBe('Math');
    });
  });

  describe('ClassroomFilterDto', () => {
    it('should extend PaginationDto with filters', () => {
      const dto: ClassroomFilterDto = {
        schoolId: 'school-1',
        gradeId: 'grade-1',
        schoolYearId: 'year-1',
        shift: 'MORNING',
        status: 'ACTIVE',
      };

      expect(dto.shift).toBe('MORNING');
    });
  });

  describe('PaginatedResponse', () => {
    it('should wrap data with pagination metadata', () => {
      const response: PaginatedResponse<{ id: string; name: string }> = {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasMore: true,
        },
      };

      expect(response.data).toHaveLength(2);
      expect(response.meta.totalPages).toBe(10);
      expect(response.meta.hasMore).toBe(true);
    });

    it('should handle last page', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1'],
        meta: {
          total: 11,
          page: 2,
          limit: 10,
          totalPages: 2,
          hasMore: false,
        },
      };

      expect(response.meta.hasMore).toBe(false);
    });
  });

  describe('ApiResponse', () => {
    it('should wrap successful response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '1' },
      };

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('1');
    });

    it('should wrap error response', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: { id: '123' },
        },
      };

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle validation errors', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            fields: ['name', 'email'],
            errors: ['Name is required', 'Invalid email format'],
          },
        },
      };

      expect(response.error?.code).toBe('VALIDATION_ERROR');
    });
  });
});
