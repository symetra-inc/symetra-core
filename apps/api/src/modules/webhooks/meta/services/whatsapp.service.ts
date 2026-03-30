import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  /** Envia uma mensagem de texto para um número via WhatsApp Cloud API (multi-tenant). */
  async sendMessage(clinicPhoneId: string, to: string, text: string): Promise<void> {
    const token = process.env.META_WA_TOKEN;
    if (!token || !clinicPhoneId) return;
    try {
      await axios.post(
        `${GRAPH_URL}/${clinicPhoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      this.logger.error(
        `[WHATSAPP] Erro no envio para ${to}: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /** Marca a mensagem recebida como lida (double-tick azul) — simula presença. */
  async markAsRead(clinicPhoneId: string, messageId: string): Promise<void> {
    const token = process.env.META_WA_TOKEN;
    if (!token || !clinicPhoneId || !messageId) return;
    try {
      await axios.post(
        `${GRAPH_URL}/${clinicPhoneId}/messages`,
        { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
    } catch {
      // Não-crítico — ignora falha no read receipt
    }
  }
}