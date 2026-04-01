import { Module } from '@nestjs/common';
import { SerenaService } from './services/serena.service';
import { CalendarModule } from '../calendar/calendar.module';
import { AsaasModule } from '../asaas/asaas.module';
import { CryptoService } from '../../services/crypto.service';

@Module({
  imports: [CalendarModule, AsaasModule],
  providers: [SerenaService, CryptoService],
  exports: [SerenaService],
})
export class SerenaModule {}