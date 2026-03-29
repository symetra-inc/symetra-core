import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../../infrastructure/database/prisma.service'; // Ajuste o caminho
import { SerenaService, SerenaAction } from '../../../serena/services/serena.service'; // Ajuste o caminho

@Injectable()
export class MetaWebhookService {
  private readonly logger = new Logger(MetaWebhookService.name);
  
  // Memória de Curto Prazo (Evita duplicatas da rede do Meta)
  private processedMessages = new Set<string>();
  
  // Memória de Contexto da IA (RAM) - Fase 1
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

      // Ignora status de leitura, digitação, etc.
      if (!message || message.type !== 'text') return;

      const messageId = message.id;
      const patientPhone = message.from;
      const patientName = changes.contacts?.[0]?.profile?.name || 'Paciente';
      const patientText = message.text.body;
      const clinicPhoneId = metadata?.phone_number_id;

      if (!messageId || !patientPhone || !patientText || !clinicPhoneId) {
        this.logger.warn(`[META] Payload malformado ignorado.`);
        return;
      }

      // 1. Trava de Deduplicação
      if (this.processedMessages.has(messageId)) return;
      this.processedMessages.add(messageId);
      if (this.processedMessages.size > 1000) this.processedMessages.clear();

      this.logger.log(`[WHATSAPP] Mensagem recebida de ${patientPhone}: "${patientText}"`);

      // 2. Injeção de Contexto (Busca a Clínica - Multi-Tenant)
      const clinic = await this.prisma.clinic.findUnique({
        where: { whatsappNumberId: clinicPhoneId },
      });

      if (!clinic) {
        this.logger.warn(`[ROTEAMENTO] Clínica não encontrada para o Phone ID: ${clinicPhoneId}. Ignorando.`);
        return;
      }

      // 3. Gestão do Paciente (Upsert)
      const patient = await this.prisma.patient.upsert({
        where: {
          clinicId_whatsappPhone: {
            clinicId: clinic.id,
            whatsappPhone: patientPhone,
          }
        },
        update: { name: patientName },
        create: {
          clinicId: clinic.id,
          whatsappPhone: patientPhone,
          name: patientName,
        }
      });

      // 4. Gestão de Memória da Conversa (Janela deslizante de 20 mensagens)
      let history = this.conversationHistory.get(patientPhone) || [];
      history.push({ role: 'user', content: patientText });
      if (history.length > 20) history = history.slice(-20); 

      // 5. Aciona o Cérebro (Serena IA)
      const action: SerenaAction = await this.serenaService.processConversation(history, clinic);

      // 6. Atualiza memória e roteia a ação
      if (action.type === 'reply' && action.text) {
        await this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, action.text);
        
        history.push({ role: 'assistant', content: action.text });
        this.conversationHistory.set(patientPhone, history);
        return;
      }
      
      this.conversationHistory.set(patientPhone, history);
      await this.executeAction(action, patient.id, patientPhone, clinic);

    } catch (error) {
      this.logger.error(`[META] Falha crítica no orquestrador: ${error.message}`);
    }
  }

  private async executeAction(action: SerenaAction, patientId: string, patientPhone: string, clinic: any) {
    if (action.type === 'reply') return; 

    if (action.type === 'handoff_reschedule') {
      const handoffMsg = "Entendido. Como este procedimento possui uma garantia financeira atrelada, estou transferindo seu atendimento para a nossa Concierge Humana finalizar o ajuste na agenda.";
      await this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, handoffMsg);
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

      // 1. Trava Atômica (Bloqueio de 15 minutos)
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

      // 2. Validação Asaas (Segurança Absoluta: Sem Fallback)
      const asaasApiKey = clinic.asaasApiKey;
      if (!asaasApiKey) {
        this.logger.error(`[FALHA CRÍTICA] Clínica ${clinic.name} sem Asaas configurado.`);
        await this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, "Nossa integração financeira está em manutenção temporária. Estou a transferir para a secretária.");
        return; 
      }

      // 3. Geração no Asaas
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

      // 4. Atualiza o banco com Invoice ID
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { asaasInvoiceId: chargeRes.data.id },
      });

      // 5. Disparo Duplo via Promise.all para maior velocidade
      const msg = `Para formalizarmos sua reserva no dia ${new Date(bookingData.target_date).toLocaleString('pt-BR')}, o sistema requer a validação do aporte de garantia (R$ ${clinic.reservationFee},00).\n\nAbaixo, envio a chave Pix (Copia e Cola) exclusiva para esta transação.\n\nA vaga permanece reservada em seu nome pelos próximos 15 minutos.`;
      
      await Promise.all([
        this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, msg),
        this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, qrCodeRes.data.payload)
      ]);

      this.logger.log(`[SUCESSO] Agenda travada e Pix enviado para ${patientPhone}`);

    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.warn(`[RACE CONDITION] Colisão de agenda evitada.`);
        await this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, "Peço perdão, mas este exato horário acabou de ser reservado por outro paciente. Podemos buscar uma nova data?");
        return;
      }
      this.logger.error(`[MOTOR ASAAS] Falha ao gerar Pix: ${error.message}`);
      await this.sendMessageToWhatsApp(clinic.whatsappNumberId, patientPhone, "Houve uma instabilidade na geração da sua chave. Nossa equipa financeira já foi notificada.");
    }
  }

  // 6. Gatilho de Envio Seguro (Multi-Tenant)
  private async sendMessageToWhatsApp(clinicPhoneId: string, toPhone: string, text: string) {
    const token = process.env.META_WA_TOKEN;
    
    if (!token || !clinicPhoneId) return;

    try {
      await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v19.0/${clinicPhoneId}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toPhone,
            type: 'text',
            text: { preview_url: false, body: text },
          },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
      );
    } catch (error) {
      this.logger.error(`[WHATSAPP] Erro no envio para ${toPhone}: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}