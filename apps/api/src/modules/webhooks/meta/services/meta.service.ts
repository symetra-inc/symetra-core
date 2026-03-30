import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { SerenaService, SerenaAction } from '../../../serena/services/serena.service';
import { RedisService } from '../../../redis/redis.service';
import { WhatsAppService } from './whatsapp.service';

interface IncomingContext {
  messageId: string;
  patientPhone: string;
  patientName: string;
  clinicPhoneId: string;
  bsuid?: string;
}

@Injectable()
export class MetaWebhookService {
  private readonly logger = new Logger(MetaWebhookService.name);

  // Trava de deduplicação (evita duplicatas da rede do Meta)
  private readonly processedMessages = new Set<string>();

  // Buffer de debounce: agrupa mensagens enviadas em rajada pelo mesmo paciente
  private readonly debounceBuffer = new Map<string, {
    timer: ReturnType<typeof setTimeout>;
    chunks: string[];
    ctx: IncomingContext;
  }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly serenaService: SerenaService,
    private readonly redisService: RedisService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // ENTRADA: chamado diretamente pelo controller para cada evento do Meta
  // ─────────────────────────────────────────────────────────────────────────────
  async processIncomingMessage(payload: any): Promise<void> {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const metadata = changes?.metadata;

      // Aceita texto e áudio; ignora status, reações, stickers, etc.
      if (!message) return;
      if (message.type !== 'text' && message.type !== 'audio') return;

      const messageId = message.id;
      const patientPhone: string = message.from;
      const patientName: string = changes.contacts?.[0]?.profile?.name || 'Paciente';
      const clinicPhoneId: string = metadata?.phone_number_id;
      const bsuid: string | undefined = changes.contacts?.[0]?.user_id ?? message.from_bsuid ?? undefined;

      // Conteúdo que vai para a IA (áudio recebe instrução especial)
      const patientText: string = message.type === 'audio'
        ? '[SISTEMA: O utilizador enviou uma mensagem de áudio, mas o sistema não suporta voz. Usando o tom exato da sua PERSONA, dê uma desculpa elegante para não poder ouvir agora e peça gentilmente para ele digitar.]'
        : (message.text?.body ?? '');

      // Guarda defensiva: mensagem chegou apenas com BSUID, sem número de telefone
      if (!patientPhone) {
        this.logger.warn(
          `[META-BSUID] Mensagem recebida apenas com BSUID (${bsuid ?? 'desconhecido'}). Adaptação pendente para Maio/2026.`,
        );
        return;
      }

      if (!messageId || !patientText || !clinicPhoneId) {
        this.logger.warn(`[META] Payload malformado ignorado.`);
        return;
      }

      // 1. Trava de deduplicação
      if (this.processedMessages.has(messageId)) return;
      this.processedMessages.add(messageId);
      if (this.processedMessages.size > 1000) this.processedMessages.clear();

      this.logger.log(`[WHATSAPP] Mensagem recebida de ${patientPhone} (type: ${message.type})`);

      // 2. Read-receipt imediato — double-tick azul para o paciente
      void this.whatsAppService.markAsRead(clinicPhoneId, messageId);

      // 3. Debounce: agrupa mensagens em rajada (janela de 7 segundos)
      const ctx: IncomingContext = { messageId, patientPhone, patientName, clinicPhoneId, bsuid };
      const existing = this.debounceBuffer.get(patientPhone);

      if (existing) {
        clearTimeout(existing.timer);
        existing.chunks.push(patientText);
      } else {
        this.debounceBuffer.set(patientPhone, {
          chunks: [patientText],
          ctx,
          timer: null as unknown as ReturnType<typeof setTimeout>,
        });
      }

      const buf = this.debounceBuffer.get(patientPhone)!;
      buf.timer = setTimeout(() => {
        this.debounceBuffer.delete(patientPhone);
        const combinedText = buf.chunks.join('\n');
        void this.handleMessage(combinedText, buf.ctx);
      }, 7_000);

    } catch (error) {
      this.logger.error(`[META] Falha no recebimento do payload: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROCESSAMENTO: executado após o debounce com o texto combinado
  // ─────────────────────────────────────────────────────────────────────────────
  private async handleMessage(patientText: string, ctx: IncomingContext): Promise<void> {
    const { patientPhone, patientName, clinicPhoneId, bsuid } = ctx;

    try {
      // 1. Injeção de Contexto (Busca a Clínica - Multi-Tenant)
      const clinic = await this.prisma.clinic.findUnique({
        where: { whatsappNumberId: clinicPhoneId },
      });

      if (!clinic) {
        this.logger.warn(`[ROTEAMENTO] Clínica não encontrada para o Phone ID: ${clinicPhoneId}. Ignorando.`);
        return;
      }

      this.logger.log(`[ROTEAMENTO] Clínica: ${clinic.name} | asaasApiKey presente: ${!!clinic.asaasApiKey}`);

      // 2. Gestão do Paciente (Upsert)
      const patient = await this.prisma.patient.upsert({
        where: { clinicId_whatsappPhone: { clinicId: clinic.id, whatsappPhone: patientPhone } },
        update: { name: patientName, ...(bsuid && { bsuid }) },
        create: { clinicId: clinic.id, whatsappPhone: patientPhone, name: patientName, ...(bsuid && { bsuid }) },
      });

      // 3. Escudo de Handoff: IA fica muda enquanto um humano estiver atendendo
      if ((patient as any).botPaused) {
        this.logger.warn(`[BOT-PAUSED] Paciente ${patientPhone} com bot pausado. Mensagem ignorada pela IA.`);
        return;
      }

      // 4. Grava a mensagem do usuário no histórico persistente
      const messageContent = patientText.startsWith('[SISTEMA:') ? '[Mensagem de áudio]' : patientText;
      await (this.prisma as any).message.create({
        data: { patientId: patient.id, role: 'USER', content: messageContent },
      }).catch((err: any) => this.logger.error(`[DB] Falha ao gravar mensagem USER: ${err.message}`));

      // 5. Gestão de Memória da Conversa (Janela deslizante de 20 mensagens — Redis)
      let history = await this.redisService.getConversationHistory(patientPhone);
      history.push({ role: 'user', content: patientText });
      if (history.length > 20) history = history.slice(-20);

      // 6. Aciona o Cérebro (Serena IA)
      const action: SerenaAction = await this.serenaService.processConversation(history, clinic, {
        id: patient.id,
        phone: patientPhone,
        name: patientName,
      });

      // 7. Roteia a ação e atualiza memória
      if (action.type === 'reply' && action.text) {
        await this.sendSplitMessage(clinic.whatsappNumberId, patientPhone, action.text);

        await (this.prisma as any).message.create({
          data: { patientId: patient.id, role: 'AI', content: action.text },
        }).catch((err: any) => this.logger.error(`[DB] Falha ao gravar mensagem AI: ${err.message}`));

        history.push({ role: 'assistant', content: action.text });
        await this.redisService.saveConversationHistory(patientPhone, history);
        return;
      }

      await this.redisService.saveConversationHistory(patientPhone, history);
      await this.executeAction(action, patient.id, patientPhone, clinic);

    } catch (error) {
      this.logger.error(`[META] Falha crítica no orquestrador: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AÇÕES ESPECIAIS
  // ─────────────────────────────────────────────────────────────────────────────
  private async executeAction(action: SerenaAction, patientId: string, patientPhone: string, clinic: any) {
    if (action.type === 'reply') return;

    if (action.type === 'handoff_reschedule') {
      const handoffMsg = 'Entendido. Como este procedimento possui uma garantia financeira atrelada, estou transferindo seu atendimento para a nossa Concierge Humana finalizar o ajuste na agenda.';
      await this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, handoffMsg);
      this.logger.warn(`[HANDOFF] Alerta acionado para a clínica ${clinic.name}. Paciente: ${patientPhone}`);
      return;
    }

    if (action.type === 'generate_pix' && action.bookingData) {
      await this.handlePixGeneration(action.bookingData, patientId, patientPhone, clinic);
    }
  }

  private async handlePixGeneration(bookingData: any, patientId: string, patientPhone: string, clinic: any) {
    try {
      this.logger.log(`[MOTOR] Iniciando trava de agenda e geração de Pix para ${patientPhone}`);

      const lockedUntilDate = new Date(Date.now() + 15 * 60 * 1000);

      const appointment = await this.prisma.appointment.create({
        data: {
          procedureName: bookingData.procedure,
          scheduledAt: new Date(bookingData.target_date),
          lockedUntil: lockedUntilDate,
          clinicId: clinic.id,
          patientId: patientId,
          status: 'PENDING',
        },
      });

      const asaasApiKey = clinic.asaasApiKey;
      if (!asaasApiKey) {
        this.logger.error(`[FALHA CRÍTICA] Clínica ${clinic.name} sem Asaas configurado.`);
        await this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, 'Nossa integração financeira está em manutenção temporária. Estou transferindo para a secretária.');
        return;
      }

      const customerRes = await firstValueFrom(
        this.httpService.post('https://api.asaas.com/v3/customers', {
          name: bookingData.patient_name || 'Paciente Symetra',
          phone: patientPhone,
        }, { headers: { access_token: asaasApiKey } })
      );

      const chargeRes = await firstValueFrom(
        this.httpService.post('https://api.asaas.com/v3/payments', {
          customer: customerRes.data.id,
          billingType: 'PIX',
          value: clinic.reservationFee,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Reserva de Horário - ${clinic.name}`,
        }, { headers: { access_token: asaasApiKey } })
      );

      const qrCodeRes = await firstValueFrom(
        this.httpService.get(`https://api.asaas.com/v3/payments/${chargeRes.data.id}/pixQrCode`, {
          headers: { access_token: asaasApiKey }
        })
      );

      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { asaasInvoiceId: chargeRes.data.id },
      });

