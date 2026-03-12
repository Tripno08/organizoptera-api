import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { SchoolNetworkId } from '@organizoptera/types';

@ApiTags('schools')
@ApiBearerAuth()
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  private toNetworkId(networkId: string): SchoolNetworkId {
    return networkId as SchoolNetworkId;
  }
  @Roles('OrgAdmin', 'NetworkAdmin', 'SchoolAdmin')


  @Post()
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, description: 'School created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid network ID' })
  @ApiResponse({ status: 409, description: 'School already exists' })
  create(@Body() createDto: CreateSchoolDto, @Req() req: RequestWithTenant) {
    // SECURITY: Inject networkId from JWT (never trust request body)
    return this.schoolsService.create({
      ...createDto,
      networkId: this.toNetworkId(req.tenant.networkId), // Override any networkId in body
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all schools (tenant-scoped by RLS)' })
  @ApiResponse({ status: 200, description: 'List of schools (auto-filtered by tenant)' })
  @ApiResponse({ status: 403, description: 'Missing tenant information' })
  findAll(@Req() req: RequestWithTenant) {
    // networkId extracted from JWT by TenantGuard
    // RLS automatically filters by tenant via TenantScopeInterceptor
    return this.schoolsService.findAll(this.toNetworkId(req.tenant.networkId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'School details' })
  @ApiResponse({ status: 403, description: 'Access denied - school belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant
    return this.schoolsService.findOne(id, this.toNetworkId(req.tenant.networkId));
  }

  @Get(':id/classrooms')
  @ApiOperation({ summary: 'Get all classrooms in a school (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of classrooms' })
  @ApiResponse({ status: 403, description: 'Access denied - school belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findClassrooms(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before fetching classrooms
    return this.schoolsService.findClassrooms(id, this.toNetworkId(req.tenant.networkId));
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students in a school (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of students' })
  @ApiResponse({ status: 403, description: 'Access denied - school belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findStudents(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before fetching students
    return this.schoolsService.findStudents(id, this.toNetworkId(req.tenant.networkId));
  }

  @Get(':id/teachers')
  @ApiOperation({ summary: 'Get all teachers in a school (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of teachers' })
  @ApiResponse({ status: 403, description: 'Access denied - school belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findTeachers(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before fetching teachers
    return this.schoolsService.findTeachers(id, this.toNetworkId(req.tenant.networkId));
  }

  @Patch(':id')
  @Roles('OrgAdmin', 'NetworkAdmin', 'SchoolAdmin')
  @ApiOperation({ summary: 'Update a school' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSchoolDto) {
    return this.schoolsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('OrgAdmin', 'NetworkAdmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'School deleted successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
