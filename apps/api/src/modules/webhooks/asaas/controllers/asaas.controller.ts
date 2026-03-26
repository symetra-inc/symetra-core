import { Controller, Post, Body, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { AsaasWebhookService } from '../services/asaas.service';
import { asaasPayloadSchema } from '../dto/asaas-payload.dto';

@Controller('webhooks/asaas')
export class AsaasWebhookController {
  constructor(private readonly asaasService: AsaasWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(
    @Headers('asaas-access-token') token: string,
    @Body() payload: unknown,
  ) {
    if (token !== process.env.ASAAS_WEBHOOK_SECRET) {
      throw new UnauthorizedException('Token inválido.');
    }

    const parsedData = asaasPayloadSchema.safeParse(payload);
    
    if (!parsedData.success) {
      return { status: 'invalid_payload_ignored' }; 
    }

    const { event, payment } = parsedData.data;

    if (event === 'PAYMENT_RECEIVED') {
      await this.asaasService.processPaymentReceived(payment.id);
    }

    return { status: 'received' };
  }
}