/**
 * @organizoptera/org-api - School Networks Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolNetworksService } from '../school-networks.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { NetworkStatus } from '../dto/create-school-network.dto';

describe('SchoolNetworksService', () => {
  const MOCK_NETWORK_ID = 'network-1';
  // Mock PrismaService
  const mockPrisma = {
    schoolNetwork: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let service: SchoolNetworksService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SchoolNetworksService(mockPrisma as any);
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Network',
      slug: 'test-network',
    };

    it('should create a school network successfully', async () => {
      mockPrisma.schoolNetwork.create.mockResolvedValue({
        id: 'network-1',
        ...createDto,
        status: 'ACTIVE',
      });

      const result = await service.create(createDto);

      expect(result.id).toBe('network-1');
      expect(result.name).toBe('Test Network');
      expect(mockPrisma.schoolNetwork.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.schoolNetwork.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('School network with slug already exists');
    });

    it('should throw ConflictException on duplicate name', async () => {
      mockPrisma.schoolNetwork.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('School network with name already exists');
    });

    it('should throw ConflictException on duplicate domain', async () => {
      mockPrisma.schoolNetwork.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['domain'] },
      });

      await expect(service.create({ ...createDto, domain: 'test.com' })).rejects.toThrow(ConflictException);
    });

    it('should use default status ACTIVE when not provided', async () => {
      mockPrisma.schoolNetwork.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('ACTIVE');
        return Promise.resolve({ id: 'network-1', ...args.data });
      });

      await service.create(createDto);
    });

    it('should accept custom status', async () => {
      mockPrisma.schoolNetwork.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('TRIAL');
        return Promise.resolve({ id: 'network-1', ...args.data });
      });

      await service.create({ ...createDto, status: NetworkStatus.TRIAL });
    });

    it('should include all optional fields when provided', async () => {
      const fullDto = {
        ...createDto,
        domain: 'test.network.com',
        status: NetworkStatus.ACTIVE,
        settings: { theme: 'dark' },
        metadata: { region: 'south' },
      };

      mockPrisma.schoolNetwork.create.mockImplementation((args: any) => {
        expect(args.data.domain).toBe('test.network.com');
        expect(args.data.settings).toEqual({ theme: 'dark' });
        expect(args.data.metadata).toEqual({ region: 'south' });
        return Promise.resolve({ id: 'network-1', ...args.data });
      });

      await service.create(fullDto);
    });

    it('should handle undefined settings and metadata', async () => {
      mockPrisma.schoolNetwork.create.mockImplementation((args: any) => {
        expect(args.data.settings).toBeUndefined();
        expect(args.data.metadata).toBeUndefined();
        return Promise.resolve({ id: 'network-1', ...args.data });
      });

      await service.create(createDto);
    });

    it('should propagate unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockPrisma.schoolNetwork.create.mockRejectedValue(unexpectedError);

      await expect(service.create(createDto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all school networks', async () => {
      mockPrisma.schoolNetwork.findMany.mockResolvedValue([
        { id: 'network-1', name: 'Network 1', _count: { schools: 5 } },
        { id: 'network-2', name: 'Network 2', _count: { schools: 3 } },
      ]);

      const result = await service.findAll(MOCK_NETWORK_ID);

      expect(result).toHaveLength(2);
    });

    it('should include school counts', async () => {
      mockPrisma.schoolNetwork.findMany.mockResolvedValue([
        {
          id: 'network-1',
          _count: { schools: 10 },
        },
      ]);

      const result = await service.findAll(MOCK_NETWORK_ID);

      expect(result[0]._count.schools).toBe(10);
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.schoolNetwork.findMany.mockResolvedValue([]);

      await service.findAll(MOCK_NETWORK_ID);

      expect(mockPrisma.schoolNetwork.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include _count select for schools', async () => {
      mockPrisma.schoolNetwork.findMany.mockResolvedValue([]);

      await service.findAll(MOCK_NETWORK_ID);

      expect(mockPrisma.schoolNetwork.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: { schools: true },
            },
          },
        })
      );
    });

    it('should return empty array when no networks', async () => {
      mockPrisma.schoolNetwork.findMany.mockResolvedValue([]);

      const result = await service.findAll(MOCK_NETWORK_ID);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a school network by id', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({
        id: 'network-1',
        name: 'Test Network',
        schools: [
          { id: 'school-1', name: 'School 1', slug: 'school-1', status: 'ACTIVE' },
        ],
        _count: { schools: 1 },
      });

      const result = await service.findOne('network-1', MOCK_NETWORK_ID);

      expect(result.id).toBe('network-1');
      expect(result.name).toBe('Test Network');
      expect(result.schools).toHaveLength(1);
    });

    it('should throw ForbiddenException when accessing different network', async () => {
      await expect(service.findOne('different-network', MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('different-network', MOCK_NETWORK_ID)).rejects.toThrow('Access denied - you can only access your own network');
    });

    it('should include schools with selected fields', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({
        id: 'network-1',
        schools: [],
      });

      await service.findOne('network-1', MOCK_NETWORK_ID);

      expect(mockPrisma.schoolNetwork.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            schools: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          }),
        })
      );
    });

    it('should include school count in response', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({
        id: 'network-1',
        _count: { schools: 15 },
      });

      const result = await service.findOne('network-1', MOCK_NETWORK_ID);

      expect(result._count.schools).toBe(15);
    });

    it('should return network with empty schools array', async () => {
      mockPrisma.schoolNetwork.findUnique.mockResolvedValue({
        id: 'network-1',
        schools: [],
        _count: { schools: 0 },
      });

      const result = await service.findOne('network-1', MOCK_NETWORK_ID);

      expect(result.schools).toEqual([]);
      expect(result._count.schools).toBe(0);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Network',
      status: NetworkStatus.SUSPENDED,
    };

    it('should update a school network successfully', async () => {
      mockPrisma.schoolNetwork.update.mockResolvedValue({
        id: 'network-1',
        name: 'Updated Network',
        status: 'SUSPENDED',
      });

      const result = await service.update('network-1', updateDto, MOCK_NETWORK_ID);

      expect(result.name).toBe('Updated Network');
      expect(result.status).toBe('SUSPENDED');
    });

    it('should throw ForbiddenException when updating different network', async () => {
      await expect(service.update('different-network', updateDto, MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.update('different-network', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Access denied - you can only update your own network');
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.schoolNetwork.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await expect(service.update('network-1', { slug: 'duplicate' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
      await expect(service.update('network-1', { slug: 'duplicate' }, MOCK_NETWORK_ID)).rejects.toThrow(
        'School network with slug already exists'
      );
    });

    it('should throw ConflictException on duplicate domain', async () => {
      mockPrisma.schoolNetwork.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['domain'] },
      });

      await expect(service.update('network-1', { domain: 'duplicate.com' }, MOCK_NETWORK_ID)).rejects.toThrow(ConflictException);
    });

    it('should pass update data directly', async () => {
      mockPrisma.schoolNetwork.update.mockImplementation((args: any) => {
        expect(args.data).toEqual(updateDto);
        return Promise.resolve({ id: 'network-1', ...args.data });
      });

      await service.update('network-1', updateDto, MOCK_NETWORK_ID);
    });

    it('should propagate unexpected errors', async () => {
      const unexpectedError = new Error('Database error');
      mockPrisma.schoolNetwork.update.mockRejectedValue(unexpectedError);

      await expect(service.update('network-1', updateDto, MOCK_NETWORK_ID)).rejects.toThrow('Database error');
    });

    it('should update domain', async () => {
      mockPrisma.schoolNetwork.update.mockResolvedValue({
        id: 'network-1',
        domain: 'new-domain.com',
      });

      const result = await service.update('network-1', { domain: 'new-domain.com' }, MOCK_NETWORK_ID);

      expect(result.domain).toBe('new-domain.com');
    });

    it('should update settings', async () => {
      const newSettings = { theme: 'light', features: ['dashboard'] };
      mockPrisma.schoolNetwork.update.mockResolvedValue({
        id: 'network-1',
        settings: newSettings,
      });

      const result = await service.update('network-1', { settings: newSettings }, MOCK_NETWORK_ID);

      expect(result.settings).toEqual(newSettings);
    });

    it('should update metadata', async () => {
      const newMetadata = { region: 'north', tier: 'premium' };
      mockPrisma.schoolNetwork.update.mockResolvedValue({
        id: 'network-1',
        metadata: newMetadata,
      });

      const result = await service.update('network-1', { metadata: newMetadata }, MOCK_NETWORK_ID);

      expect(result.metadata).toEqual(newMetadata);
    });
  });

  describe('remove', () => {
    it('should delete a school network successfully', async () => {
      mockPrisma.schoolNetwork.delete.mockResolvedValue({ id: 'network-1' });

      const result = await service.remove('network-1', MOCK_NETWORK_ID);

      expect(result.message).toBe('School network deleted successfully');
    });

    it('should throw ForbiddenException when deleting different network', async () => {
      await expect(service.remove('different-network', MOCK_NETWORK_ID)).rejects.toThrow(ForbiddenException);
      await expect(service.remove('different-network', MOCK_NETWORK_ID)).rejects.toThrow('Access denied - you can only delete your own network');
    });

    it('should throw NotFoundException when network not found', async () => {
      mockPrisma.schoolNetwork.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('network-1', MOCK_NETWORK_ID)).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected errors', async () => {
      const unexpectedError = new Error('Foreign key constraint - schools exist');
      mockPrisma.schoolNetwork.delete.mockRejectedValue(unexpectedError);

      await expect(service.remove('network-1', MOCK_NETWORK_ID)).rejects.toThrow('Foreign key constraint - schools exist');
    });

    it('should call delete with correct id', async () => {
      mockPrisma.schoolNetwork.delete.mockResolvedValue({ id: 'network-1' });

      await service.remove('network-1', MOCK_NETWORK_ID);

      expect(mockPrisma.schoolNetwork.delete).toHaveBeenCalledWith({
        where: { id: 'network-1' },
      });
    });
  });
});
