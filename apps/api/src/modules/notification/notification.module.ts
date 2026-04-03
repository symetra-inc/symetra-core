import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

// WhatsAppModule é @Global() — WhatsAppService disponível sem importar aqui
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
