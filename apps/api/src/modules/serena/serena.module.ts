import { Module } from '@nestjs/common';
import { SerenaService } from './services/serena.service';

@Module({
  providers: [SerenaService],
  exports: [SerenaService], // Exportamos para que o webhook do WhatsApp possa usá-la
})
export class SerenaModule {}