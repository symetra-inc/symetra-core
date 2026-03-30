import { Controller, Post, Body, HttpCode, HttpStatus, Headers, Logger, UnauthorizedException } from '@nestjs/common';
import { AsaasWebhookService } from '../services/asaas.service';
import { asaasPayloadSchema } from '../dto/asaas-payload.dto';

const PAYMENT_CONFIRMED_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);
const PAYMENT_REFUSED_EVENTS = new Set(['PAYMENT_REFUSED', 'PAYMENT_DELETED', 'PAYMENT_OVERDUE']);

@Controller('webhooks/asaas')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);

  constructor(private readonly asaasService: AsaasWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(
    @Headers('asaas-access-token') token: string,
    @Body() payload: unknown,
  ) {
    // Segurança: valida token apenas quando ASAAS_WEBHOOK_TOKEN está configurado
    const webhookSecret = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookSecret) {
      if (token !== webhookSecret) {
        throw new UnauthorizedException('Token inválido.');
      }
    } else {
      this.logger.warn('[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado — validação de token ignorada (modo teste).');
    }

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
