import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly apiUrl = `https://graph.facebook.com/v21.0/${process.env.META_PHONE_ID}/messages`;
  private readonly token = process.env.META_WA_TOKEN;

  async sendMessage(to: string, text: string) {
    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`📤 Mensagem enviada para ${to}`);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
    }
  }
}