import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { WhatsAppService } from '../../../webhooks/meta/services/whatsapp.service';
import { CalendarService } from '../../../calendar/calendar.service';

@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppService: WhatsAppService,
    private readonly calendarService: CalendarService,
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

    const googleEventId = await this.calendarService.createEvent({
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.whatsappPhone,
      procedureName: appointment.procedureName,
      scheduledAt: appointment.scheduledAt,
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
    clinic: { whatsappNumberId: string; name: string };
  }): Promise<void> {
    const formattedDate = appointment.scheduledAt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    const message =
      `🎉 Pagamento confirmado! Sua vaga para *${appointment.procedureName}* no dia *${formattedDate}* está 100% garantida.\n\n` +
      `Qualquer dúvida, é só falar. Nos vemos lá! ✨`;

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
    } catch (waError) {
      this.logger.error(`[WEBHOOK] FALHA FATAL ao enviar WhatsApp (CONFIRMED): ${waError.message}`);
    }

    // Persiste no histórico para aparecer na Vitrine de Atendimento
    await (this.prisma as any).message.create({
      data: { patientId: appointment.patient.id, role: 'AI', content: message },
    }).catch((err: any) => this.logger.error(`[DB] Falha ao gravar mensagem de confirmação: ${err.message}`));
  }
}
