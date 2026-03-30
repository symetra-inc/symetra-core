import { Module } from '@nestjs/common';
import { AsaasWebhookController } from './controllers/asaas.controller';
import { AsaasWebhookService } from './services/asaas.service';
import { MetaWebhookModule } from '../meta/meta.module';

@Module({
  imports: [MetaWebhookModule],
  controllers: [AsaasWebhookController],
  providers: [AsaasWebhookService],
})
export class AsaasWebhookModule {}
