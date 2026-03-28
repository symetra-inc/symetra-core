import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaWebhookService } from './services/meta.service';
import { SerenaModule } from '../../serena/serena.module';

@Module({
  imports: [
    HttpModule, // Habilita o disparo de requisições para fora (Graph API)
    SerenaModule, // Traz o cérebro da IA para perto do WhatsApp
  ],
  providers: [MetaWebhookService],
})
export class MetaWebhookModule {}