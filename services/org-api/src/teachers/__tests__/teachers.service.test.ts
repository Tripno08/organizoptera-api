/**
 * @organizoptera/org-api - Teachers Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeachersService } from '../teachers.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EmploymentType, TeacherStatus } from '../dto/create-teacher.dto';

describe('TeachersService', () => {
  const MOCK_NETWORK_ID = 'network-1';
  // Mock PrismaService
  const mockPrisma = {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    teacher: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    teacherClassroom: {
      findMany: vi.fn(),
    },
  };

  let service: TeachersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeachersService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 'school-1',
      firstName: 'Maria',
      lastName: 'Silva',
      email: 'maria@school.com',
    };

    it('should create a teacher successfully', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1', name: 'Test School' });
      mockPrisma.teacher.create.mockResolvedValue({
        id: 'teacher-1',
        ...createDto,
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      const result = await service.create(createDto, MOCK_NETWORK_ID);

      expect(result.id).toBe('teacher-1');
      expect(result.firstName).toBe('Maria');
      expect(mockPrisma.school.findFirst).toHaveBeenCalledWith({ where: { id: 'school-1', networkId: MOCK_NETWORK_ID } });
      expect(mockPrisma.teacher.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('School with ID school-1 not found or access denied');
    });

    it('should use default employmentType FULL_TIME when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockImplementation((args: any) => {
        expect(args.data.employmentType).toBe('FULL_TIME');
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should use default status ACTIVE when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('ACTIVE');
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should accept custom employmentType', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockImplementation((args: any) => {
        expect(args.data.employmentType).toBe('PART_TIME');
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.create({ ...createDto, employmentType: EmploymentType.PART_TIME }, MOCK_NETWORK_ID);
    });

    it('should include all optional fields when provided', async () => {
      const fullDto = {
        ...createDto,
        phone: '+55 11 98765-4321',
        specialization: 'Mathematics',
        employmentType: EmploymentType.CONTRACTOR,
        status: TeacherStatus.ACTIVE,
        metadata: { qualification: 'PhD' },
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockImplementation((args: any) => {
        expect(args.data.phone).toBe('+55 11 98765-4321');
        expect(args.data.specialization).toBe('Mathematics');
        expect(args.data.metadata).toEqual({ qualification: 'PhD' });
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.create(fullDto, MOCK_NETWORK_ID);
    });

    it('should include school relation in response', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockResolvedValue({
        id: 'teacher-1',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      await service.create(createDto, MOCK_NETWORK_ID);

      expect(mockPrisma.teacher.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            school: {
              select: { id: true, name: true, slug: true },
            },
          },
        })
      );
    });

    it('should handle undefined metadata', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.create.mockImplementation((args: any) => {
        expect(args.data.metadata).toBeUndefined();
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });
  });

  describe('findAll', () => {
    it('should return all teachers', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        { id: 'teacher-1', firstName: 'Maria', lastName: 'Silva' },
        { id: 'teacher-2', firstName: 'João', lastName: 'Santos' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by schoolId when provided', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      await service.findAll('school-1');

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1' },
        })
      );
    });

    it('should include classroom assignment counts', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          _count: { classroomAssignments: 5 },
        },
      ]);

      const result = await service.findAll();

      expect(result[0]._count.classroomAssignments).toBe(5);
    });

    it('should order by lastName, firstName', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        })
      );
    });

    it('should include school relation', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            school: {
              select: { id: true, name: true, slug: true },
            },
          }),
        })
      );
    });

    it('should return empty array when no teachers', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a teacher by id', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        school: { id: 'school-1' },
        classroomAssignments: [],
      });

      const result = await service.findOne('teacher-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('teacher-1');
      expect(result.firstName).toBe('Maria');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Teacher with ID non-existent not found');
    });

    it('should include classroomAssignments with classroom, grade, and schoolYear', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({
        id: 'teacher-1',
        classroomAssignments: [
          {
            id: 'assignment-1',
            classroom: {
              id: 'classroom-1',
              grade: { id: 'grade-1' },
              schoolYear: { id: 'year-1' },
            },
          },
        ],
      });

      await service.findOne('teacher-1', MOCK_NETWORK_ID);

      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            classroomAssignments: {
              include: {
                classroom: {
                  include: {
                    grade: true,
                    schoolYear: true,
                  },
                },
              },
            },
          }),
        })
      );
    });
  });

  describe('findClassrooms', () => {
    it('should return classrooms for a teacher', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mockPrisma.teacherClassroom.findMany.mockResolvedValue([
        {
          id: 'assignment-1',
          subject: 'Mathematics',
          isMainTeacher: true,
          classroom: {
            id: 'classroom-1',
            name: '1A',
            grade: { id: 'grade-1', name: '1st Grade' },
            schoolYear: { id: 'year-1', year: 2024 },
            _count: { enrollments: 25 },
          },
        },
        {
          id: 'assignment-2',
          subject: 'Physics',
          isMainTeacher: false,
          classroom: {
            id: 'classroom-2',
            name: '2A',
            grade: { id: 'grade-2', name: '2nd Grade' },
            schoolYear: { id: 'year-1', year: 2024 },
            _count: { enrollments: 30 },
          },
        },
      ]);

      const result = await service.findClassrooms('teacher-1', MOCK_NETWORK_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('classroom-1');
      expect(result[0].subject).toBe('Mathematics');
      expect(result[0].isMainTeacher).toBe(true);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.findClassrooms('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findClassrooms('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Teacher with ID non-existent not found');
    });

    it('should include enrollment counts in response', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mockPrisma.teacherClassroom.findMany.mockResolvedValue([
        {
          subject: 'Math',
          isMainTeacher: true,
          classroom: {
            id: 'classroom-1',
            _count: { enrollments: 25 },
          },
        },
      ]);

      const result = await service.findClassrooms('teacher-1', MOCK_NETWORK_ID);

      expect(result[0]._count.enrollments).toBe(25);
    });

    it('should flatten assignment data into classroom objects', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mockPrisma.teacherClassroom.findMany.mockResolvedValue([
        {
          subject: 'Science',
          isMainTeacher: false,
          classroom: {
            id: 'classroom-1',
            name: '3B',
            grade: {},
            schoolYear: {},
            _count: { enrollments: 20 },
          },
        },
      ]);

      const result = await service.findClassrooms('teacher-1', MOCK_NETWORK_ID);

      expect(result[0]).toHaveProperty('id', 'classroom-1');
      expect(result[0]).toHaveProperty('name', '3B');
      expect(result[0]).toHaveProperty('subject', 'Science');
      expect(result[0]).toHaveProperty('isMainTeacher', false);
    });

    it('should return empty array when no assignments', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mockPrisma.teacherClassroom.findMany.mockResolvedValue([]);

      const result = await service.findClassrooms('teacher-1', MOCK_NETWORK_ID);

      expect(result).toEqual([]);
    });

    it('should query with correct teacherId filter', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1' });
      mockPrisma.teacherClassroom.findMany.mockResolvedValue([]);

      await service.findClassrooms('teacher-1', MOCK_NETWORK_ID);

      expect(mockPrisma.teacherClassroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: 'teacher-1' },
        })
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Updated',
      status: TeacherStatus.ON_LEAVE,
    };

    it('should update a teacher successfully', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.update.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Updated',
        status: 'ON_LEAVE',
        school: { id: 'school-1' },
      });

      const result = await service.update('teacher-1', updateDto, MOCK_NETWORK_ID);

      expect(result.firstName).toBe('Updated');
      expect(result.status).toBe('ON_LEAVE');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should include school relation in response', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.update.mockResolvedValue({
        id: 'teacher-1',
        school: { id: 'school-1' },
      });

      await service.update('teacher-1', updateDto, MOCK_NETWORK_ID);

      expect(mockPrisma.teacher.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { school: true },
        })
      );
    });

    it('should pass update data directly', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.update.mockImplementation((args: any) => {
        expect(args.data).toEqual(updateDto);
        return Promise.resolve({ id: 'teacher-1', ...args.data });
      });

      await service.update('teacher-1', updateDto, MOCK_NETWORK_ID);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Database error');
      mockPrisma.teacher.update.mockRejectedValue(unexpectedError);

      await expect(service.update('teacher-1', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Database error');
    });

    it('should update specialization', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.update.mockResolvedValue({
        id: 'teacher-1',
        specialization: 'Physics',
      });

      const result = await service.update('teacher-1', { specialization: 'Physics' }, MOCK_NETWORK_ID);

      expect(result.specialization).toBe('Physics');
    });

    it('should update employmentType', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.update.mockResolvedValue({
        id: 'teacher-1',
        employmentType: 'SUBSTITUTE',
      });

      const result = await service.update('teacher-1', { employmentType: EmploymentType.SUBSTITUTE }, MOCK_NETWORK_ID);

      expect(result.employmentType).toBe('SUBSTITUTE');
    });
  });

  describe('remove', () => {
    it('should delete a teacher successfully', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.delete.mockResolvedValue({ id: 'teacher-1' });

      const result = await service.remove('teacher-1', MOCK_NETWORK_ID);

      expect(result.message).toBe('Teacher deleted successfully');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Foreign key constraint');
      mockPrisma.teacher.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('teacher-1', MOCK_NETWORK_ID)).rejects.toThrow('Foreign key constraint');
    });

    it('should call delete with correct id', async () => {
      mockPrisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.teacher.delete.mockResolvedValue({ id: 'teacher-1' });

      await service.remove('teacher-1', MOCK_NETWORK_ID);

      expect(mockPrisma.teacher.delete).toHaveBeenCalledWith({
        where: { id: 'teacher-1' },
      });
    });
  });
});
