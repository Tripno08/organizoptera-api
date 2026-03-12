import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsArray, IsObject, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceLineItemDto {
  @ApiProperty({ description: 'Line item description', example: 'Starter Plan - January 2025' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price in cents', example: 9900 })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate (percentage)', example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ description: 'Line item metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Subscription ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  subscriptionId: string;

  @ApiProperty({ description: 'Discount amount in cents', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ description: 'Invoice due date', example: '2025-02-01T00:00:00Z' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Invoice line items', type: [InvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ description: 'Invoice metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
