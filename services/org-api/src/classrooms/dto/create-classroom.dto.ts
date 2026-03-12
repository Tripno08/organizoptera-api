import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsUUID, IsInt, Min } from 'class-validator';

export enum Shift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  FULL_TIME = 'FULL_TIME',
}

export enum ClassroomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateClassroomDto {
  @ApiProperty({ example: 'uuid', description: 'School ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ example: 'uuid', description: 'Grade ID' })
  @IsUUID()
  @IsNotEmpty()
  gradeId: string;

  @ApiProperty({ example: 'uuid', description: 'School year ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolYearId: string;

  @ApiProperty({ example: 'Turma A', description: 'Classroom name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1A', description: 'Classroom code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ enum: Shift, default: Shift.MORNING })
  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Physical room number' })
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional({ enum: ClassroomStatus, default: ClassroomStatus.ACTIVE })
  @IsEnum(ClassroomStatus)
  @IsOptional()
  status?: ClassroomStatus;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
