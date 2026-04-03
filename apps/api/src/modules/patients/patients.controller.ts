import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type JwtUser } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { PatientsService } from './patients.service';

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  // GET /patients/:id/messages
  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.patients.getMessages(id, user.clinicId!);
  }
}
