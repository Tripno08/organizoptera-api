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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';

@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new grade (tenant-validated)' })
  @ApiResponse({ status: 201, description: 'Grade created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid school ID' })
  @ApiResponse({ status: 403, description: 'School belongs to another tenant' })
  @ApiResponse({ status: 409, description: 'Grade already exists' })
  create(@Body() createDto: CreateGradeDto, @Req() req: RequestWithTenant) {
    // SECURITY: Validate school belongs to tenant before creating grade
    return this.gradesService.create(createDto, req.tenant.networkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all grades' })
  @ApiQuery({ name: 'schoolId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of grades' })
  findAll(@Query('schoolId') schoolId?: string) {
    return this.gradesService.findAll(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a grade by ID (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Grade details with classrooms' })
  @ApiResponse({ status: 403, description: 'Access denied - grade belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  findOne(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate grade belongs to tenant
    return this.gradesService.findOne(id, req.tenant.networkId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a grade (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Grade updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - grade belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGradeDto,
    @Req() req: RequestWithTenant
  ) {
    // SECURITY: Validate grade belongs to tenant before updating
    return this.gradesService.update(id, updateDto, req.tenant.networkId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a grade (tenant-validated)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Grade deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - grade belongs to another tenant' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  remove(@Param('id') id: string, @Req() req: RequestWithTenant) {
    // SECURITY: Validate grade belongs to tenant before deleting
    return this.gradesService.remove(id, req.tenant.networkId);
  }
}
