import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SummaryService } from '../summary/summary.service';
import { MuteService } from '../mute/mute.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly summary: SummaryService,
    private readonly mute: MuteService,
    private readonly notification: NotificationService,
  ) {}

  async findByClinic(clinicId: string) {
  return this.prisma.appointment.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
  });
  } 

  async handoff(appointmentId: string): Promise<{ appointmentId: string }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { clinic: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} não encontrado`);
    }

    // 1. Registra handoffTime no banco
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { handoffTime: new Date() },
    });

    // 2. Muta a IA (Banco + Redis dual write)
    await this.mute.setAiMuted(appointmentId, true);

    // 3. Gera resumo da conversa (sem salvar no banco — próximo milestone)
    const history = await this.redis.getConversationHistory(appointment.patient.whatsappPhone);
    let handoffSummary = 'Histórico de conversa indisponível.';
    try {
      if (history.length > 0) {
        handoffSummary = await this.summary.generateHandoffSummary(history);
      }
    } catch (err) {
      this.logger.error(`[HANDOFF] Falha ao gerar resumo OpenAI (appt=${appointmentId}): ${err.message}`);
    }

    // 4. Notifica secretária via WhatsApp (fire-and-forget — não bloqueia resposta)
    this.notification.notifySecretary({
      clinicWhatsappNumberId: appointment.clinic.whatsappNumberId,
      receptionistPhone: appointment.clinic.receptionistPhone ?? null,
      receptionistName: appointment.clinic.receptionistName ?? null,
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.whatsappPhone,
      handoffSummary,
    });

    return { appointmentId };
  }
}
