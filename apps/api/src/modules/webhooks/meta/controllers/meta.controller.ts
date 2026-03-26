import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MetaWebhookService } from '../services/meta.service';

@Controller('webhooks/meta')
export class MetaWebhookController {
  // Token de segurança hardcoded temporário para o MVP (o Meta vai te pedir para criar um na hora de cadastrar a URL)
  private readonly VERIFY_TOKEN = 'symetra_core_verificacao_absoluta_2026';

  constructor(private readonly metaService: MetaWebhookService) {}

  // Rota GET: Usada exclusivamente pelo Facebook para validar que a URL é sua
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
      // O Meta exige que você devolva APENAS o número do challenge, como texto puro (Status 200)
      return res.status(HttpStatus.OK).send(challenge);
    }
    // Se tentarem forjar, devolvemos 403 Forbidden
    return res.status(HttpStatus.FORBIDDEN).send();
  }

  // Rota POST: Onde a guerra acontece (O usuário manda mensagem)
  @Post()
  async handleIncomingMessages(@Body() body: any, @Res() res: Response) {
    // 1. Devolvemos 200 OK instantaneamente para o Meta calar a boca e não dar timeout.
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    // 2. Disparamos a máquina de estados em background (NÃO usamos await aqui)
    if (body.object === 'whatsapp_business_account') {
      this.metaService.processIncomingMessage(body).catch((err) => {
        // Ignoramos silenciosamente erros do loop background para não derrubar a thread
      });
    }
  }
}