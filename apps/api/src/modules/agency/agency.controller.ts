import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard, type JwtUser } from '../../auth/jwt-auth.guard';

@Controller('agency')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get('clinics')
  getClinics(@CurrentUser() user: JwtUser) {
    if (!user.agencyId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma agência');
    }
    return this.agencyService.getClinics(user.agencyId);
  }
}
