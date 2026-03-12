import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { SchoolNetworkId } from '@organizoptera/types';

@ApiTags('subscription')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  private toNetworkId(networkId: string): SchoolNetworkId {
    return networkId as SchoolNetworkId;
  }

  @Post()
  @Roles('OrgAdmin', 'NetworkAdmin')
  @ApiOperation({ summary: 'Create network subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 409, description: 'Subscription already exists' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  create(
    @Body() createDto: CreateSubscriptionDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.subscriptionService.create(createDto, this.toNetworkId(req.tenant.networkId));
  }

  @Get()
  @ApiOperation({ summary: 'Get current network subscription' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Req() req: RequestWithTenant) {
    return this.subscriptionService.findOne(this.toNetworkId(req.tenant.networkId));
  }

  @Patch()
  @Roles('OrgAdmin', 'NetworkAdmin')
  @ApiOperation({ summary: 'Update network subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  update(
    @Body() updateDto: UpdateSubscriptionDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.subscriptionService.update(this.toNetworkId(req.tenant.networkId), updateDto);
  }

  @Delete()
  @Roles('OrgAdmin', 'NetworkAdmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel network subscription' })
  @ApiQuery({ name: 'immediately', required: false, type: 'boolean' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  cancel(
    @Query('immediately') immediately: string,
    @Req() req: RequestWithTenant,
  ) {
    const cancelImmediately = immediately === 'true';
    return this.subscriptionService.cancel(this.toNetworkId(req.tenant.networkId), cancelImmediately);
  }

  @Post('check-quota')
  @ApiOperation({ summary: 'Check quota for a feature' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        feature: { type: 'string', example: 'MAX_SCHOOLS' },
        currentUsage: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Quota check result' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  checkQuota(
    @Body() body: { feature: string; currentUsage: number },
    @Req() req: RequestWithTenant,
  ) {
    return this.subscriptionService.checkQuota(
      this.toNetworkId(req.tenant.networkId),
      body.feature,
      body.currentUsage,
    );
  }

  @Post('calculate-proration')
  @ApiOperation({ summary: 'Calculate prorated charge for plan change' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        targetPlan: {
          type: 'string',
          enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
          example: 'PROFESSIONAL',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Prorated charge (in cents)' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  calculateProration(
    @Body() body: { targetPlan: string },
    @Req() req: RequestWithTenant,
  ) {
    return this.subscriptionService.calculateProration(
      this.toNetworkId(req.tenant.networkId),
      body.targetPlan,
    );
  }
}
