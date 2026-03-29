import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { subMinutes } from 'date-fns'; // Já instalamos no setup inicial

@Injectable()
export class AgendaSweeperService {
  private readonly logger = new Logger(AgendaSweeperService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Executa rigorosamente a cada 1 minuto (Operador de Guerra não perde tempo)
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseUnpaidSlots() {
    // Calcula o timestamp de exatos 15 minutos atrás
    const expirationTime = subMinutes(new Date(), 15);

    try {
      // ANQUILAÇÃO FISICA: Deletamos a reserva para liberar o slot no banco.
      // O lead continua existindo na tabela `Lead`, mas a cadeira volta pro mercado.
      const result = await this.prisma.appointment.deleteMany({
        where: {
          status: 'PENDING',
          lockedUntil: {
            lte: expirationTime, // Menor ou igual a 15 minutos atrás
          },
        },
      });

      if (result.count > 0) {
        this.logger.warn(`[SWEEPER] ${result.count} reserva(s) expirada(s) aniquilada(s). Cadeira(s) devolvida(s) ao mercado.`);
      }
    } catch (error) {
      this.logger.error(`[SWEEPER] Falha ao varrer o banco: ${error.message}`);
    }
  }
}