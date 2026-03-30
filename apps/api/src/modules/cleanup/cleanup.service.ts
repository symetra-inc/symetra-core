import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Limpa agendamentos PENDING cujo lockedUntil já expirou.
   * Roda a cada 5 minutos — libera vagas travadas por Pix não pagos.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelExpiredAppointments(): Promise<void> {
    const now = new Date();

    const result = await this.prisma.appointment.updateMany({
      where: {
        status: 'PENDING',
        lockedUntil: { lt: now },
      },
      data: { status: 'CANCELLED' },
    });

    if (result.count > 0) {
      this.logger.log(`[LIMPA-AGENDA] ${result.count} agendamento(s) expirado(s) → CANCELLED.`);
    }
  }
}
