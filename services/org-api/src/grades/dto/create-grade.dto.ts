import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsInt, Min } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ example: 'uuid', description: 'School ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ example: '1º Ano', description: 'Grade name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1EF', description: 'Grade code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1, description: 'Sequence order (1-9)' })
  @IsInt()
  @Min(1)
  sequenceOrder: number;

  @ApiPropertyOptional({ example: 'EF', default: 'EF', description: 'Education level (EF, EM, EI)' })
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
