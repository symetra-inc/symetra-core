import { Module } from '@nestjs/common';
import { SerenaService } from './services/serena.service';
import { CalendarModule } from '../calendar/calendar.module';
import { AsaasModule } from '../asaas/asaas.module';

@Module({
  imports: [CalendarModule, AsaasModule],
  providers: [SerenaService],
  exports: [SerenaService],
})
export class SerenaModule {}