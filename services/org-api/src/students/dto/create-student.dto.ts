import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsUUID, IsDateString } from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
}

export class CreateStudentDto {
  @ApiProperty({ example: 'uuid', description: 'School ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ example: 'João', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Silva', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'joao.silva@email.com', description: 'Email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '2010-05-15', description: 'Birth date' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'RA123456', description: 'Student code (RA)' })
  @IsString()
  @IsOptional()
  studentCode?: string;

  @ApiPropertyOptional({ example: 'Maria Silva', description: 'Guardian name' })
  @IsString()
  @IsOptional()
  guardianName?: string;

  @ApiPropertyOptional({ example: '(19) 98765-4321', description: 'Guardian phone' })
  @IsString()
  @IsOptional()
  guardianPhone?: string;

  @ApiPropertyOptional({ example: 'guardian@email.com', description: 'Guardian email' })
  @IsString()
  @IsOptional()
  guardianEmail?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 456', description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.ACTIVE })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
