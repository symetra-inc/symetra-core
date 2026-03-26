import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AsaasWebhookModule } from './modules/webhooks/asaas/asaas.module';
import { BookingModule } from './modules/booking/booking.module';
import { SerenaModule } from './modules/serena/serena.module';
import { MetaWebhookModule } from './modules/webhooks/meta/meta.module';

@Module({   
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AsaasWebhookModule,
    BookingModule,
    SerenaModule,
    MetaWebhookModule,
  ],
})
export class AppModule {}