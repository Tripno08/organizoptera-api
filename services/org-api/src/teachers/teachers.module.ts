import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherDocenteService } from './teacher-docente.service';
import { TeacherDocenteController } from './teacher-docente.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TeachersController, TeacherDocenteController],
  providers: [TeachersService, TeacherDocenteService],
  exports: [TeachersService, TeacherDocenteService],
})
export class TeachersModule {}
