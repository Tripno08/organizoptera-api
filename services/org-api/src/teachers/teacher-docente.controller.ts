/**
 * Teacher DocenTe Controller
 *
 * REST API endpoints for managing teacher DocenTe profiles.
 *
 * @module @organizoptera/org-api/teachers/teacher-docente
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeacherDocenteService } from './teacher-docente.service';
import {
  CreateDocenteProfileDto,
  UpdateDocenteProfileDto,
  UpdateBurnoutRiskDto,
  BurnoutRiskLevel,
} from './dto/docente-profile.dto';

@Controller('teachers')
export class TeacherDocenteController {
  constructor(private readonly docenteService: TeacherDocenteService) {}

  /**
   * Get teacher's DocenTe profile
   * GET /teachers/:id/docente-profile
   */
  @Get(':id/docente-profile')
  async getProfile(@Param('id') teacherId: string) {
    return this.docenteService.getProfile(teacherId);
  }

  /**
   * Create DocenTe profile
   * POST /teachers/:id/docente-profile
   */
  @Post(':id/docente-profile')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @Param('id') teacherId: string,
    @Body() dto: CreateDocenteProfileDto
  ) {
    return this.docenteService.createOrUpdateProfile(teacherId, dto);
  }

  /**
   * Update DocenTe profile
   * PATCH /teachers/:id/docente-profile
   */
  @Patch(':id/docente-profile')
  async updateProfile(
    @Param('id') teacherId: string,
    @Body() dto: UpdateDocenteProfileDto
  ) {
    return this.docenteService.updateProfile(teacherId, dto);
  }

  /**
   * Delete DocenTe profile
   * DELETE /teachers/:id/docente-profile
   */
  @Delete(':id/docente-profile')
  async deleteProfile(@Param('id') teacherId: string) {
    return this.docenteService.deleteProfile(teacherId);
  }

  /**
   * Get calculated adaptation protocol
   * GET /teachers/:id/adaptation-protocol
   */
  @Get(':id/adaptation-protocol')
  async getProtocol(@Param('id') teacherId: string) {
    return this.docenteService.getProtocol(teacherId);
  }

  /**
   * Update burnout risk assessment
   * PUT /teachers/:id/burnout-risk
   */
  @Put(':id/burnout-risk')
  async updateBurnoutRisk(
    @Param('id') teacherId: string,
    @Body() dto: UpdateBurnoutRiskDto
  ) {
    return this.docenteService.updateBurnoutRisk(teacherId, dto);
  }

  /**
   * List all teachers with DocenTe profiles in a school
   * GET /teachers/docente-profiles?schoolId=xxx
   */
  @Get('docente-profiles')
  async listProfilesBySchool(@Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new Error('schoolId query parameter is required');
    }
    return this.docenteService.listProfilesBySchool(schoolId);
  }

  /**
   * Get teachers by burnout risk level
   * GET /teachers/by-burnout-risk?schoolId=xxx&level=ALTO
   */
  @Get('by-burnout-risk')
  async getTeachersByBurnoutRisk(
    @Query('schoolId') schoolId: string,
    @Query('level') level: BurnoutRiskLevel
  ) {
    if (!schoolId || !level) {
      throw new Error('schoolId and level query parameters are required');
    }
    return this.docenteService.getTeachersByBurnoutRisk(schoolId, level);
  }
}
