import { Controller, Get, Post, Body, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { MetaWebhookGuard } from './guards/meta-webhook.guard';
import { AsaasWebhookGuard } from './guards/asaas-webhook.guard';
import { WhatsAppService } from './modules/webhooks/meta/services/whatsapp.service';

@Controller('webhooks')
export class AppController {
  constructor(private readonly waService: WhatsAppService) {}
  @Get('meta')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    // Usaremos a senha antiga do seu código legado para não ter erro
    const VERIFY_TOKEN = 'Symetra_123';

    console.log(`Tentativa da Meta -> mode: ${mode} | token: ${token}`);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook da Meta Verificado com Sucesso!');
      return res.status(HttpStatus.OK).send(challenge);
    }
    
    console.log('❌ Token inválido ou requisição incorreta.');
    return res.status(HttpStatus.FORBIDDEN).send('Acesso Negado');
  }

  // ==========================================
  // RECEBIMENTO DAS MENSAGENS (O POST REAL)
  // ==========================================
@Post('meta')
  async handleIncomingMessages(@Body() body: any, @Res() res: Response) {
    // 1. Responde 200 OK para a Meta não reenviar o evento
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    // 2. Extrai os dados da mensagem recebida
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.type === 'text') {
      const customerPhone = message.from; // O número de quem mandou
      const customerText = message.text.body;

      console.log(`📩 Mensagem de ${customerPhone}: ${customerText}`);

      // 3. TESTE DE ECO: Responde o usuário
      await this.waService.sendMessage(
        customerPhone, 
        `Symetra OS: Eu ouvi você dizer "${customerText}". O motor está vivo!`
      );
    }
  }

  // ==========================================
  // RECEBIMENTO FINANCEIRO (ASAAS)
  // ==========================================
  @Post('asaas')
  @UseGuards(AsaasWebhookGuard)
  receiveAsaasPayment(@Body() body: any) {
    console.log('💰 Webhook Asaas Validado e Recebido:', JSON.stringify(body, null, 2));
    return { status: 'Pagamento processado com segurança.' };
  }
}