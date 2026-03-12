/**
 * @organizoptera/org-api - Schools Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolsService } from '../schools.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SchoolStatus } from '../dto/create-school.dto';

describe('SchoolsService', () => {
  const MOCK_NETWORK_ID = 'network-1';
  // Mock PrismaService
  const mockPrisma = {
    schoolNetwork: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    school: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    classroom: {
      findMany: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    },
    teacher: {
      findMany: vi.fn(),
    },
  };

  let service: SchoolsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SchoolsService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      networkId: 'network-1',
      name: 'Test School',
      slug: 'test-school',
      code: 'TST001',
    };

    it('should create a school successfully', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({ id: 'network-1', name: 'Network' });
      mockPrisma.school.create.mockResolvedValue({
        id: 'school-1',
        ...createDto,
        status: 'ACTIVE',
        country: 'BR',
        network: { id: 'network-1', name: 'Network', slug: 'network' },
      });

      const result = await service.create(createDto);

      expect(result.id).toBe('school-1');
      expect(result.name).toBe('Test School');
      expect(mockPrisma.school.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when network not found', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.school.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should use default country BR when not provided', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.school.create.mockImplementation((args: any) => {
        expect(args.data.country).toBe('BR');
        return Promise.resolve({ id: 'school-1', ...args.data });
      });

      await service.create(createDto);
    });

    it('should use default status ACTIVE when not provided', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.school.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('ACTIVE');
        return Promise.resolve({ id: 'school-1', ...args.data });
      });

      await service.create(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all schools for network', async () => {
      mockPrisma.school.findMany.mockResolvedValue([
        { id: 'school-1', name: 'School 1' },
        { id: 'school-2', name: 'School 2' },
      ]);

      const result = await service.findAll(MOCK_NETWORK_ID);

      expect(result).toHaveLength(2);
      expect(mockPrisma.school.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { networkId: MOCK_NETWORK_ID },
      }));
    });

    it('should filter by networkId when provided', async () => {
      mockPrisma.school.findMany.mockResolvedValue([]);

      await service.findAll('network-1');

      expect(mockPrisma.school.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { networkId: 'network-1' },
      }));
    });

    it('should include counts', async () => {
      mockPrisma.school.findMany.mockResolvedValue([
        {
          id: 'school-1',
          _count: { students: 100, teachers: 10, classrooms: 5 },
        },
      ]);

      const result = await service.findAll(MOCK_NETWORK_ID);

      expect(result[0]._count.students).toBe(100);
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.school.findMany.mockResolvedValue([]);

      await service.findAll(MOCK_NETWORK_ID);

      expect(mockPrisma.school.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }));
    });
  });

  describe('findOne', () => {
    it('should return a school by id', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({
        id: 'school-1',
        name: 'Test School',
        network: { id: 'network-1' },
        grades: [],
        _count: { students: 100 },
      });

      const result = await service.findOne('school-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('school-1');
      expect(result.network.id).toBe('network-1');
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should include grades ordered by sequenceOrder', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({
        id: 'school-1',
        grades: [
          { id: 'grade-1', sequenceOrder: 1 },
          { id: 'grade-2', sequenceOrder: 2 },
        ],
      });

      await service.findOne('school-1', MOCK_NETWORK_ID);

      expect(mockPrisma.school.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.objectContaining({
          grades: { orderBy: { sequenceOrder: 'asc' } },
        }),
      }));
    });
  });

  describe('findClassrooms', () => {
    it('should return classrooms for a school', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.classroom.findMany.mockResolvedValue([
        { id: 'classroom-1', name: '1A' },
        { id: 'classroom-2', name: '1B' },
      ]);

      const result = await service.findClassrooms('school-1', MOCK_NETWORK_ID);

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.findClassrooms('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStudents', () => {
    it('should return students for a school', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.findMany.mockResolvedValue([
        { id: 'student-1', firstName: 'John', lastName: 'Doe' },
      ]);

      const result = await service.findStudents('school-1', MOCK_NETWORK_ID);

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.findStudents('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should order by lastName, firstName', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.findStudents('school-1', MOCK_NETWORK_ID);

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }));
    });
  });

  describe('findTeachers', () => {
    it('should return teachers for a school', async () => {
      mockPrisma.school.findFirst.mockResolvedValue({ id: 'school-1' });
      mockPrisma.teacher.findMany.mockResolvedValue([
        { id: 'teacher-1', firstName: 'Maria', lastName: 'Silva' },
      ]);

      const result = await service.findTeachers('school-1', MOCK_NETWORK_ID);

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.findFirst.mockResolvedValue(null);

      await expect(service.findTeachers('non-existent', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated School',
      status: SchoolStatus.MAINTENANCE,
    };

    it('should update a school successfully', async () => {
      mockPrisma.school.update.mockResolvedValue({
        id: 'school-1',
        name: 'Updated School',
        status: 'MAINTENANCE',
      });

      const result = await service.update('school-1', updateDto);

      expect(result.name).toBe('Updated School');
      expect(result.status).toBe('MAINTENANCE');
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.school.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await expect(service.update('school-1', { slug: 'duplicate' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a school successfully', async () => {
      mockPrisma.school.delete.mockResolvedValue({ id: 'school-1' });

      const result = await service.remove('school-1');

      expect(result.message).toBe('School deleted successfully');
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrisma.school.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
