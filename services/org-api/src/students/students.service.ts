import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateStudentDto, networkId: string) {
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

    try {
      return await this.prisma.student.create({
        data: {
          schoolId: createDto.schoolId,
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          email: createDto.email,
          birthDate: createDto.birthDate ? new Date(createDto.birthDate) : null,
          gender: createDto.gender,
          studentCode: createDto.studentCode,
          guardianName: createDto.guardianName,
          guardianPhone: createDto.guardianPhone,
          guardianEmail: createDto.guardianEmail,
          address: createDto.address,
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Student with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async findAll(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    return await this.prisma.student.findMany({
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
          select: { enrollments: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string, networkId: string) {
    // SECURITY: Validate student belongs to authenticated tenant
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership via join
      },
      include: {
        school: true,
        enrollments: {
          include: {
            classroom: {
              include: {
                grade: true,
              },
            },
            schoolYear: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found or access denied`);
    }

    return student;
  }

  async enroll(id: string, enrollDto: EnrollStudentDto, networkId: string) {
    // SECURITY: Verify student exists AND belongs to authenticated tenant
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found or access denied`);
    }

    // SECURITY: Verify classroom exists AND belongs to tenant
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: enrollDto.classroomId,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!classroom) {
      throw new ForbiddenException(`Classroom with ID ${enrollDto.classroomId} not found or access denied`);
    }

    // Verify school year exists (no tenant validation needed - shared resource)
    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id: enrollDto.schoolYearId },
    });

    if (!schoolYear) {
      throw new BadRequestException(`School year with ID ${enrollDto.schoolYearId} not found`);
    }

    try {
      return await this.prisma.enrollment.create({
        data: {
          studentId: id,
          classroomId: enrollDto.classroomId,
          schoolYearId: enrollDto.schoolYearId,
          enrollmentDate: enrollDto.enrollmentDate ? new Date(enrollDto.enrollmentDate) : new Date(),
          status: 'ACTIVE',
        },
        include: {
          student: true,
          classroom: {
            include: {
              grade: true,
            },
          },
          schoolYear: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Student is already enrolled in this classroom for this school year');
      }
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateStudentDto, networkId: string) {
    // SECURITY: Validate student belongs to authenticated tenant before updating
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingStudent) {
      throw new NotFoundException(`Student with ID ${id} not found or access denied`);
    }

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...updateDto,
          birthDate: updateDto.birthDate ? new Date(updateDto.birthDate) : undefined,
        },
        include: {
          school: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Student with ${error.meta.target[0]} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string, networkId: string) {
    // SECURITY: Validate student belongs to authenticated tenant before deleting
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        id,
        school: { networkId }, // CRITICAL: Validate tenant ownership
      },
    });

    if (!existingStudent) {
      throw new NotFoundException(`Student with ID ${id} not found or access denied`);
    }

    try {
      await this.prisma.student.delete({
        where: { id },
      });
      return { message: 'Student deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
      throw error;
    }
  }
}
