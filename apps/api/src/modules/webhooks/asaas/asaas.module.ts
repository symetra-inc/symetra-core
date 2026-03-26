import { Module } from '@nestjs/common';
import { AsaasWebhookController } from './controllers/asaas.controller';
import { AsaasWebhookService } from './services/asaas.service';

@Module({
  controllers: [AsaasWebhookController],
  providers: [AsaasWebhookService],
})
export class AsaasWebhookModule {}