import { Module } from '@nestjs/common';
import { SerenaService } from './services/serena.service';
import { CalendarModule } from '../calendar/calendar.module';
import { AsaasModule } from '../asaas/asaas.module';
import { CryptoModule } from '../../infrastructure/crypto/crypto.module';

@Module({
  imports: [CalendarModule, AsaasModule, CryptoModule],
  providers: [SerenaService],
  exports: [SerenaService],
})
export class SerenaModule {}