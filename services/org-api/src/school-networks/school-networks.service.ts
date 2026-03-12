import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolNetworkDto } from './dto/create-school-network.dto';
import { UpdateSchoolNetworkDto } from './dto/update-school-network.dto';

@Injectable()
export class SchoolNetworksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSchoolNetworkDto) {
    // SECURITY NOTE: Network creation should be restricted to super-admins
    // Additional role-based authorization should be added at guard/controller level
    try {
      return await this.prisma.schoolNetwork.create({
        data: {
          name: createDto.name,
          slug: createDto.slug,
          domain: createDto.domain,
          status: createDto.status || 'ACTIVE',
          settings: createDto.settings ?? undefined,
          metadata: createDto.metadata ?? undefined,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`School network with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async findAll(networkId: string) {
    // SECURITY: Users can only see their own network
    // SchoolNetwork IS the tenant, so return only the authenticated network
    return await this.prisma.schoolNetwork.findMany({
      where: {
        id: networkId, // CRITICAL: Only return authenticated user's network
      },
      include: {
        _count: {
          select: { schools: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate requested network ID matches authenticated tenant
    // Users can ONLY access their own network (networkId === SchoolNetwork.id)
    if (id !== networkId) {
      throw new ForbiddenException('Access denied - you can only access your own network');
    }

    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id },
      include: {
        schools: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        _count: {
          select: { schools: true },
        },
      },
    });

    if (!network) {
      throw new NotFoundException(`School network with ID ${id} not found`);
    }

    return network;
  }

  async update(id: string, updateDto: UpdateSchoolNetworkDto, networkId: string) {
    // SECURITY: Validate requested network ID matches authenticated tenant
    if (id !== networkId) {
      throw new ForbiddenException('Access denied - you can only update your own network');
    }

    try {
      return await this.prisma.schoolNetwork.update({
        where: { id },
        data: updateDto,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`School network with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`School network with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string, networkId: string) {
    // SECURITY: Validate requested network ID matches authenticated tenant
    if (id !== networkId) {
      throw new ForbiddenException('Access denied - you can only delete your own network');
    }

    try {
      await this.prisma.schoolNetwork.delete({
        where: { id },
      });
      return { message: 'School network deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`School network with ID ${id} not found`);
      }
      throw error;
    }
  }
}
