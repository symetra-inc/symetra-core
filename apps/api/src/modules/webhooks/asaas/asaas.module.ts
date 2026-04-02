import { Module } from '@nestjs/common';
import { AsaasWebhookController } from './controllers/asaas.controller';
import { AsaasWebhookService } from './services/asaas.service';
import { MetaWebhookModule } from '../meta/meta.module';
import { CalendarModule } from '../../calendar/calendar.module';

@Module({
  imports: [MetaWebhookModule, CalendarModule],
  controllers: [AsaasWebhookController],
  providers: [AsaasWebhookService],
})
export class AsaasWebhookModule {}
