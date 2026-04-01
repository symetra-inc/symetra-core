import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AsaasWebhookModule } from './modules/webhooks/asaas/asaas.module';
import { SerenaModule } from './modules/serena/serena.module';
import { MetaWebhookModule } from './modules/webhooks/meta/meta.module';
import { RedisModule } from './modules/redis/redis.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { CryptoService } from './services/crypto.service';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { MuteService } from './modules/mute/mute.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CalendarModule,
    AsaasWebhookModule,
    SerenaModule,
    MetaWebhookModule,
    CleanupModule,
    WhatsAppModule,
  ],
  providers: [CryptoService, MuteService],
})
export class AppModule {}