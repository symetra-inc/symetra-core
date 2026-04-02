import { Module } from '@nestjs/common';
import { MuteService } from './mute.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [MuteService],
  exports: [MuteService],
})
export class MuteModule {}
