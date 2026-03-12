import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSchoolDto) {
    // Verify network exists
    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id: createDto.networkId },
    });

    if (!network) {
      throw new BadRequestException(`School network with ID ${createDto.networkId} not found`);
    }

    try {
      return await this.prisma.school.create({
        data: {
          networkId: createDto.networkId,
          name: createDto.name,
          slug: createDto.slug,
          code: createDto.code,
          address: createDto.address,
          city: createDto.city,
          state: createDto.state,
          country: createDto.country || 'BR',
          phone: createDto.phone,
          email: createDto.email,
          principalName: createDto.principalName,
          status: createDto.status || 'ACTIVE',
          settings: createDto.settings ?? undefined,
          metadata: createDto.metadata ?? undefined,
        },
        include: {
          network: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`School with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async findAll(networkId: string) {
    // CRITICAL: networkId is now REQUIRED (enforced by TenantGuard)
    // RLS policies in PostgreSQL provide additional isolation layer
    return await this.prisma.school.findMany({
      where: { networkId }, // Always filter by tenant
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            classrooms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate school belongs to authenticated tenant
    // findFirst with WHERE clause ensures cross-tenant access is impossible
    const school = await this.prisma.school.findFirst({
      where: {
        id,
        networkId, // CRITICAL: Validate tenant ownership
      },
      include: {
        network: true,
        grades: {
          orderBy: { sequenceOrder: 'asc' },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            classrooms: true,
            grades: true,
          },
        },
      },
    });

    if (!school) {
      // Generic error - don't reveal if school exists in another tenant
      throw new NotFoundException(`School with ID ${id} not found or access denied`);
    }

    return school;
  }

  async findClassrooms(id: string, networkId: string) {
    // SECURITY: Validate school belongs to authenticated tenant before fetching classrooms
    const school = await this.prisma.school.findFirst({
      where: {
        id,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found or access denied`);
    }

    return await this.prisma.classroom.findMany({
      where: { schoolId: id },
      include: {
        grade: true,
        schoolYear: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStudents(id: string, networkId: string) {
    // SECURITY: Validate school belongs to authenticated tenant before fetching students
    const school = await this.prisma.school.findFirst({
      where: {
        id,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found or access denied`);
    }

    return await this.prisma.student.findMany({
      where: { schoolId: id },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findTeachers(id: string, networkId: string) {
    // SECURITY: Validate school belongs to authenticated tenant before fetching teachers
    const school = await this.prisma.school.findFirst({
      where: {
        id,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found or access denied`);
    }

    return await this.prisma.teacher.findMany({
      where: { schoolId: id },
      include: {
        _count: {
          select: { classroomAssignments: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async update(id: string, updateDto: UpdateSchoolDto) {
    try {
      return await this.prisma.school.update({
        where: { id },
        data: updateDto,
        include: {
          network: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`School with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`School with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.school.delete({
        where: { id },
      });
      return { message: 'School deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`School with ID ${id} not found`);
      }
      throw error;
    }
  }
}
