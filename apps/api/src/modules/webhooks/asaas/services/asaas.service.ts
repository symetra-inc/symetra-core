import { Injectable, Logger } from '@nestjs/common';
import { PersonaType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { WhatsAppService } from '../../../webhooks/meta/services/whatsapp.service';
import { CalendarService } from '../../../calendar/calendar.service';
import { NotificationService } from '../../../notification/notification.service';

// ── Mensagem de confirmação de pagamento por persona ──────────────────────────

function getPaymentConfirmationMessage(
  persona: PersonaType | string,
  appointment: { procedureName: string; scheduledAt: Date },
): string {
  const tz = 'America/Sao_Paulo';
  const data = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz,
  }).format(appointment.scheduledAt);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  }).format(appointment.scheduledAt);
  const proc = appointment.procedureName;

  const messages: Record<string, string> = {
    [PersonaType.SOFISTICADA]:
      `✨ Pagamento confirmado. Seu horário para *${proc}* em *${data} às ${hora}* está reservado.\n` +
      `Em breve nossa recepcionista entrará em contato para confirmar os detalhes finais.\nAté lá! 🤍`,
    [PersonaType.ARISTOCRATA]:
      `Confirmamos o recebimento do seu pagamento.\n` +
      `O agendamento de *${proc}* para *${data} às ${hora}* está devidamente registrado.\n` +
      `Nossa recepcionista estará em contato em instantes para os próximos passos.`,
    [PersonaType.ESPECIALISTA]:
      `Pagamento recebido com sucesso! ✅\n` +
      `Sua consulta de *${proc}* está confirmada para *${data} às ${hora}*.\n` +
      `Nossa recepcionista vai te contatar em breve para alinhar os detalhes. Qualquer dúvida, pode perguntar!`,
  };

  return messages[persona] ?? messages[PersonaType.SOFISTICADA];
}

