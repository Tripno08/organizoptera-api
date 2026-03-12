/**
 * @organizoptera/org-api - Students Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentsService } from '../students.service';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Gender, StudentStatus } from '../dto/create-student.dto';

describe('StudentsService', () => {
  const MOCK_NETWORK_ID = 'network-1';
  // Mock PrismaService
  const mockPrisma = {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    student: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    classroom: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    schoolYear: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    enrollment: {
      create: vi.fn(),
    },
  };

  let service: StudentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StudentsService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 'school-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    it('should create a student successfully', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1', name: 'Test School' });
      mockPrisma.student.create.mockResolvedValue({
        id: 'student-1',
        ...createDto,
        status: 'ACTIVE',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      const result = await service.create(createDto, MOCK_NETWORK_ID);

      expect(result.id).toBe('student-1');
      expect(result.firstName).toBe('John');
      expect(mockPrisma.school.findFirst).toHaveBeenCalledWith({ where: { id: 'school-1', networkId: MOCK_NETWORK_ID } });
      expect(mockPrisma.student.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('School with ID school-1 not found');
    });

    it('should throw ConflictException on duplicate studentCode', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['studentCode'] },
      });

      await expect(service.create({ ...createDto, studentCode: 'STD001' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
    });

    it('should use default status ACTIVE when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('ACTIVE');
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should convert birthDate string to Date object', async () => {
      const dtoWithBirthDate = {
        ...createDto,
        birthDate: '2010-05-15',
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockImplementation((args: any) => {
        expect(args.data.birthDate).toBeInstanceOf(Date);
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.create(dtoWithBirthDate, MOCK_NETWORK_ID);
    });

    it('should handle birthDate as null when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockImplementation((args: any) => {
        expect(args.data.birthDate).toBeNull();
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should include all optional fields when provided', async () => {
      const fullDto = {
        ...createDto,
        birthDate: '2010-05-15',
        gender: Gender.MALE,
        studentCode: 'STD001',
        guardianName: 'Jane Doe',
        guardianPhone: '+55 11 98765-4321',
        guardianEmail: 'jane@example.com',
        address: '123 Test St',
        status: StudentStatus.ACTIVE,
        metadata: { notes: 'Test student' },
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockImplementation((args: any) => {
        expect(args.data.gender).toBe('MALE');
        expect(args.data.guardianName).toBe('Jane Doe');
        expect(args.data.metadata).toEqual({ notes: 'Test student' });
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.create(fullDto, MOCK_NETWORK_ID);
    });

    it('should include school relation in response', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.create.mockResolvedValue({
        id: 'student-1',
        ...createDto,
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      await service.create(createDto, MOCK_NETWORK_ID);

      expect(mockPrisma.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            school: {
              select: { id: true, name: true, slug: true },
            },
          },
        })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      const unexpectedError = new Error('Database connection failed');
      mockPrisma.student.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all students', async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        { id: 'student-1', firstName: 'John', lastName: 'Doe' },
        { id: 'student-2', firstName: 'Jane', lastName: 'Doe' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by schoolId when provided', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.findAll('school-1');

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1' },
        })
      );
    });

    it('should include enrollment counts', async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        {
          id: 'student-1',
          _count: { enrollments: 3 },
        },
      ]);

      const result = await service.findAll();

      expect(result[0]._count.enrollments).toBe(3);
    });

    it('should order by lastName, firstName', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        })
      );
    });

    it('should include school relation', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            school: {
              select: { id: true, name: true, slug: true },
            },
          }),
        })
      );
    });

    it('should return empty array when no students', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        school: { id: 'school-1' },
        enrollments: [],
      });

      const result = await service.findOne('student-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('student-1');
      expect(result.firstName).toBe('John');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Student with ID non-existent not found');
    });

    it('should include enrollments with classroom and grade', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({
        id: 'student-1',
        enrollments: [
          {
            id: 'enrollment-1',
            classroom: { id: 'classroom-1', grade: { id: 'grade-1' } },
            schoolYear: { id: 'year-1' },
          },
        ],
      });

      await service.findOne('student-1', MOCK_NETWORK_ID);

      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            enrollments: expect.objectContaining({
              include: {
                classroom: { include: { grade: true } },
                schoolYear: true,
              },
            }),
          }),
        })
      );
    });

    it('should order enrollments by createdAt desc', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({
        id: 'student-1',
        enrollments: [],
      });

      await service.findOne('student-1', MOCK_NETWORK_ID);

      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            enrollments: expect.objectContaining({
              orderBy: { createdAt: 'desc' },
            }),
          }),
        })
      );
    });
  });

  describe('enroll', () => {
    const enrollDto = {
      classroomId: 'classroom-1',
      schoolYearId: 'year-1',
    };

    it('should enroll a student successfully', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.enrollment.create.mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        classroomId: 'classroom-1',
        schoolYearId: 'year-1',
        status: 'ACTIVE',
        student: { id: 'student-1' },
        classroom: { id: 'classroom-1', grade: {} },
        schoolYear: { id: 'year-1' },
      });

      const result = await service.enroll('student-1', enrollDto, MOCK_NETWORK_ID);

      expect(result.id).toBe('enrollment-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(service.enroll('non-existent', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.enroll('non-existent', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow('Student with ID non-existent not found');
    });

    it('should throw BadRequestException when classroom not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue(null);

      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow('Classroom with ID classroom-1 not found');
    });

    it('should throw BadRequestException when school year not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue(null);

      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow(BadRequestException);
      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow('School year with ID year-1 not found');
    });

    it('should throw ConflictException when already enrolled', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.enrollment.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow(
        'Student is already enrolled in this classroom for this school year'
      );
    });

    it('should use current date when enrollmentDate not provided', async () => {
      const beforeTest = new Date();
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.enrollment.create.mockImplementation((args: any) => {
        const enrollmentDate = args.data.enrollmentDate;
        expect(enrollmentDate).toBeInstanceOf(Date);
        expect(enrollmentDate.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
        return Promise.resolve({ id: 'enrollment-1', ...args.data });
      });

      await service.enroll('student-1', enrollDto, MOCK_NETWORK_ID);
    });

    it('should use provided enrollmentDate when given', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.enrollment.create.mockImplementation((args: any) => {
        expect(args.data.enrollmentDate).toBeInstanceOf(Date);
        return Promise.resolve({ id: 'enrollment-1', ...args.data });
      });

      await service.enroll('student-1', { ...enrollDto, enrollmentDate: '2024-02-01' }, MOCK_NETWORK_ID);
    });

    it('should include relations in response', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.enrollment.create.mockResolvedValue({
        id: 'enrollment-1',
        student: { id: 'student-1' },
        classroom: { id: 'classroom-1', grade: {} },
        schoolYear: { id: 'year-1' },
      });

      await service.enroll('student-1', enrollDto, MOCK_NETWORK_ID);

      expect(mockPrisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            student: true,
            classroom: { include: { grade: true } },
            schoolYear: true,
          },
        })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      const unexpectedError = new Error('Unexpected error');
      mockPrisma.enrollment.create.mockRejectedValue(unexpectedError);

      await expect(service.enroll('student-1', enrollDto, MOCK_NETWORK_ID)).rejects.toThrow('Unexpected error');
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Updated',
      status: StudentStatus.TRANSFERRED,
    };

    it('should update a student successfully', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.update.mockResolvedValue({
        id: 'student-1',
        firstName: 'Updated',
        status: 'TRANSFERRED',
        school: { id: 'school-1' },
      });

      const result = await service.update('student-1', updateDto, MOCK_NETWORK_ID);

      expect(result.firstName).toBe('Updated');
      expect(result.status).toBe('TRANSFERRED');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate field', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.update('student-1', { email: 'duplicate@example.com' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
    });

    it('should convert birthDate string to Date', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.update.mockImplementation((args: any) => {
        expect(args.data.birthDate).toBeInstanceOf(Date);
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.update('student-1', { birthDate: '2010-05-15' }, MOCK_NETWORK_ID);
    });

    it('should not include birthDate when not provided', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.update.mockImplementation((args: any) => {
        expect(args.data.birthDate).toBeUndefined();
        return Promise.resolve({ id: 'student-1', ...args.data });
      });

      await service.update('student-1', { firstName: 'Updated' }, MOCK_NETWORK_ID);
    });

    it('should include school relation in response', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.update.mockResolvedValue({
        id: 'student-1',
        school: { id: 'school-1' },
      });

      await service.update('student-1', updateDto, MOCK_NETWORK_ID);

      expect(mockPrisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { school: true },
        })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Database error');
      mockPrisma.student.update.mockRejectedValue(unexpectedError);

      await expect(service.update('student-1', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete a student successfully', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.student.delete.mockResolvedValue({ id: 'student-1' });

      const result = await service.remove('student-1', MOCK_NETWORK_ID);

      expect(result.message).toBe('Student deleted successfully');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Foreign key constraint');
      mockPrisma.student.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('student-1', MOCK_NETWORK_ID)).rejects.toThrow('Foreign key constraint');
    });
  });
});
