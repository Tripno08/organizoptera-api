import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { RecordUsageDto } from './dto/record-usage.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import type { SchoolNetworkId } from '@organizoptera/types';

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  private toNetworkId(networkId: string): SchoolNetworkId {
    return networkId as SchoolNetworkId;
  }

  @Post('usage')
  @ApiOperation({ summary: 'Record resource usage' })
  @ApiResponse({ status: 201, description: 'Usage recorded successfully' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  recordUsage(
    @Body() recordDto: RecordUsageDto,
    @Req() req: RequestWithTenant,
  ) {
    return this.resourcesService.recordUsage(recordDto, this.toNetworkId(req.tenant.networkId));
  }

  @Get('usage/:feature')
  @ApiOperation({ summary: 'Get usage for a feature' })
  @ApiParam({ name: 'feature', type: 'string', example: 'MAX_SCHOOLS' })
  @ApiResponse({ status: 200, description: 'Usage details' })
  @ApiResponse({ status: 404, description: 'Usage not found' })
  getUsage(
    @Param('feature') feature: string,
    @Req() req: RequestWithTenant,
  ) {
    return this.resourcesService.getUsage(feature, this.toNetworkId(req.tenant.networkId));
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Check usage alerts' })
  @ApiResponse({ status: 200, description: 'List of usage alerts' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  checkAlerts(@Req() req: RequestWithTenant) {
    return this.resourcesService.checkAlerts(this.toNetworkId(req.tenant.networkId));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get usage summary for all features' })
  @ApiResponse({ status: 200, description: 'Usage summary' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  getUsageSummary(@Req() req: RequestWithTenant) {
    return this.resourcesService.getUsageSummary(this.toNetworkId(req.tenant.networkId));
  }

  @Post('can-allocate')
  @ApiOperation({ summary: 'Check if resources can be allocated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        feature: { type: 'string', example: 'MAX_SCHOOLS' },
        current: { type: 'number', example: 3 },
        additional: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Allocation check result (true/false)' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  canAllocate(
    @Body() body: { feature: string; current: number; additional: number },
    @Req() req: RequestWithTenant,
  ) {
    return this.resourcesService.canAllocate(
      body.feature,
      body.current,
      body.additional,
      this.toNetworkId(req.tenant.networkId),
    );
  }

  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear usage cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  clearCache(@Req() req: RequestWithTenant) {
    return this.resourcesService.clearCache(this.toNetworkId(req.tenant.networkId));
  }
}
