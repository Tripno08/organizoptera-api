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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';

@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new teacher (tenant-validated)' })
  @ApiResponse({ status: 201, description: 'Teacher created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid school ID' })
  @ApiResponse({ status: 403, description: 'School belongs to another tenant' })
  create(@Body() createDto: CreateTeacherDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before creating teacher
    return this.teachersService.create(createDto, req.tenant.networkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiQuery({ name: 'schoolId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of teachers' })
  findAll(@Query('schoolId') schoolId?: string) {
    return this.teachersService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a teacher by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teacher details with classroom assignments' })
  @ApiResponse({ status: 403, description: 'Access denied - teacher belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate teacher belongs to tenant
    return this.teachersService.findOne(id, req.tenant.networkId);
  }

  @Get(':id/classrooms')
  @ApiOperation({ summary: 'Get all classrooms assigned to a teacher (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of assigned classrooms' })
  @ApiResponse({ status: 403, description: 'Access denied - teacher belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findClassrooms(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate teacher belongs to tenant
    return this.teachersService.findClassrooms(id, req.tenant.networkId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - teacher belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTeacherDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate teacher belongs to tenant before updating
    return this.teachersService.update(id, updateDto, req.tenant.networkId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - teacher belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate teacher belongs to tenant before deleting
    return this.teachersService.remove(id, req.tenant.networkId);
  }
}
