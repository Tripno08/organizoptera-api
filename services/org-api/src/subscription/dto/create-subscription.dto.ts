import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject, IsInt, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan',
    enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
    example: 'STARTER',
  })
  @IsEnum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @ApiProperty({
    description: 'Billing cycle',
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
    example: 'MONTHLY',
  })
  @IsEnum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

  @ApiProperty({
    description: 'Trial period in days',
    example: 14,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'dashboard', campaign: 'Q1-2025' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
