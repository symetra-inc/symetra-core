import { Module } from '@nestjs/common';
import { AsaasWebhookController } from './controllers/asaas.controller';
import { AsaasWebhookService } from './services/asaas.service';
import { MetaWebhookModule } from '../meta/meta.module';
import { CalendarModule } from '../../calendar/calendar.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [MetaWebhookModule, CalendarModule, NotificationModule],
  controllers: [AsaasWebhookController],
  providers: [AsaasWebhookService],
})
export class AsaasWebhookModule {}
