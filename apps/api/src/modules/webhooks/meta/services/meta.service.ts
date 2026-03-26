import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { SerenaService, SerenaAction } from '../../../serena/services/serena.service';

@Injectable()
export class MetaWebhookService {
  private readonly logger = new Logger(MetaWebhookService.name);
  
  // Memória de Curto Prazo (Evita duplicatas da rede do Meta)
  private processedMessages = new Set<string>();
  
  // Memória de Contexto da IA (Armazena o histórico da conversa por telefone)
  // No Marco 0 usamos memória RAM. Na Fase 2 migraremos para Redis.
  private conversationHistory = new Map<string, any[]>();

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly serenaService: SerenaService,
  ) {}

  async processIncomingMessage(payload: any): Promise<void> {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const metadata = changes?.metadata;

      if (!message || message.type !== 'text') return;

      const messageId = message?.id;
      const leadPhone = message?.from;
      const leadText = message?.text?.body;
      const clinicPhoneId = metadata?.phone_number_id;

      // ESCUDO ESTRITO: Se faltar qualquer dado vital do Meta, abortamos.
      // Isso transforma as variáveis de (string | undefined) em strings absolutas.
      if (!messageId || !leadPhone || !leadText || !clinicPhoneId) {
        this.logger.warn(`[META] Payload malformado ignorado.`);
        return;
      }
      // 1. Trava de Deduplicação
      if (this.processedMessages.has(messageId)) return;
      this.processedMessages.add(messageId);
      if (this.processedMessages.size > 1000) this.processedMessages.clear();

      this.logger.log(`[WHATSAPP] Mensagem recebida de ${leadPhone}: "${leadText}"`);

      // 2. Injeção de Contexto (Descobre quem é a Clínica dona deste número)
      const clinic = await this.prisma.clinic.findUnique({
        where: { whatsapp_number_id: clinicPhoneId },
      });

      if (!clinic) {
        this.logger.warn(`[ROTEAMENTO] Clínica não encontrada para o Phone ID: ${clinicPhoneId}. Ignorando.`);
        return;
      }

      // 3. Gestão do Lead (Busca ou Cria)
      let lead = await this.prisma.lead.findUnique({ where: { phone: leadPhone } });
      if (!lead) {
        lead = await this.prisma.lead.create({
          data: { phone: leadPhone, clinic_id: clinic.id },
        });
        this.logger.log(`[LEAD] Novo lead registrado: ${leadPhone}`);
      }

      // 4. Recupera o Histórico de Conversa
      const history = this.conversationHistory.get(leadPhone) || [];
      history.push({ role: 'user', content: leadText });

      // 5. Aciona o Cérebro (Function Calling) passando as regras dinâmicas do banco
      const action: SerenaAction = await this.serenaService.processConversation(history, clinic);

      // 6. Atualiza a memória da IA com a ação que ela tomou
      if (action.type === 'reply' && action.text) {
        await this.sendMessageToWhatsApp(leadPhone, action.text);
        return;
      }
      this.conversationHistory.set(leadPhone, history);

      // 7. O Roteador de Ações (A Mágica Acontece Aqui)
      await this.executeAction(action, lead.id, leadPhone, clinic);

    } catch (error) {
      this.logger.error(`[META] Falha crítica no orquestrador: ${error.message}`);
    }
  }

  private async executeAction(action: SerenaAction, leadId: string, leadPhone: string, clinic: any) {
    // AÇÃO 1: Resposta normal de texto
    if (action.type === 'reply') {
      // TRAVA ABSOLUTA PARA O COMPILADOR
      if (!action.text) {
        this.logger.error(`[FALHA] IA tentou responder sem texto. Lead: ${leadPhone}`);
        return;
      }
      
      // Agora o TypeScript SABE que action.text é 100% string
      await this.sendMessageToWhatsApp(leadPhone, action.text);
      return;
    }

    // AÇÃO 2: Handoff para Humano (Reagendamento ou Exceção)
    if (action.type === 'handoff_reschedule') {
      const handoffMsg = "Entendido. Como este procedimento possui uma garantia financeira atrelada, estou transferindo seu atendimento para a nossa Concierge Humana finalizar o ajuste na agenda.";
      await this.sendMessageToWhatsApp(leadPhone, handoffMsg);
      this.logger.warn(`[HANDOFF] Alerta acionado para a clínica ${clinic.name}. Lead: ${leadPhone}`);
      // TODO (Fase 2): Disparar notificação no painel ou e-mail da clínica
      return;
    }

    // AÇÃO 3: O Gatilho de Fechamento (Geração de Pix e Trava)
    if (action.type === 'generate_pix' && action.bookingData) {
      await this.handlePixGeneration(action.bookingData, leadId, leadPhone, clinic);
    }
  }

  private async handlePixGeneration(bookingData: any, leadId: string, leadPhone: string, clinic: any) {
    try {
      this.logger.log(`[MOTOR] Iniciando trava de agenda e geração de Pix para ${leadPhone}`);

      // 1. A TRAVA ATÔMICA (Tenta salvar no banco. Se o horário já estiver ocupado, o Prisma grita erro P2002)
      const appointment = await this.prisma.appointment.create({
        data: {
          procedure: bookingData.procedure,
          target_date: new Date(bookingData.target_date),
          clinic_id: clinic.id,
          lead_id: leadId,
          status: 'PENDING',
        },
      });

      // 2. GERAÇÃO DO PIX NO ASAAS
      let asaasApiKey: string | undefined = clinic.asaas_api_key;
      
      if (!asaasApiKey) {
        asaasApiKey = process.env.ASAAS_API_KEY;
      }

      if (typeof asaasApiKey !== 'string' || asaasApiKey.trim() === '') {
        this.logger.error(`[FALHA CRÍTICA] Chave do Asaas não encontrada para a clínica ${clinic.name}`);
        await this.sendMessageToWhatsApp(leadPhone, "Nossa integração financeira está em manutenção temporária. Por favor, aguarde.");
        return; 
      }      // 2.1 - Cria o Cliente no Asaas (Exigência da API deles)
      const customerRes = await firstValueFrom(
        this.httpService.post('https://api.asaas.com/v3/customers', {
          name: bookingData.patient_name || 'Paciente Symetra',
          phone: leadPhone,
        }, { headers: { access_token: asaasApiKey } })
      );

      // 2.2 - Gera a Cobrança Pix
      const chargeRes = await firstValueFrom(
        this.httpService.post('https://api.asaas.com/v3/payments', {
          customer: customerRes.data.id,
          billingType: 'PIX',
          value: clinic.reservation_fee,
          dueDate: new Date().toISOString().split('T')[0], // Vence hoje
          description: `Reserva de Horário - ${clinic.name}`,
        }, { headers: { access_token: asaasApiKey } })
      );

      // 2.3 - Pega o QR Code Copia e Cola
      const qrCodeRes = await firstValueFrom(
        this.httpService.get(`https://api.asaas.com/v3/payments/${chargeRes.data.id}/pixQrCode`, {
          headers: { access_token: asaasApiKey }
        })
      );

      // 3. ATUALIZA O BANCO COM O ID DO ASAAS
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          asaas_payment_id: chargeRes.data.id,
          asaas_qr_code: qrCodeRes.data.payload,
        },
      });

      // 4. ENVIA O TEXTO DE FECHAMENTO (Copy do CMO) + PIX PARA O WHATSAPP
      const msg = `Para formalizarmos sua reserva no dia ${new Date(bookingData.target_date).toLocaleString('pt-BR')}, o sistema requer a validação do aporte de garantia (R$ ${clinic.reservation_fee},00).\n\nAbaixo, envio a chave Pix (Copia e Cola) exclusiva para esta transação.\n\nA vaga permanece reservada em seu nome pelos próximos 15 minutos.`;
      
      await this.sendMessageToWhatsApp(leadPhone, msg);
      await this.sendMessageToWhatsApp(leadPhone, qrCodeRes.data.payload);

      this.logger.log(`[SUCESSO] Agenda travada e Pix enviado para ${leadPhone}`);

    } catch (error) {
      // O Escudo de Double Booking (Erro P2002 do Prisma)
      if (error.code === 'P2002') {
        this.logger.warn(`[RACE CONDITION] Colisão de agenda evitada. O horário já foi pego.`);
        await this.sendMessageToWhatsApp(leadPhone, "Peço perdão, mas este exato horário acabou de ser reservado por outro paciente enquanto conversávamos. Podemos buscar uma nova data?");
        return;
      }

      this.logger.error(`[MOTOR ASAAS] Falha ao gerar Pix: ${error.message}`);
      await this.sendMessageToWhatsApp(leadPhone, "Houve uma instabilidade na geração da sua chave de segurança. Nossa equipe financeira já foi notificada.");
    }
  }

  private async sendMessageToWhatsApp(to: string, text: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) return;

    try {
      await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { preview_url: false, body: text },
          },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
      );
    } catch (error) {
      this.logger.error(`[WHATSAPP] Erro no envio: ${error.message}`);
    }
  }
}