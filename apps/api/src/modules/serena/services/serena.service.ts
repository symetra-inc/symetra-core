import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { Clinic, PersonaType } from '@prisma/client';

export interface SerenaAction {
  type: 'reply' | 'generate_pix' | 'handoff_reschedule';
  text?: string;
  bookingData?: {
    patient_name: string;
    procedure: string;
    target_date: string; // ISO 8601
  };
}

@Injectable()
export class SerenaService {
  private readonly logger = new Logger(SerenaService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processConversation(history: any[], clinic: Clinic): Promise<SerenaAction> {
    this.logger.log(`[SERENA] Processando intenção com Function Calling...`);

    const hoje = format(new Date(), 'dd/MM/yyyy HH:mm');

    // 1. MAPEAMENTO DINÂMICO DE PERSONAS (O Cérebro Adaptável)
    const personaInstructions = {
      [PersonaType.ARISTOCRATA]: "Tom: Aristocrático, distante, elegante e inflexível. Use vocabulário refinado. Não use emojis exagerados. Foque em exclusividade.",
      [PersonaType.SOFISTICADA]: "Tom: Sofisticada, calorosa, mas impecável. Use o primeiro nome, seja ágil e acolhedora. Use emojis elegantes (✨, 💎).",
      [PersonaType.ESPECIALISTA]: "Tom: Especialista, direta, técnica e autoritária. Foque na segurança, nos produtos originais e na autoridade médica."
    };

    const currentPersona = personaInstructions[clinic.persona] || personaInstructions[PersonaType.SOFISTICADA];

    // 2. FORMATAÇÃO DO CATÁLOGO (Transforma o JSON do banco em texto legível para a IA)
    const catalogString = typeof clinic.catalog === 'string' 
      ? clinic.catalog 
      : JSON.stringify(clinic.catalog, null, 2);

    // 3. O PROMPT MESTRE (A Constituição da Serena)
    const systemPrompt: OpenAI.Chat.ChatCompletionSystemMessageParam = {
      role: 'system',
      content: `Você é Serena, a Concierge Digital da clínica ${clinic.name}.
A especialista responsável é ${clinic.doctorName}.
Data e hora atual do servidor: ${hoje}.

[DIRETRIZES DE PERSONA]
${currentPersona}
- NUNCA seja subserviente. Você lidera a negociação.
- NUNCA ofereça descontos ou promoções. O preço é inegociável.
- NUNCA diga que você é uma "IA", "inteligência artificial" ou "assistente virtual". Se questionada, diga que é a Concierge Exclusiva da clínica.
- Use emojis com extrema moderação (máximo 1 a cada duas mensagens). Não seja eufórica.

[CATÁLOGO DE PROCEDIMENTOS]
Você SÓ PODE oferecer e agendar os procedimentos listados abaixo:
${catalogString}
Regra de Expurgo: Se o paciente pedir procedimentos que não estão na lista, negue educadamente e ofereça o portfólio acima. Se a resposta for não, encerre de forma educada.

[BASE DE CONHECIMENTO E REGRAS DA CLÍNICA]
Use estas informações para quebrar objeções e consultar horários de funcionamento:
${clinic.knowledgeBase}
Taxa de Reserva Obrigatória: R$ ${clinic.reservationFee.toFixed(2)} (abatida no dia do procedimento).

[LIDANDO COM OBJEÇÕES DE SINAL]
Se reclamar da taxa de R$ ${clinic.reservationFee.toFixed(2)}: "O valor de reserva assegura a exclusividade do seu horário na agenda da ${clinic.doctorName}. Este montante é 100% deduzido do valor do seu procedimento. Como operamos com alta demanda, a taxa é a garantia da sua prioridade."

[GATILHO DE FECHAMENTO - FUNCTION CALLING]
Quando o paciente definir o procedimento, concordar com uma data/hora válida e aceitar o pagamento da taxa, VOCÊ NÃO DEVE RESPONDER COM TEXTO. 
Chame imediatamente a ferramenta 'gerar_pix_e_travar_agenda'.
Se o paciente quiser reagendar um procedimento que JÁ PAGOU ou relatar erro no banco, chame 'acionar_handoff_humano'.`,
    };

    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'gerar_pix_e_travar_agenda',
          description: 'Aciona a infraestrutura financeira e bloqueia a agenda. Use APENAS quando o paciente concordar com o pagamento.',
          parameters: {
            type: 'object',
            properties: {
              patient_name: { type: 'string', description: 'Nome do paciente deduzido da conversa' },
              procedure: { type: 'string', description: 'Nome exato do procedimento escolhido' },
              target_date: { type: 'string', description: 'Data e hora escolhida no formato ISO 8601 (ex: 2024-05-20T14:30:00Z)' },
            },
            required: ['patient_name', 'procedure', 'target_date'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'acionar_handoff_humano',
          description: 'Aciona o transbordo para a secretária humana em caso de erro técnico ou paciente que já pagou.',
        },
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...history], // Corrigido de 'messageHistory' para 'history'
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.2, // Baixa temperatura para evitar alucinações de preço e datas
      });

      const responseMessage = completion.choices[0].message;

      // 4. INTERCEPTADOR DE FERRAMENTAS (A IA decidiu agir)
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        if (toolCall.type === 'function') {
          this.logger.log(`[SERENA] Ação Tática engatilhada: ${toolCall.function.name}`);

          if (toolCall.function.name === 'acionar_handoff_humano') {
            return { type: 'handoff_reschedule' };
          }

          if (toolCall.function.name === 'gerar_pix_e_travar_agenda') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              return {
                type: 'generate_pix',
                bookingData: {
                  patient_name: args.patient_name || 'Paciente',
                  procedure: args.procedure,
                  target_date: args.target_date,
                },
              };
            } catch (parseError) {
              this.logger.error(`[SERENA] A IA gerou argumentos JSON inválidos para o Pix.`);
              return { type: 'reply', text: 'Tivemos um pequeno erro ao formatar sua data. Pode confirmar o dia e horário novamente, por favor?' };
            }
          }
        }
      }

      // 5. RESPOSTA NORMAL DE TEXTO
      if (responseMessage.content) {
        return { type: 'reply', text: responseMessage.content };
      }

      throw new Error('OpenAI retornou payload vazio e sem ferramentas.');
    } catch (error) {
      this.logger.error(`[SERENA] Falha de processamento na OpenAI: ${error.message}`);
      return { type: 'reply', text: 'Nossos sistemas estão processando sua solicitação. Retornaremos em instantes.' };
    }
  }
}