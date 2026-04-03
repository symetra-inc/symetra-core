import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenAIService } from '../openai/openai.service';

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

const SYSTEM_PROMPT = `Você é um assistente de triagem. Dado o histórico de conversa entre uma IA de atendimento e um paciente, produza um resumo conciso (3 a 5 linhas) para a secretária humana que vai assumir o atendimento.

O resumo deve cobrir obrigatoriamente:
1. Motivo do contato (o que o paciente quer)
2. Procedimento de interesse (se mencionado)
3. Status do pagamento (Pix gerado? Confirmado? Pendente? Não iniciado?)
4. Tom do paciente (tranquilo, ansioso, impaciente, confuso, etc.)

Seja direto. Sem introduções, sem rodapés. Escreva como se estivesse passando um briefing rápido para um colega.`;

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(private readonly openai: OpenAIService) {}

  async generateHandoffSummary(messages: Message[]): Promise<string> {
    const userMessages = messages.filter((m) => m.role !== 'system');

    if (userMessages.length === 0) {
      return 'Sem histórico de conversa disponível para resumo.';
    }

    try {
      const completion = await this.openai.client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...userMessages,
        ],
      });

      return completion.choices[0].message.content?.trim() ?? 'Resumo indisponível.';
    } catch (error) {
      this.logger.error(`[SummaryService] Falha ao gerar resumo de handoff: ${error.message}`);
      throw error;
    }
  }
}
