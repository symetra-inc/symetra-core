import { Module } from '@nestjs/common';
import { AgendaSweeperService } from './services/agenda-sweeper.service';

@Module({
  providers: [AgendaSweeperService],
})
export class BookingModule {}