@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppService: WhatsAppService,
    private readonly calendarService: CalendarService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── PAYMENT_RECEIVED / PAYMENT_CONFIRMED ─────────────────────────────────────
  async processPaymentConfirmed(paymentId: string): Promise<void> {
    this.logger.log(`[WEBHOOK] Iniciando processamento do evento PAYMENT_CONFIRMED para invoice: ${paymentId}`);

    this.logger.log(`[WEBHOOK] Buscando Appointment com asaasInvoiceId: ${paymentId} e status PENDING...`);
    const appointment = await this.prisma.appointment.findFirst({
      where: { asaasInvoiceId: paymentId, status: 'PENDING' },
      include: { patient: true, clinic: true },
    });

    if (!appointment) {
      this.logger.warn(`[WEBHOOK] Appointment não encontrado no banco para invoice ${paymentId}. Já processado ou inexistente.`);
      return;
    }

    this.logger.log(
      `[WEBHOOK] Appointment encontrado! Paciente: ${appointment.patient.name} ` +
      `(ID: ${appointment.patient.id}, Telefone: ${appointment.patient.whatsappPhone}) | ` +
      `Clínica: ${appointment.clinic.name} | Procedimento: ${appointment.procedureName}`,
    );

    this.logger.log(`[WEBHOOK] Atualizando status no Prisma para PAID...`);
    try {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'PAID', paymentConfirmedAt: new Date(), lockedUntil: null },
      });
      this.logger.log(`[WEBHOOK] Agendamento ${appointment.id} → PAID. Trava removida com sucesso.`);
    } catch (dbError) {
      this.logger.error(`[WEBHOOK] FALHA ao atualizar agendamento ${appointment.id} no Prisma: ${dbError.message}`);
      throw dbError;
    }

    // Coerção explícita: o cast `as any` existe porque o Prisma client pode estar com tipos
    // desatualizados em relação ao schema. Number() protege contra null e serialização como string.
    const rawDuration = (appointment as any).durationMinutes;
    const appointmentDuration = Number(rawDuration) || 60;
    if (!rawDuration) {
      this.logger.warn(
        `[WEBHOOK] durationMinutes ausente no appointment ${appointment.id} — usando fallback 60min`,
      );
    }

    const googleEventId = await this.calendarService.createEvent({
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.whatsappPhone,
      procedureName: appointment.procedureName,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointmentDuration,
    });

    if (googleEventId) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { googleEventId },
      }).catch((err: any) => this.logger.error(`[DB] Falha ao salvar googleEventId: ${err.message}`));
    }

    await this.sendPaymentConfirmation(appointment);
  }

  // ── PAYMENT_REFUSED ───────────────────────────────────────────────────────────
  async processPaymentRefused(paymentId: string): Promise<void> {
    this.logger.warn(`[WEBHOOK] Iniciando processamento do evento PAYMENT_REFUSED para invoice: ${paymentId}`);

    this.logger.log(`[WEBHOOK] Buscando Appointment com asaasInvoiceId: ${paymentId}...`);
    const appointment = await this.prisma.appointment.findFirst({
      where: { asaasInvoiceId: paymentId },
      include: { patient: true, clinic: true },
    });

    if (!appointment) {
      this.logger.warn(`[WEBHOOK] Appointment não encontrado no banco para invoice ${paymentId}.`);
      return;
    }

    this.logger.log(
      `[WEBHOOK] Appointment encontrado! Paciente: ${appointment.patient.name} ` +
      `(ID: ${appointment.patient.id}, Telefone: ${appointment.patient.whatsappPhone}) | ` +
      `Status atual: ${appointment.status}`,
    );

    this.logger.log(`[WEBHOOK] Atualizando status no Prisma para CANCELLED...`);
    try {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED', lockedUntil: null },
      });
      this.logger.log(`[WEBHOOK] Agendamento ${appointment.id} → CANCELLED (pagamento recusado).`);
    } catch (dbError) {
      this.logger.error(`[WEBHOOK] FALHA ao cancelar agendamento ${appointment.id}: ${dbError.message}`);
    }

    if ((appointment as any).googleEventId) {
      await this.calendarService.deleteEvent((appointment as any).googleEventId);
    }

    const msg =
      'Infelizmente, o pagamento não foi aprovado pelo sistema bancário. ' +
      'Por favor, verifique os dados do seu banco ou tente outro método. ' +
      'Estamos aqui para ajudar — é só me chamar para reagendar!';

    this.logger.log(`[WEBHOOK] Chamando o WhatsAppService para enviar notificação de recusa para ${appointment.patient.whatsappPhone}...`);
    try {
      await this.whatsAppService.sendMessage(
        appointment.clinic.whatsappNumberId,
        appointment.patient.whatsappPhone,
        msg,
      );
      this.logger.log(`[WEBHOOK] Mensagem de recusa enviada com sucesso para ${appointment.patient.whatsappPhone}`);
    } catch (error) {
      this.logger.error(`[WEBHOOK] FALHA FATAL ao enviar WhatsApp (REFUSED): ${error.message}`);
    }

    // Persiste no histórico para aparecer na Vitrine de Atendimento
    await (this.prisma as any).message.create({
      data: { patientId: appointment.patient.id, role: 'AI', content: msg },
    }).catch((err: any) => this.logger.error(`[DB] Falha ao gravar mensagem de recusa: ${err.message}`));
  }

  // ── CONFIRMAÇÃO DE PAGAMENTO (WhatsApp) ───────────────────────────────────────
  private async sendPaymentConfirmation(appointment: {
    procedureName: string;
    scheduledAt: Date;
    patient: { id: string; whatsappPhone: string; name: string };
    clinic: {
      whatsappNumberId: string;
      name: string;
      persona: PersonaType;
      receptionistPhone: string | null;
      receptionistName: string | null;
    };
  }): Promise<void> {
    const message = getPaymentConfirmationMessage(appointment.clinic.persona, appointment);

    this.logger.log(
      `[WEBHOOK] Chamando o WhatsAppService para enviar confirmação de pagamento para ${appointment.patient.whatsappPhone} ` +
      `(clínica PhoneId: ${appointment.clinic.whatsappNumberId})...`,
    );
    try {
      await this.whatsAppService.sendMessage(
        appointment.clinic.whatsappNumberId,
        appointment.patient.whatsappPhone,
        message,
      );
      this.logger.log(`[WEBHOOK] Mensagem de confirmação enviada com sucesso para ${appointment.patient.whatsappPhone}`);

      // Notifica a recepcionista (fire-and-forget)
      this.notificationService.notifySecretary({
        clinicWhatsappNumberId: appointment.clinic.whatsappNumberId,
        receptionistPhone: appointment.clinic.receptionistPhone,
        receptionistName: appointment.clinic.receptionistName,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.whatsappPhone,
        handoffSummary: appointment.procedureName,
      });
    } catch (waError) {
      this.logger.error(`[WEBHOOK] FALHA FATAL ao enviar WhatsApp (CONFIRMED): ${waError.message}`);
    }

    // Persiste no histórico para aparecer na Vitrine de Atendimento
    await (this.prisma as any).message.create({
      data: { patientId: appointment.patient.id, role: 'AI', content: message },
    }).catch((err: any) => this.logger.error(`[DB] Falha ao gravar mensagem de confirmação: ${err.message}`));
  }
}
