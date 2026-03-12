import { Module } from '@nestjs/common';
import { SchoolNetworksService } from './school-networks.service';
import { SchoolNetworksController } from './school-networks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolNetworksController],
  providers: [SchoolNetworksService],
  exports: [SchoolNetworksService],
})
export class SchoolNetworksModule {}
