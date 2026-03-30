import { Global, Module } from '@nestjs/common';
import { WhatsAppService } from '../webhooks/meta/services/whatsapp.service';

@Global()
@Module({
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
