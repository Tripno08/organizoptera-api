import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum NetworkStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

export class CreateSchoolNetworkDto {
  @ApiProperty({ example: 'Rede Municipal de Educação', description: 'Network name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rede-municipal', description: 'URL-friendly slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'municipal.edu.br', description: 'Domain' })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({ enum: NetworkStatus, default: NetworkStatus.ACTIVE })
  @IsEnum(NetworkStatus)
  @IsOptional()
  status?: NetworkStatus;

  @ApiPropertyOptional({ example: {}, description: 'Network-wide settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ example: {}, description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
