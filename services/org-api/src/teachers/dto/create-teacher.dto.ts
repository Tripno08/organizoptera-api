import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsEmail,
} from 'class-validator';

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACTOR = 'CONTRACTOR',
  SUBSTITUTE = 'SUBSTITUTE',
}

export enum TeacherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export class CreateTeacherDto {
  @ApiProperty({ example: 'uuid', description: 'School ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ example: 'Maria', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Santos', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'maria.santos@email.com', description: 'Email (required, unique)' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '(19) 98765-4321', description: 'Phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Mathematics', description: 'Subject specialization' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional({ enum: EmploymentType, default: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: TeacherStatus, default: TeacherStatus.ACTIVE })
  @IsEnum(TeacherStatus)
  @IsOptional()
  status?: TeacherStatus;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
