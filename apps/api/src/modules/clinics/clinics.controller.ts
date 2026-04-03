import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type JwtUser } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { ClinicsService, type AppointmentFilters, type UpdateClinicDto } from './clinics.service';

@UseGuards(JwtAuthGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  private assertOwner(user: JwtUser, clinicId: string) {
    if (user.clinicId !== clinicId) throw new ForbiddenException('Acesso negado a esta clínica');
  }

  // GET /clinics/:id
  @Get(':id')
  getClinic(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    this.assertOwner(user, id);
    return this.clinics.findOne(id);
  }

  // PATCH /clinics/:id
  @Patch(':id')
  updateClinic(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateClinicDto,
  ) {
    this.assertOwner(user, id);
    return this.clinics.update(id, body);
  }

  // GET /clinics/:id/appointments/metrics  ← declarada ANTES da rota geral
  @Get(':id/appointments/metrics')
  getMetrics(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    this.assertOwner(user, id);
    return this.clinics.getMetrics(id);
  }

  // GET /clinics/:id/appointments
  @Get(':id/appointments')
  getAppointments(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.assertOwner(user, id);
    const filters: AppointmentFilters = { status, startDate, endDate };
    return this.clinics.findAppointments(id, filters);
  }

  // GET /clinics/:id/patients
  @Get(':id/patients')
  getPatients(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    this.assertOwner(user, id);
    return this.clinics.findPatients(id);
  }
}