      const msg = `Para formalizarmos sua reserva no dia ${new Date(bookingData.target_date).toLocaleString('pt-BR')}, o sistema requer a validação do aporte de garantia (R$ ${clinic.reservationFee},00).\n\nAbaixo envio a chave Pix (Copia e Cola) exclusiva para esta transação.\n\nA vaga permanece reservada em seu nome pelos próximos 15 minutos.`;

      await Promise.all([
        this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, msg),
        this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, qrCodeRes.data.payload),
      ]);

      this.logger.log(`[SUCESSO] Agenda travada e Pix enviado para ${patientPhone}`);

    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.warn(`[RACE CONDITION] Colisão de agenda evitada.`);
        await this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, 'Peço perdão, mas este exato horário acabou de ser reservado por outro paciente. Podemos buscar uma nova data?');
        return;
      }
      this.logger.error(`[MOTOR ASAAS] Falha ao gerar Pix: ${error.message}`);
      await this.whatsAppService.sendMessage(clinic.whatsappNumberId, patientPhone, 'Houve uma instabilidade na geração da sua chave. Nossa equipe financeira já foi notificada.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITÁRIOS DE ENVIO
  // ─────────────────────────────────────────────────────────────────────────────

  // Divisor de mensagem — separa o código Pix do texto corrido
  private async sendSplitMessage(clinicPhoneId: string, toPhone: string, text: string): Promise<void> {
    if (!text.includes('|||')) {
      await this.whatsAppService.sendMessage(clinicPhoneId, toPhone, text);
      return;
    }

    // Filtra partes vazias ou que contenham apenas pontuação (ex: "." ou ",")
    const parts = text.split('|||').map(m => m.trim()).filter(m => m.length > 1 && /[a-zA-Z0-9\u00C0-\u00FF]/.test(m));
    for (const part of parts) {
      await this.whatsAppService.sendMessage(clinicPhoneId, toPhone, part);
      await this.delay(500);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
