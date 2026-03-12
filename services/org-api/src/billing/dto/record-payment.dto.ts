import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsOptional, IsObject, IsDateString, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Invoice ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Payment method', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'BOLETO'] })
  @IsEnum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'BOLETO'])
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'PIX' | 'BOLETO';

  @ApiProperty({ description: 'Payment amount in cents', example: 9900 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Transaction ID from payment processor', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: 'Payment date', example: '2025-01-07T10:30:00Z' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ description: 'Payment metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
