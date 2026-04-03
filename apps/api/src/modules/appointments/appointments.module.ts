import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SummaryModule } from '../summary/summary.module';
import { MuteModule } from '../mute/mute.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, RedisModule, SummaryModule, MuteModule, NotificationModule, AuthModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
