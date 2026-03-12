import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import { SearchStandardsDto } from './dto/search-standards.dto';
import { RequestWithTenant } from '../common/guards/tenant.guard';
import type { SchoolNetworkId } from '@organizoptera/types';

@ApiTags('curriculum')
@ApiBearerAuth()
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search BNCC curriculum standards' })
  @ApiResponse({ status: 200, description: 'Search results with objectives and competencies' })
  searchStandards(@Query() searchDto: SearchStandardsDto) {
    return this.curriculumService.searchStandards(searchDto);
  }

  @Get('objectives/grade/:grade')
  @ApiOperation({ summary: 'Get objectives by grade' })
  @ApiParam({ name: 'grade', type: 'number', example: 1 })
  @ApiQuery({ name: 'level', enum: ['EI', 'EF', 'EM'], example: 'EF' })
  @ApiResponse({ status: 200, description: 'List of objectives for grade' })
  getObjectivesByGrade(
    @Param('grade') grade: string,
    @Query('level') level: string,
  ) {
    return this.curriculumService.getObjectivesByGrade(parseInt(grade), level);
  }

  @Get('objectives/:code')
  @ApiOperation({ summary: 'Get specific objective by code' })
  @ApiParam({ name: 'code', type: 'string', example: 'EF01MA01' })
  @ApiResponse({ status: 200, description: 'Objective details' })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  getObjectiveByCode(@Param('code') code: string) {
    return this.curriculumService.getObjectiveByCode(code);
  }

  @Get('competencies')
  @ApiOperation({ summary: 'Get competencies by level' })
  @ApiQuery({ name: 'level', enum: ['EI', 'EF', 'EM'], example: 'EF' })
  @ApiResponse({ status: 200, description: 'List of competencies' })
  getCompetenciesByLevel(@Query('level') level: string) {
    return this.curriculumService.getCompetenciesByLevel(level);
  }

  @Get('summary/grade/:grade')
  @ApiOperation({ summary: 'Get curriculum summary for a grade' })
  @ApiParam({ name: 'grade', type: 'number', example: 1 })
  @ApiQuery({ name: 'level', enum: ['EI', 'EF', 'EM'], example: 'EF' })
  @ApiResponse({ status: 200, description: 'Grade curriculum summary' })
  getGradeSummary(
    @Param('grade') grade: string,
    @Query('level') level: string,
  ) {
    return this.curriculumService.getGradeSummary(parseInt(grade), level);
  }

  @Post('classrooms/:classroomId/map-objectives')
  @ApiOperation({ summary: 'Map objectives to all students in a classroom' })
  @ApiParam({ name: 'classroomId', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        objectiveCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['EF01MA01', 'EF01MA06'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Objectives mapped successfully' })
  mapObjectivesToClassroom(
    @Param('classroomId') classroomId: string,
    @Body() body: { objectiveCodes: string[] },
    @Req() req: RequestWithTenant,
  ) {
    return this.curriculumService.mapObjectivesToClassroom(
      classroomId,
      body.objectiveCodes,
      req.tenant.networkId as SchoolNetworkId,
    );
  }

  @Get('recommendations/grade/:grade')
  @ApiOperation({ summary: 'Get recommended objectives for a grade' })
  @ApiParam({ name: 'grade', type: 'number', example: 1 })
  @ApiQuery({ name: 'level', enum: ['EI', 'EF', 'EM'], example: 'EF' })
  @ApiQuery({ name: 'limit', type: 'number', example: 20, required: false })
  @ApiResponse({ status: 200, description: 'Recommended objectives' })
  getRecommendedObjectives(
    @Param('grade') grade: string,
    @Query('level') level: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.curriculumService.getRecommendedObjectives(parseInt(grade), level, limitNum);
  }

  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear curriculum cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  clearCache() {
    return this.curriculumService.clearCache();
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache stats' })
  getCacheStats() {
    return this.curriculumService.getCacheStats();
  }
}
