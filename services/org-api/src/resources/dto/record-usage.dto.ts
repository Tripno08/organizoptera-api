import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class RecordUsageDto {
  @ApiProperty({
    description: 'Feature key',
    enum: ['MAX_SCHOOLS', 'MAX_STUDENTS_PER_SCHOOL', 'MAX_TEACHERS_PER_SCHOOL', 'STORAGE_GB', 'API_CALLS_PER_MONTH'],
    example: 'MAX_SCHOOLS',
  })
  @IsString()
  feature: string;

  @ApiProperty({ description: 'Current usage value', example: 3 })
  @IsInt()
  @Min(0)
  current: number;

  @ApiProperty({ description: 'Limit value', example: 10 })
  @IsInt()
  @Min(0)
  limit: number;
}
