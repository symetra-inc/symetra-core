import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaWebhookController } from './controllers/meta.controller';
import { MetaWebhookService } from './services/meta.service';
import { SerenaModule } from '../../serena/serena.module';

@Module({
  imports: [
    HttpModule, // Habilita o disparo de requisições para fora (Graph API)
    SerenaModule, // Traz o cérebro da IA para perto do WhatsApp
  ],
  controllers: [MetaWebhookController],
  providers: [MetaWebhookService],
})
export class MetaWebhookModule {}