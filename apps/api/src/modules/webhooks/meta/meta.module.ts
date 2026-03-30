import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaWebhookService } from './services/meta.service';
import { SerenaModule } from '../../serena/serena.module';
import { WhatsAppService } from './services/whatsapp.service';

@Module({
  imports: [
    HttpModule,
    SerenaModule,
  ],
  providers: [MetaWebhookService, WhatsAppService],
  exports: [MetaWebhookService, WhatsAppService],
})
export class MetaWebhookModule {}