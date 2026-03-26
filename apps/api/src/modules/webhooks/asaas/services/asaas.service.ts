import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);

  // Injeção limpa e testável
  constructor(private readonly prisma: PrismaService) {}

  async processPaymentReceived(paymentId: string): Promise<void> {
    this.logger.log(`[WEBHOOK] Recebido liquidação: ${paymentId}`);

    const result = await this.prisma.appointment.updateMany({
      where: {
        asaas_payment_id: paymentId,
        status: 'PENDING',
      },
      data: {
        status: 'PAID',
        updated_at: new Date(),
      },
    });

    if (result.count === 0) {
      this.logger.warn(`[IDEMPOTÊNCIA] Pagamento ${paymentId} ignorado ou inexistente.`);
      return; 
    }

    this.logger.log(`[SUCESSO] Agendamento liquidado. Iniciando Handoff.`);
    this.triggerHandoff(paymentId);
  }

  private triggerHandoff(paymentId: string) {
    this.logger.log(`>>> HANDOFF EXECUTADO: O Lead pagante chegou no CRM. <<<`);
  }
}