import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaWebhookService } from './services/meta.service';
import { SerenaModule } from '../../serena/serena.module';
import { WhatsAppService } from './services/whatsapp.service';
import { MetaWebhookController } from './controllers/meta-webhook.controller';
import { AsaasModule } from '../../asaas/asaas.module';
import { CryptoModule } from '../../../infrastructure/crypto/crypto.module';

@Module({
  imports: [
    HttpModule,
    SerenaModule,
    AsaasModule,
    CryptoModule,
  ],
  controllers: [MetaWebhookController],
  providers: [MetaWebhookService, WhatsAppService],
  exports: [MetaWebhookService, WhatsAppService],
})
export class MetaWebhookModule {}