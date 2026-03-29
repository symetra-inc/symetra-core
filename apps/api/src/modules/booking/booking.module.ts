import { Module } from '@nestjs/common';
import { AgendaSweeperService } from './services/agenda-sweeper.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [AgendaSweeperService, PrismaService],
})
export class BookingModule {}