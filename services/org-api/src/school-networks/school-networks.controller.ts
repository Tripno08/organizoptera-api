import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolNetworksService } from './school-networks.service';
import { CreateSchoolNetworkDto } from './dto/create-school-network.dto';
import { UpdateSchoolNetworkDto } from './dto/update-school-network.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('school-networks')
@ApiBearerAuth()
@Controller('school-networks')
export class SchoolNetworksController {
  constructor(private readonly schoolNetworksService: SchoolNetworksService) {}

  @Post()
  @Roles('OrgAdmin')
  @ApiOperation({ summary: 'Create a new school network (admin-only)' })
  @ApiResponse({ status: 201, description: 'School network created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'School network already exists' })
  create(@Body() createDto: CreateSchoolNetworkDto, @Req() req: RequestWithTenant) {
    // SECURITY: Network creation restricted to OrgAdmin role via @Roles decorator
    return this.schoolNetworksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all school networks (scoped to authenticated tenant)' })
  @ApiResponse({ status: 200, description: 'List of school networks' })
  findAll(@Req() req: RequestWithTenant) {
    // SECURITY: Only return authenticated user's network
    return this.schoolNetworksService.findAll(req.tenant.networkId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school network by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'School network details' })
  @ApiResponse({ status: 403, description: 'Access denied - not your network' })
  @ApiResponse({ status: 404, description: 'School network not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate requested network ID matches authenticated tenant
    return this.schoolNetworksService.findOne(id, req.tenant.networkId);
  }

  @Patch(':id')
  @Roles('OrgAdmin', 'NetworkAdmin')
  @ApiOperation({ summary: 'Update a school network (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'School network updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - not your network' })
  @ApiResponse({ status: 404, description: 'School network not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSchoolNetworkDto, @Req() req: RequestWithTenant) {
    // SECURITY: Restricted to OrgAdmin and NetworkAdmin roles
    return this.schoolNetworksService.update(id, updateDto, req.tenant.networkId);
  }

  @Delete(':id')
  @Roles('OrgAdmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school network (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'School network deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - not your network' })
  @ApiResponse({ status: 404, description: 'School network not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Network deletion restricted to OrgAdmin only
    return this.schoolNetworksService.remove(id, req.tenant.networkId);
  }
}
