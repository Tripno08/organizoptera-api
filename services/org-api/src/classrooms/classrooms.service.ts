import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateClassroomDto, networkId: string) {
    // SECURITY: Verify school exists AND belongs to authenticated tenant
    const school = await this.prisma.school.findFirst({
      where: {
        id: createDto.schoolId,
        networkId, // CRITICAL: Validate tenant ownership
      },
    });

    if (!school) {
      throw new ForbiddenException(`School with ID ${createDto.schoolId} not found or access denied`);
    }

    // SECURITY: Verify grade exists AND belongs to tenant's school
    const grade = await this.prisma.grade.findFirst({
      where: {
        id: createDto.gradeId,
        school: { networkId }, // CRITICAL: Validate via join
      },
    });

    if (!grade) {
      throw new ForbiddenException(`Grade with ID ${createDto.gradeId} not found or access denied`);
    }

    // Verify school year exists (no tenant validation needed - shared resource)
    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id: createDto.schoolYearId },
    });

    if (!schoolYear) {
      throw new BadRequestException(`School year with ID ${createDto.schoolYearId} not found`);
    }

    try {
      return await this.prisma.classroom.create({
        data: {
          schoolId: createDto.schoolId,
          gradeId: createDto.gradeId,
          schoolYearId: createDto.schoolYearId,
          name: createDto.name,
          code: createDto.code,
          shift: createDto.shift || 'MORNING',
          capacity: createDto.capacity || 30,
          room: createDto.room,
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
          grade: true,
          schoolYear: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Classroom with this code already exists for this grade and school year');
      }
      throw error;
    }
  }

  async findAll(schoolId?: string, gradeId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (gradeId) where.gradeId = gradeId;

    return await this.prisma.classroom.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        grade: true,
        schoolYear: true,
        _count: {
          select: {
            enrollments: true,
            teacherAssignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate classroom belongs to authenticated tenant
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership via join
      },
      include: {
        school: true,
        grade: true,
        schoolYear: true,
        enrollments: {
          include: {
            student: true,
          },
        },
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            teacherAssignments: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found or access denied`);
    }

    return classroom;
  }

  async findStudents(id: string, networkId: string) {
    // SECURITY: Validate classroom belongs to authenticated tenant
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found or access denied`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classroomId: id },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });

    return enrollments.map((enrollment: typeof enrollments[number]) => ({
      ...enrollment.student,
      enrollmentId: enrollment.id,
      enrollmentDate: enrollment.enrollmentDate,
      enrollmentStatus: enrollment.status,
    }));
  }

  async update(id: string, updateDto: UpdateClassroomDto, networkId: string) {
    // SECURITY: Validate classroom belongs to authenticated tenant before updating
    const existingClassroom = await this.prisma.classroom.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingClassroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found or access denied`);
    }

    try {
      return await this.prisma.classroom.update({
        where: { id },
        data: updateDto,
        include: {
          school: true,
          grade: true,
          schoolYear: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Classroom with this code already exists for this grade and school year');
      }
      throw error;
    }
  }

  async remove(id: string, networkId: string) {
    // SECURITY: Validate classroom belongs to authenticated tenant before deleting
    const existingClassroom = await this.prisma.classroom.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingClassroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found or access denied`);
    }

    try {
      await this.prisma.classroom.delete({
        where: { id },
      });
      return { message: 'Classroom deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Classroom with ID ${id} not found`);
      }
      throw error;
    }
  }
}
