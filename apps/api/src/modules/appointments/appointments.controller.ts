import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post(':id/handoff')
  @HttpCode(HttpStatus.OK)
  handoff(@Param('id') id: string) {
    return this.appointmentsService.handoff(id);
  }

  @Get('/clinics/:clinicId/appointments')
  findByClinic(@Param('clinicId') clinicId: string) {
    return this.appointmentsService.findByClinic(clinicId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('clinicId') clinicId?: string,
    @Query('status') status?: string,
  ) {
    if (!clinicId) {
      throw new BadRequestException('clinicId é obrigatório');
    }
    return this.appointmentsService.findByClinic(clinicId);
  }

}
