import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';

export enum SchoolStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateSchoolDto {
  @ApiProperty({ example: 'uuid', description: 'School network ID' })
  @IsUUID()
  @IsNotEmpty()
  networkId: string;

  @ApiProperty({ example: 'EMEF João Silva', description: 'School name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'emef-joao-silva', description: 'URL-friendly slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '12345678', description: 'School code (INEP)' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123', description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Campinas', description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'BR', default: 'BR' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '(19) 3456-7890', description: 'Phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@escola.edu.br', description: 'Email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Maria Santos', description: 'Principal name' })
  @IsString()
  @IsOptional()
  principalName?: string;

  @ApiPropertyOptional({ enum: SchoolStatus, default: SchoolStatus.ACTIVE })
  @IsEnum(SchoolStatus)
  @IsOptional()
  status?: SchoolStatus;

  @ApiPropertyOptional({ example: {}, description: 'School-specific settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
