/**
 * @organizoptera/org-api - Classrooms Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassroomsService } from '../classrooms.service';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Shift, ClassroomStatus } from '../dto/create-classroom.dto';

describe('ClassroomsService', () => {
  const MOCK_NETWORK_ID = 'network-1';

  // Mock PrismaService
  const mockPrisma = {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    grade: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    schoolYear: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    classroom: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    enrollment: {
      findMany: vi.fn(),
    },
  };

  let service: ClassroomsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClassroomsService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 'school-1',
      gradeId: 'grade-1',
      schoolYearId: 'year-1',
      name: '1A',
      code: 'CL-1A',
    };

    it('should create a classroom successfully', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockResolvedValue({
        id: 'classroom-1',
        ...createDto,
        shift: 'MORNING',
        capacity: 30,
        status: 'ACTIVE',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
        grade: { id: 'grade-1' },
        schoolYear: { id: 'year-1' },
      });

      const result = await service.create(createDto, MOCK_NETWORK_ID);

      expect(result.id).toBe('classroom-1');
      expect(result.name).toBe('1A');
      expect(mockPrisma.school.findFirst).toHaveBeenCalledWith({ where: { id: 'school-1', networkId: MOCK_NETWORK_ID } });
      expect(mockPrisma.grade.findFirst).toHaveBeenCalledWith({ where: { id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } } });
      expect(mockPrisma.schoolYear.findUnique).toHaveBeenCalledWith({ where: { id: 'year-1' } });
    });

    it('should throw ForbiddenException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('School with ID school-1 not found or access denied');
    });

    it('should throw ForbiddenException when grade not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('Grade with ID grade-1 not found or access denied');
    });

    it('should throw BadRequestException when school year not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('School year with ID year-1 not found');
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      });

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(
        'Classroom with this code already exists for this grade and school year'
      );
    });

    it('should use default shift MORNING when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockImplementation((args: any) => {
        expect(args.data.shift).toBe('MORNING');
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should use default capacity 30 when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockImplementation((args: any) => {
        expect(args.data.capacity).toBe(30);
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should use default status ACTIVE when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('ACTIVE');
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should accept custom values for defaults', async () => {
      const customDto = {
        ...createDto,
        shift: Shift.AFTERNOON,
        capacity: 25,
        status: ClassroomStatus.INACTIVE,
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockImplementation((args: any) => {
        expect(args.data.shift).toBe('AFTERNOON');
        expect(args.data.capacity).toBe(25);
        expect(args.data.status).toBe('INACTIVE');
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.create(customDto, MOCK_NETWORK_ID);
    });

    it('should include all optional fields when provided', async () => {
      const fullDto = {
        ...createDto,
        room: 'Room 101',
        metadata: { building: 'A' },
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockImplementation((args: any) => {
        expect(args.data.room).toBe('Room 101');
        expect(args.data.metadata).toEqual({ building: 'A' });
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.create(fullDto, MOCK_NETWORK_ID);
    });

    it('should include relations in response', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      mockPrisma.classroom.create.mockResolvedValue({ id: 'classroom-1' });

      await service.create(createDto, MOCK_NETWORK_ID);

      expect(mockPrisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            school: {
              select: { id: true, name: true, slug: true },
            },
            grade: true,
            schoolYear: true,
          },
        })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1' });
      mockPrisma.schoolYear.findUnique.mockResolvedValue({ id: 'year-1' });
      const unexpectedError = new Error('Database connection failed');
      mockPrisma.classroom.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all classrooms', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([
        { id: 'classroom-1', name: '1A' },
        { id: 'classroom-2', name: '1B' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by schoolId when provided', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      await service.findAll('school-1');

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1' },
        })
      );
    });

    it('should filter by gradeId when provided', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      await service.findAll(undefined, 'grade-1');

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gradeId: 'grade-1' },
        })
      );
    });

    it('should filter by both schoolId and gradeId when provided', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      await service.findAll('school-1', 'grade-1');

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1', gradeId: 'grade-1' },
        })
      );
    });

    it('should include enrollment and teacherAssignment counts', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([
        {
          id: 'classroom-1',
          _count: { enrollments: 25, teacherAssignments: 3 },
        },
      ]);

      const result = await service.findAll();

      expect(result[0]._count.enrollments).toBe(25);
      expect(result[0]._count.teacherAssignments).toBe(3);
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include relations', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            school: {
              select: { id: true, name: true, slug: true },
            },
            grade: true,
            schoolYear: true,
          }),
        })
      );
    });

    it('should return empty array when no classrooms', async () => {
      mockPrisma.classroom.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a classroom by id', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({
        id: 'classroom-1',
        name: '1A',
        school: { id: 'school-1' },
        grade: { id: 'grade-1' },
        schoolYear: { id: 'year-1' },
        enrollments: [],
        teacherAssignments: [],
        _count: { enrollments: 25, teacherAssignments: 2 },
      });

      const result = await service.findOne('classroom-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('classroom-1');
      expect(result.name).toBe('1A');
    });

    it('should throw NotFoundException when classroom not found', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Classroom with ID non-existent not found');
    });

    it('should include enrollments with student data', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({
        id: 'classroom-1',
        enrollments: [
          { id: 'enrollment-1', student: { id: 'student-1' } },
        ],
      });

      await service.findOne('classroom-1', MOCK_NETWORK_ID);

      expect(mockPrisma.classroom.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            enrollments: {
              include: { student: true },
            },
          }),
        })
      );
    });

    it('should include teacherAssignments with teacher data', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({
        id: 'classroom-1',
        teacherAssignments: [
          { id: 'assignment-1', teacher: { id: 'teacher-1' } },
        ],
      });

      await service.findOne('classroom-1', MOCK_NETWORK_ID);

      expect(mockPrisma.classroom.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            teacherAssignments: {
              include: { teacher: true },
            },
          }),
        })
      );
    });
  });

  describe('findStudents', () => {
    it('should return students for a classroom', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.enrollment.findMany.mockResolvedValue([
        {
          id: 'enrollment-1',
          enrollmentDate: new Date('2024-02-01'),
          status: 'ACTIVE',
          student: {
            id: 'student-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'enrollment-2',
          enrollmentDate: new Date('2024-02-15'),
          status: 'ACTIVE',
          student: {
            id: 'student-2',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ]);

      const result = await service.findStudents('classroom-1', MOCK_NETWORK_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('student-1');
      expect(result[0].enrollmentId).toBe('enrollment-1');
      expect(result[0].enrollmentStatus).toBe('ACTIVE');
    });

    it('should throw NotFoundException when classroom not found', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue(null);

      await expect(service.findStudents('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findStudents('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Classroom with ID non-existent not found');
    });

    it('should flatten enrollment data into student objects', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      const enrollmentDate = new Date('2024-02-01');
      mockPrisma.enrollment.findMany.mockResolvedValue([
        {
          id: 'enrollment-1',
          enrollmentDate,
          status: 'TRANSFERRED',
          student: {
            id: 'student-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const result = await service.findStudents('classroom-1', MOCK_NETWORK_ID);

      expect(result[0]).toHaveProperty('id', 'student-1');
      expect(result[0]).toHaveProperty('firstName', 'John');
      expect(result[0]).toHaveProperty('lastName', 'Doe');
      expect(result[0]).toHaveProperty('email', 'john@example.com');
      expect(result[0]).toHaveProperty('enrollmentId', 'enrollment-1');
      expect(result[0]).toHaveProperty('enrollmentDate', enrollmentDate);
      expect(result[0]).toHaveProperty('enrollmentStatus', 'TRANSFERRED');
    });

    it('should order by student lastName asc', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      await service.findStudents('classroom-1', MOCK_NETWORK_ID);

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { student: { lastName: 'asc' } },
        })
      );
    });

    it('should return empty array when no students enrolled', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      const result = await service.findStudents('classroom-1', MOCK_NETWORK_ID);

      expect(result).toEqual([]);
    });

    it('should query with correct classroomId filter', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1' });
      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      await service.findStudents('classroom-1', MOCK_NETWORK_ID);

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classroomId: 'classroom-1' },
        })
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Classroom',
      capacity: 35,
    };

    it('should update a classroom successfully', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockResolvedValue({
        id: 'classroom-1',
        name: 'Updated Classroom',
        capacity: 35,
        school: { id: 'school-1' },
        grade: { id: 'grade-1' },
        schoolYear: { id: 'year-1' },
      });

      const result = await service.update('classroom-1', updateDto, MOCK_NETWORK_ID);

      expect(result.name).toBe('Updated Classroom');
      expect(result.capacity).toBe(35);
    });

    it('should throw NotFoundException when classroom not found', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      });

      await expect(service.update('classroom-1', { code: 'DUPLICATE' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.update('classroom-1', { code: 'DUPLICATE' }, MOCK_NETWORK_ID)).rejects.toThrow(
        'Classroom with this code already exists for this grade and school year'
      );
    });

    it('should include relations in response', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockResolvedValue({
        id: 'classroom-1',
        school: {},
        grade: {},
        schoolYear: {},
      });

      await service.update('classroom-1', updateDto, MOCK_NETWORK_ID);

      expect(mockPrisma.classroom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            school: true,
            grade: true,
            schoolYear: true,
          },
        })
      );
    });

    it('should pass update data directly', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockImplementation((args: any) => {
        expect(args.data).toEqual(updateDto);
        return Promise.resolve({ id: 'classroom-1', ...args.data });
      });

      await service.update('classroom-1', updateDto, MOCK_NETWORK_ID);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Database error');
      mockPrisma.classroom.update.mockRejectedValue(unexpectedError);

      await expect(service.update('classroom-1', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Database error');
    });

    it('should update shift', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockResolvedValue({
        id: 'classroom-1',
        shift: 'EVENING',
      });

      const result = await service.update('classroom-1', { shift: Shift.EVENING }, MOCK_NETWORK_ID);

      expect(result.shift).toBe('EVENING');
    });

    it('should update status', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.update.mockResolvedValue({
        id: 'classroom-1',
        status: 'ARCHIVED',
      });

      const result = await service.update('classroom-1', { status: ClassroomStatus.ARCHIVED }, MOCK_NETWORK_ID);

      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('remove', () => {
    it('should delete a classroom successfully', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.delete.mockResolvedValue({ id: 'classroom-1' });

      const result = await service.remove('classroom-1', MOCK_NETWORK_ID);

      expect(result.message).toBe('Classroom deleted successfully');
    });

    it('should throw NotFoundException when classroom not found', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Foreign key constraint');
      mockPrisma.classroom.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('classroom-1', MOCK_NETWORK_ID)).rejects.toThrow('Foreign key constraint');
    });

    it('should call delete with correct id', async () => {
      mockPrisma.classroom.findFirst.mockResolvedValue({ id: 'classroom-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.classroom.delete.mockResolvedValue({ id: 'classroom-1' });

      await service.remove('classroom-1', MOCK_NETWORK_ID);

      expect(mockPrisma.classroom.delete).toHaveBeenCalledWith({
        where: { id: 'classroom-1' },
      });
    });
  });
});
