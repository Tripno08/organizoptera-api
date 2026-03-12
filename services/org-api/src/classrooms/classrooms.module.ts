import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
