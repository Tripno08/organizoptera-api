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
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';

@ApiTags('classrooms')
@ApiBearerAuth()
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new classroom (tenant-validated)' })
  @ApiResponse({ status: 201, description: 'Classroom created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid school, grade, or school year ID' })
  @ApiResponse({ status: 403, description: 'School/grade belongs to another tenant' })
  @ApiResponse({ status: 409, description: 'Classroom already exists' })
  create(@Body() createDto: CreateClassroomDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school/grade belongs to tenant before creating classroom
    return this.classroomsService.create(createDto, req.tenant.networkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classrooms' })
  @ApiQuery({ name: 'schoolId', required: false, type: 'string' })
  @ApiQuery({ name: 'gradeId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of classrooms' })
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('gradeId') gradeId?: string,
  ) {
    return this.classroomsService.findAll(schoolId, gradeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a classroom by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Classroom details with enrollments and teachers' })
  @ApiResponse({ status: 403, description: 'Access denied - classroom belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate classroom belongs to tenant
    return this.classroomsService.findOne(id, req.tenant.networkId);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students in a classroom (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of enrolled students' })
  @ApiResponse({ status: 403, description: 'Access denied - classroom belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  findStudents(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate classroom belongs to tenant
    return this.classroomsService.findStudents(id, req.tenant.networkId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a classroom (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Classroom updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - classroom belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateClassroomDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate classroom belongs to tenant before updating
    return this.classroomsService.update(id, updateDto, req.tenant.networkId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classroom (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Classroom deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - classroom belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate classroom belongs to tenant before deleting
    return this.classroomsService.remove(id, req.tenant.networkId);
  }
}
