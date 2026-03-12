import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateTeacherDto, networkId: string) {
    // SECURITY: Verify school exists AND belongs to authenticated tenant
    const school = await this.prisma.school.findFirst({
      where: {
        id: createDto.schoolId,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new ForbiddenException(
        `School with ID ${createDto.schoolId} not found or access denied`
      );
    }

    return await this.prisma.teacher.create({
      data: {
        schoolId: createDto.schoolId,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        email: createDto.email,
        phone: createDto.phone,
        specialization: createDto.specialization,
        employmentType: createDto.employmentType || 'FULL_TIME',
        status: createDto.status || 'ACTIVE',
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
  }

  async findAll(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    return await this.prisma.teacher.findMany({
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
          select: { classroomAssignments: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate teacher belongs to authenticated tenant
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership via join
      },
      include: {
        school: true,
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
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found or access denied`);
    }

    return teacher;
  }

  async findClassrooms(id: string, networkId: string) {
    // SECURITY: Validate teacher belongs to authenticated tenant
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found or access denied`);
    }

    const assignments = await this.prisma.teacherClassroom.findMany({
      where: { teacherId: id },
      include: {
        classroom: {
          include: {
            grade: true,
            schoolYear: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    return assignments.map((assignment: (typeof assignments)[number]) => ({
      ...assignment.classroom,
      subject: assignment.subject,
      isMainTeacher: assignment.isMainTeacher,
    }));
  }

  async update(id: string, updateDto: UpdateTeacherDto, networkId: string) {
    // SECURITY: Validate teacher belongs to authenticated tenant before updating
    const existingTeacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingTeacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found or access denied`);
    }

    return await this.prisma.teacher.update({
      where: { id },
      data: updateDto,
      include: {
        school: true,
      },
    });
  }

  async remove(id: string, networkId: string) {
    // SECURITY: Validate teacher belongs to authenticated tenant before deleting
    const existingTeacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingTeacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found or access denied`);
    }

    try {
      await this.prisma.teacher.delete({
        where: { id },
      });
      return { message: 'Teacher deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }
      throw error;
    }
  }
}
