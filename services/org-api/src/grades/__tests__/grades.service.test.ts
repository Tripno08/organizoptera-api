/**
 * @organizoptera/org-api - Grades Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GradesService } from '../grades.service';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('GradesService', () => {
  const MOCK_NETWORK_ID = 'network-1';
  // Mock PrismaService
  const mockPrisma = {
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    grade: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let service: GradesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GradesService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 'school-1',
      name: '1st Grade',
      code: 'G1',
      sequenceOrder: 1,
    };

    it('should create a grade successfully', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1', name: 'Test School' });
      mockPrisma.grade.create.mockResolvedValue({
        id: 'grade-1',
        ...createDto,
        educationLevel: 'EF',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      const result = await service.create(createDto, MOCK_NETWORK_ID);

      expect(result.id).toBe('grade-1');
      expect(result.name).toBe('1st Grade');
      expect(mockPrisma.school.findFirst).toHaveBeenCalledWith({ where: { id: 'school-1', networkId: MOCK_NETWORK_ID } });
      expect(mockPrisma.grade.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('School with ID school-1 not found or access denied');
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      });

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('Grade with code G1 already exists in this school');
    });

    it('should use default educationLevel EF when not provided', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.create.mockImplementation((args: any) => {
        expect(args.data.educationLevel).toBe('EF');
        return Promise.resolve({ id: 'grade-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should accept custom educationLevel', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.create.mockImplementation((args: any) => {
        expect(args.data.educationLevel).toBe('EM');
        return Promise.resolve({ id: 'grade-1', ...args.data });
      });

      await service.create({ ...createDto, educationLevel: 'EM' }, MOCK_NETWORK_ID);
    });

    it('should include all optional fields when provided', async () => {
      const fullDto = {
        ...createDto,
        educationLevel: 'elementary',
        metadata: { ageRange: '6-7' },
      };

      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.create.mockImplementation((args: any) => {
        expect(args.data.metadata).toEqual({ ageRange: '6-7' });
        return Promise.resolve({ id: 'grade-1', ...args.data });
      });

      await service.create(fullDto, MOCK_NETWORK_ID);
    });

    it('should include school relation in response', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.grade.create.mockResolvedValue({
        id: 'grade-1',
        school: { id: 'school-1', name: 'Test School', slug: 'test-school' },
      });

      await service.create(createDto, MOCK_NETWORK_ID);

      expect(mockPrisma.grade.create).toHaveBeenCalledWith(
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
      mockPrisma.grade.create.mockImplementation((args: any) => {
        expect(args.data.metadata).toBeUndefined();
        return Promise.resolve({ id: 'grade-1', ...args.data });
      });

      await service.create(createDto, MOCK_NETWORK_ID);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      const unexpectedError = new Error('Database connection failed');
      mockPrisma.grade.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto, MOCK_NETWORK_ID)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all grades', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([
        { id: 'grade-1', name: '1st Grade', sequenceOrder: 1 },
        { id: 'grade-2', name: '2nd Grade', sequenceOrder: 2 },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by schoolId when provided', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      await service.findAll('school-1');

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1' },
        })
      );
    });

    it('should include classroom counts', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([
        {
          id: 'grade-1',
          _count: { classrooms: 5 },
        },
      ]);

      const result = await service.findAll();

      expect(result[0]._count.classrooms).toBe(5);
    });

    it('should order by sequenceOrder asc', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sequenceOrder: 'asc' },
        })
      );
    });

    it('should include school relation', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            school: {
              select: { id: true, name: true, slug: true },
            },
          }),
        })
      );
    });

    it('should return empty array when no grades', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a grade by id', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({
        id: 'grade-1',
        name: '1st Grade',
        school: { id: 'school-1' },
        classrooms: [],
        _count: { classrooms: 3 },
      });

      const result = await service.findOne('grade-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('grade-1');
      expect(result.name).toBe('1st Grade');
    });

    it('should throw NotFoundException when grade not found', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow('Grade with ID non-existent not found');
    });

    it('should include classrooms with schoolYear and enrollment counts', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({
        id: 'grade-1',
        classrooms: [
          {
            id: 'classroom-1',
            schoolYear: { id: 'year-1' },
            _count: { enrollments: 25 },
          },
        ],
      });

      await service.findOne('grade-1', MOCK_NETWORK_ID);

      expect(mockPrisma.grade.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            classrooms: expect.objectContaining({
              include: {
                schoolYear: true,
                _count: { select: { enrollments: true } },
              },
            }),
          }),
        })
      );
    });

    it('should order classrooms by createdAt desc', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({
        id: 'grade-1',
        classrooms: [],
      });

      await service.findOne('grade-1', MOCK_NETWORK_ID);

      expect(mockPrisma.grade.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            classrooms: expect.objectContaining({
              orderBy: { createdAt: 'desc' },
            }),
          }),
        })
      );
    });

    it('should include classroom count in response', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({
        id: 'grade-1',
        _count: { classrooms: 10 },
      });

      const result = await service.findOne('grade-1', MOCK_NETWORK_ID);

      expect(result._count.classrooms).toBe(10);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Grade',
      sequenceOrder: 2,
    };

    it('should update a grade successfully', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.update.mockResolvedValue({
        id: 'grade-1',
        name: 'Updated Grade',
        sequenceOrder: 2,
        school: { id: 'school-1' },
      });

      const result = await service.update('grade-1', updateDto, MOCK_NETWORK_ID);

      expect(result.name).toBe('Updated Grade');
      expect(result.sequenceOrder).toBe(2);
    });

    it('should throw NotFoundException when grade not found', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      });

      await expect(service.update('grade-1', { code: 'DUPLICATE' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.update('grade-1', { code: 'DUPLICATE' }, MOCK_NETWORK_ID)).rejects.toThrow(
        'Grade with this code already exists in this school'
      );
    });

    it('should include school relation in response', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.update.mockResolvedValue({
        id: 'grade-1',
        school: { id: 'school-1' },
      });

      await service.update('grade-1', updateDto, MOCK_NETWORK_ID);

      expect(mockPrisma.grade.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { school: true },
        })
      );
    });

    it('should pass update data directly', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.update.mockImplementation((args: any) => {
        expect(args.data).toEqual(updateDto);
        return Promise.resolve({ id: 'grade-1', ...args.data });
      });

      await service.update('grade-1', updateDto, MOCK_NETWORK_ID);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Database error');
      mockPrisma.grade.update.mockRejectedValue(unexpectedError);

      await expect(service.update('grade-1', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete a grade successfully', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.delete.mockResolvedValue({ id: 'grade-1' });

      const result = await service.remove('grade-1', MOCK_NETWORK_ID);

      expect(result.message).toBe('Grade deleted successfully');
    });

    it('should throw NotFoundException when grade not found', async () => {
      mockPrisma.grade.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected errors', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      const unexpectedError = new Error('Foreign key constraint');
      mockPrisma.grade.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('grade-1', MOCK_NETWORK_ID)).rejects.toThrow('Foreign key constraint');
    });

    it('should call delete with correct id', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({ id: 'grade-1', school: { networkId: MOCK_NETWORK_ID } });
      mockPrisma.grade.delete.mockResolvedValue({ id: 'grade-1' });

      await service.remove('grade-1', MOCK_NETWORK_ID);

      expect(mockPrisma.grade.delete).toHaveBeenCalledWith({
        where: { id: 'grade-1' },
      });
    });
  });
});
