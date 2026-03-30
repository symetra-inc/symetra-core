import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MetaWebhookService } from './modules/webhooks/meta/services/meta.service';

@Controller('webhooks')
export class AppController {
  constructor(private readonly metaService: MetaWebhookService) {}

  // ==========================================
  // VALIDAÇÃO INICIAL DA META (GET)
  // ==========================================
  @Get('meta')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    const VERIFY_TOKEN = 'Symetra_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook da Meta Verificado com Sucesso!');
      return res.status(HttpStatus.OK).send(challenge);
    }
    
    console.log('❌ Token inválido ou requisição incorreta.');
    return res.status(HttpStatus.FORBIDDEN).send('Acesso Negado');
  }

  // ==========================================
  // RECEBIMENTO DAS MENSAGENS DO WHATSAPP (POST)
  // ==========================================
  @Post('meta')
  async handleIncomingMessages(@Body() body: any, @Res() res: Response) {
    // 1. Libera a Meta imediatamente para não dar timeout (SLA de 2 segundos)
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    // 2. Joga o JSON para o Service processar em background (Sem 'await')
    // Isso garante que o servidor não trave esperando a OpenAI responder
    this.metaService.processIncomingMessage(body);
  }

}