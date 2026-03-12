import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan',
    enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
    example: 'PROFESSIONAL',
    required: false,
  })
  @IsOptional()
  @IsEnum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @ApiProperty({
    description: 'Billing cycle',
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
    example: 'ANNUAL',
    required: false,
  })
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

  @ApiProperty({
    description: 'Additional metadata',
    example: { notes: 'Upgraded from dashboard' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
