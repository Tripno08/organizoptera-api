import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsString, Min, Max } from 'class-validator';

export class SearchStandardsDto {
  @ApiProperty({
    description: 'Education level',
    enum: ['EI', 'EF', 'EM'],
    example: 'EF',
    required: false,
  })
  @IsOptional()
  @IsEnum(['EI', 'EF', 'EM'])
  level?: 'EI' | 'EF' | 'EM';

  @ApiProperty({ description: 'Grade number (1-12)', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  grade?: number;

  @ApiProperty({
    description: 'Curriculum area',
    enum: ['LINGUAGENS', 'MATEMATICA', 'CIENCIAS_NATUREZA', 'CIENCIAS_HUMANAS', 'ENSINO_RELIGIOSO'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['LINGUAGENS', 'MATEMATICA', 'CIENCIAS_NATUREZA', 'CIENCIAS_HUMANAS', 'ENSINO_RELIGIOSO'])
  area?: 'LINGUAGENS' | 'MATEMATICA' | 'CIENCIAS_NATUREZA' | 'CIENCIAS_HUMANAS' | 'ENSINO_RELIGIOSO';

  @ApiProperty({ description: 'Component (subject) name', example: 'Matemática', required: false })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ description: 'Search term', example: 'multiplicação', required: false })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ description: 'Limit results', example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
