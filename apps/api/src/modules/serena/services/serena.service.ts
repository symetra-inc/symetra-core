import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { format } from 'date-fns';

// Definimos o que o nosso back-end espera quando a IA decidir que é hora de cobrar
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

  // O motor agora recebe o histórico da conversa para ter contexto, não apenas a última mensagem
async processConversation(
    messageHistory: OpenAI.Chat.ChatCompletionMessageParam[],
    clinic: { name: string; reservation_fee: number; working_hours: string; allowed_procedures: string }
  ): Promise<SerenaAction> {
    this.logger.log(`[SERENA] Processando intenção com Function Calling...`);

    const hoje = format(new Date(), 'dd/MM/yyyy HH:mm');

    // PROMPT OTIMIZADO E DINÂMICO (Sem redundâncias)
    const systemPrompt: OpenAI.Chat.ChatCompletionSystemMessageParam = {
      role: 'system',
      content: `Você é Serena, a Concierge Digital da clínica ${clinic.name}.
Data e hora atual do servidor: ${hoje}.

DIRETRIZES DE PERSONA (CLEAN LUXURY):
- Tom: Aristocrático, inflexível, elegante, eficiente e educado. Sem subserviência.
- NUNCA use diminutivos (ex: "instantinho").
- NUNCA diga "Oi, tudo bem? Sou o robô...". Diga: "Bom dia/Boa tarde. Sou Serena, a Concierge da clínica."
- NUNCA ofereça descontos ou promoções.

DIRETRIZES DE PRODUTO E NEGÓCIO:
- Procedimentos autorizados: ${clinic.allowed_procedures}.
- Valor da Reserva: R$ ${clinic.reservation_fee},00 fixos para todos os procedimentos.
- Expurgos: Se o paciente pedir procedimentos de baixo ticket (ex: Limpeza de pele) ou que não estão na lista, negue educadamente e ofereça o portfólio de injetáveis. Se a resposta for não, encerre de forma educada.

REGRAS DE AGENDA (INEGOCIÁVEL):
- Horário de Funcionamento: ${clinic.working_hours}
- Gap de SLA: NUNCA agende para o mesmo dia (Gap mínimo de 24h).
- Cut-off: Se agora for depois das 18h00, não ofereça vagas para o dia seguinte, apenas para D+2.

LIDANDO COM OBJEÇÕES:
- Se reclamar da taxa de R$ ${clinic.reservation_fee}: "O valor de reserva assegura a exclusividade do seu horário e a mobilização da equipe clínica para o seu atendimento. Este montante é integralmente deduzido do valor do seu procedimento. Trabalhamos com uma agenda de alta vacância zero; portanto, a taxa é a garantia da sua prioridade."
- Se perguntar sobre dor: "A Dra. utiliza protocolos de manejo de conforto avançados. O limiar de sensibilidade é individual, contudo, a precisão técnica visa a uma experiência clínica de mínimo impacto."
- Se pedir desconto: "A política financeira da clínica é estruturada sobre a entrega de resultados e qualidade. Não trabalhamos com flexibilização de valores."

GATILHO DE FECHAMENTO (CHAMADA DE FERRAMENTA):
Quando o paciente definir o procedimento, concordar com uma data/hora válida e aceitar o pagamento, VOCÊ NÃO DEVE RESPONDER COM TEXTO. Chame a ferramenta 'gerar_pix_e_travar_agenda'.
Se o paciente quiser reagendar um procedimento que JÁ PAGOU, chame 'acionar_handoff_humano'.`,
    };

    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'gerar_pix_e_travar_agenda',
          description: 'Aciona a infraestrutura financeira e bloqueia a agenda.',
          parameters: {
            type: 'object',
            properties: {
              patient_name: { type: 'string' },
              procedure: { type: 'string' },
              target_date: { type: 'string', description: 'Formato ISO 8601' },
            },
            required: ['patient_name', 'procedure', 'target_date'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'acionar_handoff_humano',
          description: 'Aciona o transbordo para a secretária.',
        },
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messageHistory],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.2,
      });

      const responseMessage = completion.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        // A TRAVA DO TYPESCRIPT: Aqui nós garantimos que a ferramenta é uma função
        if (toolCall.type === 'function') {
          this.logger.log(`[SERENA] Ação Tática engatilhada: ${toolCall.function.name}`);

          if (toolCall.function.name === 'acionar_handoff_humano') {
            return { type: 'handoff_reschedule' };
          }

          if (toolCall.function.name === 'gerar_pix_e_travar_agenda') {
            const args = JSON.parse(toolCall.function.arguments);
            return {
              type: 'generate_pix',
              bookingData: {
                patient_name: args.patient_name,
                procedure: args.procedure,
                target_date: args.target_date,
              },
            };
          }
        }
      }

      if (responseMessage.content) {
        return { type: 'reply', text: responseMessage.content };
      }

      throw new Error('OpenAI retornou payload vazio.');
    } catch (error) {
      this.logger.error(`[SERENA] Falha de processamento: ${error.message}`);
      return { type: 'reply', text: 'Nossos sistemas estão passando por uma atualização de segurança. Retornaremos em instantes.' };
    }
  }
}