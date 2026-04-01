import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { AsaasWebhookService } from '../services/asaas.service';
import { asaasPayloadSchema } from '../dto/asaas-payload.dto';
import { AsaasWebhookGuard } from '../../../../../webhooks/guards/asaas-webhook.guard';

const PAYMENT_CONFIRMED_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);
const PAYMENT_REFUSED_EVENTS = new Set(['PAYMENT_REFUSED', 'PAYMENT_DELETED', 'PAYMENT_OVERDUE']);

@Controller('webhooks/asaas')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);

  constructor(private readonly asaasService: AsaasWebhookService) {}

  @UseGuards(AsaasWebhookGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(@Body() payload: unknown) {
    this.logger.log(`[WEBHOOK] Payload bruto recebido: ${JSON.stringify(payload)}`);

    const parsedData = asaasPayloadSchema.safeParse(payload);
    if (!parsedData.success) {
      this.logger.warn(`[WEBHOOK] Payload inválido ignorado. Erros: ${JSON.stringify(parsedData.error.issues)}`);
      return { status: 'invalid_payload_ignored' };
    }

    const { event, payment } = parsedData.data;
    this.logger.log(`[WEBHOOK] Evento parseado: ${event} | Invoice: ${payment.id}`);

    if (PAYMENT_CONFIRMED_EVENTS.has(event)) {
      await this.asaasService.processPaymentConfirmed(payment.id);
    } else if (PAYMENT_REFUSED_EVENTS.has(event)) {
      await this.asaasService.processPaymentRefused(payment.id);
    } else {
      this.logger.log(`[WEBHOOK] Evento ignorado silenciosamente: ${event}`);
    }

    return { status: 'received' };
  }
}
