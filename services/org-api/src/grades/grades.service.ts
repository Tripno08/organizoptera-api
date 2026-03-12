import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateGradeDto, networkId: string) {
    // SECURITY: Validate school exists AND belongs to authenticated tenant
    const school = await this.prisma.school.findFirst({
      where: {
        id: createDto.schoolId,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new ForbiddenException(`School with ID ${createDto.schoolId} not found or access denied`);
    }

    try {
      return await this.prisma.grade.create({
        data: {
          schoolId: createDto.schoolId,
          name: createDto.name,
          code: createDto.code,
          sequenceOrder: createDto.sequenceOrder,
          educationLevel: createDto.educationLevel || 'EF',
          metadata: createDto.metadata ?? undefined,
        },
        include: {
          school: {
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
        throw new ConflictException(`Grade with code ${createDto.code} already exists in this school`);
      }
      throw error;
    }
  }

  async findAll(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    return await this.prisma.grade.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { classrooms: true },
        },
      },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate grade belongs to authenticated tenant
    const grade = await this.prisma.grade.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership via join
      },
      include: {
        school: true,
        classrooms: {
          include: {
            schoolYear: true,
            _count: {
              select: { enrollments: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { classrooms: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found or access denied`);
    }

    return grade;
  }

  async update(id: string, updateDto: UpdateGradeDto, networkId: string) {
    // SECURITY: Validate grade belongs to authenticated tenant before updating
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingGrade) {
      throw new NotFoundException(`Grade with ID ${id} not found or access denied`);
    }

    try {
      return await this.prisma.grade.update({
        where: { id },
        data: updateDto,
        include: {
          school: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Grade with this code already exists in this school');
      }
      throw error;
    }
  }

  async remove(id: string, networkId: string) {
    // SECURITY: Validate grade belongs to authenticated tenant before deleting
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingGrade) {
      throw new NotFoundException(`Grade with ID ${id} not found or access denied`);
    }

    try {
      await this.prisma.grade.delete({
        where: { id },
      });
      return { message: 'Grade deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Grade with ID ${id} not found`);
      }
      throw error;
    }
  }
}
