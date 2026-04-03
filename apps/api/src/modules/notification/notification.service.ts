import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../webhooks/meta/services/whatsapp.service';

export interface HandoffNotificationPayload {
  clinicWhatsappNumberId: string;
  receptionistPhone: string | null;
  receptionistName: string | null;
  patientName: string;
  patientPhone: string;
  handoffSummary: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly whatsapp: WhatsAppService) {}

  notifySecretary(payload: HandoffNotificationPayload): void {
    const { clinicWhatsappNumberId, receptionistPhone, patientName, patientPhone, handoffSummary } = payload;

    if (!receptionistPhone) {
      this.logger.warn('[NotificationService] receptionistPhone não configurado na clínica — notificação ignorada');
      return;
    }

    const text =
      `Nova transferência para atendimento humano.\n` +
      `Paciente: ${patientName}\n` +
      `Resumo: ${handoffSummary}\n` +
      `Telefone: ${patientPhone}`;

    // Fire-and-forget — falha não bloqueia o endpoint
    this.whatsapp.sendMessage(clinicWhatsappNumberId, receptionistPhone, text).catch((err) => {
      this.logger.error(`[NotificationService] Falha ao notificar secretária: ${err.message}`);
    });
  }
}
