import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AsaasWebhookModule } from './modules/webhooks/asaas/asaas.module';
import { BookingModule } from './modules/booking/booking.module';
import { SerenaModule } from './modules/serena/serena.module';
import { MetaWebhookModule } from './modules/webhooks/meta/meta.module';
import { RedisModule } from './modules/redis/redis.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { AppController } from './app.controller';
import { CryptoService } from './services/crypto.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CalendarModule,
    AsaasWebhookModule,
    BookingModule,
    SerenaModule,
    MetaWebhookModule,
    CleanupModule,
  ],
  controllers: [AppController],
  providers: [CryptoService],
})
export class AppModule {}