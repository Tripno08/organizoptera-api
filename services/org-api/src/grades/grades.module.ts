import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
