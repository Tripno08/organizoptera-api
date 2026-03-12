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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student (tenant-validated)' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid school ID' })
  @ApiResponse({ status: 403, description: 'School belongs to another tenant' })
  @ApiResponse({ status: 409, description: 'Student already exists' })
  create(@Body() createDto: CreateStudentDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before creating student
    return this.studentsService.create(createDto, req.tenant.networkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  @ApiQuery({ name: 'schoolId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of students' })
  findAll(@Query('schoolId') schoolId?: string) {
    return this.studentsService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Student details with enrollments' })
  @ApiResponse({ status: 403, description: 'Access denied - student belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate student belongs to tenant
    return this.studentsService.findOne(id, req.tenant.networkId);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a student in a classroom (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid classroom or school year ID' })
  @ApiResponse({ status: 403, description: 'Student/classroom belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Student already enrolled' })
  enroll(@Param('id') id: string, @Body() enrollDto: EnrollStudentDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate student and classroom belong to tenant
    return this.studentsService.enroll(id, enrollDto, req.tenant.networkId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - student belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateStudentDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate student belongs to tenant before updating
    return this.studentsService.update(id, updateDto, req.tenant.networkId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Student deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - student belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate student belongs to tenant before deleting
    return this.studentsService.remove(id, req.tenant.networkId);
  }
}
