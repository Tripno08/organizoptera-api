import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class ProcessRefundDto {
  @ApiProperty({ description: 'Payment ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'Refund amount in cents', example: 9900 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Refund reason', example: 'Customer requested cancellation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
