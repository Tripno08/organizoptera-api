import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { SchoolNetworkId } from '@organizoptera/types';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private toNetworkId(networkId: string): SchoolNetworkId {
    return networkId as SchoolNetworkId;
  }

  @Post('invoices')
  @Roles('OrgAdmin', 'NetworkAdmin', 'Finance')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 403, description: 'Subscription access denied' })
  createInvoice(
    @Body() createDto: CreateInvoiceDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.billingService.createInvoice(createDto, this.toNetworkId(req.tenant.networkId));
  }

  @Get('invoices')
  @Roles('OrgAdmin', 'NetworkAdmin', 'Finance')
  @ApiOperation({ summary: 'Get all invoices for network' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  findAllInvoices(@Req() req: RequestWithTenant) {
    return this.billingService.findAllByNetwork(this.toNetworkId(req.tenant.networkId));
  }

  @Get('invoices/:id')
  @Roles('OrgAdmin', 'NetworkAdmin', 'Finance')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOneInvoice(
    @Param('id') id: string,
    @Req() req: RequestWithTenant,
  ) {
    return this.billingService.findOne(id, this.toNetworkId(req.tenant.networkId));
  }

  @Post('payments')
  @Roles('OrgAdmin', 'NetworkAdmin', 'Finance')
  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 403, description: 'Invoice access denied' })
  recordPayment(
    @Body() recordDto: RecordPaymentDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.billingService.recordPayment(recordDto, this.toNetworkId(req.tenant.networkId));
  }

  @Post('refunds')
  @Roles('OrgAdmin', 'Finance')
  @ApiOperation({ summary: 'Process a refund' })
  @ApiResponse({ status: 201, description: 'Refund processed successfully' })
  @ApiResponse({ status: 403, description: 'Payment access denied' })
  processRefund(
    @Body() refundDto: ProcessRefundDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.billingService.processRefund(refundDto, this.toNetworkId(req.tenant.networkId));
  }

  @Get('summary')
  @Roles('OrgAdmin', 'NetworkAdmin', 'Finance')
  @ApiOperation({ summary: 'Get billing summary for period' })
  @ApiQuery({ name: 'periodStart', type: 'string', description: 'ISO 8601 date-time string' })
  @ApiQuery({ name: 'periodEnd', type: 'string', description: 'ISO 8601 date-time string' })
  @ApiResponse({ status: 200, description: 'Billing summary' })
  getBillingSummary(
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Req() req: RequestWithTenant,
  ) {
    return this.billingService.getBillingSummary(
      this.toNetworkId(req.tenant.networkId),
      new Date(periodStart),
      new Date(periodEnd),
    );
  }
}
