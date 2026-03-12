import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({ example: 'uuid', description: 'Classroom ID' })
  @IsUUID()
  @IsNotEmpty()
  classroomId: string;

  @ApiProperty({ example: 'uuid', description: 'School year ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolYearId: string;

  @ApiPropertyOptional({ example: '2025-02-01', description: 'Enrollment date' })
  @IsDateString()
  @IsOptional()
  enrollmentDate?: string;
}
