import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { Clinic, PersonaType } from '@prisma/client';
import { CalendarService } from '../../calendar/calendar.service';
import { AsaasService } from '../../asaas/asaas.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CryptoService } from '../../../services/crypto.service';

export interface PatientContext {
  id: string;
  phone: string;
  name: string;
}

export interface SerenaAction {
  type: 'reply' | 'generate_pix' | 'handoff_reschedule' | 'check_calendar';
  text?: string;
  bookingData?: {
    patient_name: string;
    procedure: string;
    target_date: string; // ISO 8601
  };
  calendarQuery?: {
    date_from: string; // ISO 8601
    date_to: string;   // ISO 8601
  };
}

@Injectable()
export class SerenaService {
  private readonly logger = new Logger(SerenaService.name);
  private openai: OpenAI;

  constructor(
    private readonly calendarService: CalendarService,
    private readonly asaasService: AsaasService,
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processConversation(
    history: any[],
    clinic: Clinic,
    patientContext?: PatientContext,
  ): Promise<SerenaAction> {
    this.logger.log(`[SERENA] Processando intenção com Function Calling...`);

    const hoje = format(new Date(), 'dd/MM/yyyy HH:mm');

    // 1. MAPEAMENTO DINÂMICO DE PERSONAS
    const personaInstructions = {
      [PersonaType.ARISTOCRATA]: 'Tom: Aristocrático, distante, elegante e inflexível. Use vocabulário refinado. Não use emojis exagerados. Foque em exclusividade.',
      [PersonaType.SOFISTICADA]: 'Tom: Sofisticada, calorosa, mas impecável. Use o primeiro nome, seja ágil e acolhedora. Use emojis elegantes (✨, 💎).',
      [PersonaType.ESPECIALISTA]: 'Tom: Especialista, direta, técnica e autoritária. Foque na segurança, nos produtos originais e na autoridade médica.',
    };

    const currentPersona = personaInstructions[clinic.persona] ?? personaInstructions[PersonaType.SOFISTICADA];

    // 2. FORMATAÇÃO DO CATÁLOGO
    const catalogString =
      typeof clinic.catalog === 'string'
        ? clinic.catalog
        : JSON.stringify(clinic.catalog, null, 2);

    // 3. PROMPT MESTRE
    const systemPrompt: OpenAI.Chat.ChatCompletionSystemMessageParam = {
      role: 'system',
      content: `Você é Serena, da clínica ${clinic.name}.
A especialista responsável é ${clinic.doctorName}.
Data e hora atual do servidor: ${hoje}.
Você é responsável por: realizar o primeiro atendimento; tirar dúvidas sobre os procedimentos, datas e preços; quebrar objeções; e agendar o procedimento mediante a um pix. 

[IDIOMA E LOCALIZAÇÃO — REGRA INEGOCIÁVEL]
Você DEVE comunicar-se estrita e unicamente em Português do Brasil (PT-BR).
NUNCA utilize construções do Português de Portugal (ex: "estou a fazer", "fique descansada", "equipa", "utilizador").
Utilize sempre o gerúndio brasileiro ("estou fazendo", "estou verificando") e vocabulário natural do Brasil ("fique tranquila", "equipe", "você").

[DIRETRIZES DE PERSONA]
${currentPersona}
- NUNCA seja subserviente. Você lidera a negociação.
- NUNCA ofereça descontos ou promoções. O preço é inegociável.
- NUNCA diga que você é uma "IA", "inteligência artificial" ou "assistente virtual". Se questionada, diga que é a Concierge Exclusiva da clínica.
- Use emojis com extrema moderação (máximo 1 emoji a cada 3 mensagens). Nunca termine todas as frases com emojis.
- Aja como uma concierge humana de luxo: natural, fluida, nunca robótica.
- NUNCA repita saudações iniciais ("Olá!", "Bem-vinda!") a meio da conversa. Mantenha o fio condutor.

[FUNIL DE ATENDIMENTO — Sequência Obrigatória]

ETAPA 1 — SAUDAÇÃO E DESCOBERTA DO NOME:
- Se for a primeira mensagem, apresente-se com calor e naturalidade, no tom da sua persona.
- Sempre se apresente e seja cordial.
- Para descobrir o nome, use vocabulário sofisticado e variado. Nunca repita a mesma frase duas vezes.
  Exemplos: "Com quem tenho o prazer de falar?", "Como prefere que eu te chame?", "Me conta, com quem estou falando?"
- PROIBIDO usar frases robóticas e repetitivas como "Como posso te chamar?" em toda abertura.
- Se o paciente já disse o nome em qualquer ponto do histórico, NUNCA pergunte novamente.

ETAPA 2 — EXPLORAÇÃO E GERAÇÃO DE VALOR (Não Pule Esta Etapa):
- Antes de sugerir datas ou falar de pagamento, entenda a necessidade do paciente.
- Perguntas abertas e naturais: varie sempre o vocabulário. Explore a dor, o objetivo, o contexto.
- Explique os diferenciais do procedimento e da clínica. Quebre objeções com empatia e autoridade.
- Gere valor genuíno antes de avançar para o fechamento.

ETAPA 3 — TRANSIÇÃO ORGÂNICA (Somente Após Intenção Real):
- Só consulte a agenda após o paciente demonstrar intenção clara de prosseguir.
- Faça transições fluidas e variadas: nunca use sempre a mesma frase de transição.
- Use a ferramenta 'consultar_disponibilidade_agenda' antes de confirmar qualquer data.

ETAPA 4 — FECHAMENTO (Sequência Rígida):
1. Paciente escolheu o procedimento ✓
2. Paciente confirmou data/hora da agenda ✓
3. Paciente aceitou a taxa de reserva ✓
4. Paciente forneceu o CPF ✓
→ Somente então: chamar 'gerar_pix_e_travar_agenda'.

LINGUAGEM DE FECHAMENTO — OBRIGATÓRIO:
- Para confirmar aceitação da taxa ou do procedimento, use perguntas naturais e variadas.
  Exemplos: "Podemos prosseguir?", "Tudo certo para você?", "Fechamos assim?"
- PROIBIDO usar "Você está de acordo com isso?" — é robótico e quebra a experiência.

[REGRA DE NÃO-REPETIÇÃO — Fluidez Obrigatória]
- Se o paciente já conhece as regras da taxa de reserva e apenas quer mudar de data ou procedimento, NUNCA repita o texto burocrático da taxa.
- Aja de forma fluida: "Vou ajustar a nossa chave Pix para esta nova data. Um momento."
- Não repita informações que o paciente já confirmou ter entendido. Avance.

[LIMBO DO PAGAMENTO — Não Gere Pix Duplicado]
- Se o paciente disser "já paguei", "fiz o pix", "transferi", "já enviei" ou expressão similar, interprete como pagamento em processamento.
- NUNCA gere um novo código Pix neste caso. NUNCA repita instruções de pagamento.
- Responda com acolhimento e transmita segurança: "Recebi a sua confirmação. O sistema bancário está a validar a transação e a confirmação final chegará em breves instantes. Pode ficar descansada."

[REGRA DE FORMATAÇÃO — OBRIGATÓRIA]
Sempre que precisar enviar um código Pix "Copia e Cola", envolva APENAS o código longo com três barras verticais de cada lado, sem espaços junto ao código.
Formato exato: |||<código_pix>|||
Exemplo correto: "Aqui está a sua chave exclusiva: |||00020126580014br.gov.bcb.pix...5678|||. Tem 15 minutos para efectuar o pagamento."
NUNCA coloque o código solto no meio do texto. NUNCA use outro delimitador.

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

[COLETA PROGRESSIVA DE DADOS — Não Interrogue. Colete com Elegância]
NOME:
- Se o nome do paciente for um emoji, apelido inválido ou não estiver disponível, pergunte de forma acolhedora logo na primeira mensagem: "Antes de começarmos, como posso chamá-la(o)?"
- Nunca faça perguntas desnecessárias. Foco total em apresentar o valor do procedimento e fechar o horário.

CPF (SOMENTE NO FECHAMENTO — NUNCA ANTES):
- NUNCA peça o CPF no início da conversa nem durante a apresentação de procedimentos ou negociação de datas.
- APENAS após o paciente ter (1) escolhido o procedimento, (2) concordado com o horário E (3) aceitado pagar a taxa de reserva, solicite o CPF de forma natural. Varie a frase — não use sempre a mesma.
- REGRA CRÍTICA DO CPF: Assim que o paciente enviar qualquer sequência de números que pareça um CPF, chame IMEDIATAMENTE a ferramenta 'gerar_pix_e_travar_agenda'. NUNCA tente validar o formato ou os dígitos por conta própria. NUNCA questione o CPF antes de chamar a ferramenta. Se a ferramenta retornar erro de CPF inválido, aí sim você pede novamente de forma natural.
- PROIBIDO: pedir idade, endereço, data de nascimento ou qualquer dado além do nome e, no fechamento, o CPF.

[REGRA DE CONSULTA DE AGENDA]
Se o paciente perguntar sobre disponibilidade, datas ou horários ANTES de confirmar o pagamento, você DEVE chamar a ferramenta 'consultar_disponibilidade_agenda' primeiro.
NÃO invente ou assuma datas livres. Confirme datas somente após consultar a agenda.
Somente chame 'gerar_pix_e_travar_agenda' após o paciente escolher uma data retornada por 'consultar_disponibilidade_agenda'.

[GATILHO DE FECHAMENTO - FUNCTION CALLING]
Sequência obrigatória antes de chamar 'gerar_pix_e_travar_agenda':
1. Paciente escolheu o procedimento ✓
2. Paciente concordou com data/hora válida (consultada na agenda) ✓
3. Paciente aceitou pagar a taxa de reserva ✓
4. Paciente forneceu o CPF ✓
Somente após cumprir os 4 pontos, chame 'gerar_pix_e_travar_agenda' — NUNCA antes, NUNCA sem o CPF.
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
              patient_cpf: { type: 'string', description: 'CPF do paciente informado por ele, no formato enviado (ex: 123.456.789-00 ou 12345678900)' },
              procedure: { type: 'string', description: 'Nome exato do procedimento escolhido' },
              target_date: { type: 'string', description: 'Data e hora escolhida no formato ISO 8601 (ex: 2024-05-20T14:30:00Z)' },
            },
            required: ['patient_name', 'patient_cpf', 'procedure', 'target_date'],
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
      {
        type: 'function',
        function: {
          name: 'consultar_disponibilidade_agenda',
          description: 'Consulta os horários disponíveis na agenda da clínica. Use ANTES de confirmar qualquer data com o paciente e ANTES de chamar gerar_pix_e_travar_agenda.',
          parameters: {
            type: 'object',
            properties: {
              date_from: { type: 'string', description: 'Data e hora de início do intervalo de busca no formato ISO 8601' },
              date_to: { type: 'string', description: 'Data e hora de fim do intervalo de busca no formato ISO 8601' },
            },
            required: ['date_from', 'date_to'],
          },
        },
      },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...history],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.2,
      });

      const responseMessage = completion.choices[0].message;

      // 4. INTERCEPTADOR DE FERRAMENTAS
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];

        if (toolCall.type === 'function') {
          this.logger.log(`[SERENA] Ação Tática engatilhada: ${toolCall.function.name}`);

          // ── HANDOFF ──────────────────────────────────────────────────────────
          if (toolCall.function.name === 'acionar_handoff_humano') {
            if (patientContext) {
              try {
                // Cast necessário até ao próximo `prisma generate` após db push
                await (this.prisma.patient as any).update({
                  where: { id: patientContext.id },
                  data: { requiresHuman: true, botPaused: true },
                });
                this.logger.log(`[HANDOFF] Patient ${patientContext.id} → botPaused: true, requiresHuman: true`);
              } catch (err) {
                this.logger.error(`[HANDOFF] Falha ao actualizar estado do paciente: ${err.message}`);
              }
            }
            return { type: 'handoff_reschedule' };
          }

          // ── PIX + TRAVA ───────────────────────────────────────────────────────
          if (toolCall.function.name === 'gerar_pix_e_travar_agenda') {
            let pixArgs: { patient_name: string; patient_cpf: string; procedure: string; target_date: string };
            try {
              pixArgs = JSON.parse(toolCall.function.arguments);
            } catch {
              this.logger.error(`[SERENA] JSON inválido nos argumentos do Pix.`);
              return { type: 'reply', text: 'Tivemos um pequeno erro ao formatar sua data. Pode confirmar o dia e horário novamente, por favor?' };
            }

            // Caminho completo: AsaasService gera cobrança e salva no DB
            if (patientContext && clinic.asaasApiKey) {
              const pixToolResult = await this.executePixCharge(pixArgs, clinic, patientContext);

              const finalCompletion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  systemPrompt,
                  ...history,
                  responseMessage,
                  {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: pixToolResult,
                  } as OpenAI.Chat.ChatCompletionToolMessageParam,
                ],
                tools: tools,
                tool_choice: 'none',
                temperature: 0.3,
              });

              return {
                type: 'reply',
                text: finalCompletion.choices[0].message.content ?? 'Sua reserva foi processada com sucesso.',
              };
            }

            // Fallback: sem contexto do paciente ou sem chave Asaas configurada
            this.logger.warn(`[SERENA] Fallback generate_pix — patientContext: ${!!patientContext}, asaasApiKey: ${!!clinic.asaasApiKey}`);
            return {
              type: 'generate_pix',
              bookingData: {
                patient_name: pixArgs.patient_name || 'Paciente',
                procedure: pixArgs.procedure,
                target_date: pixArgs.target_date,
              },
            };
          }

          // ── CONSULTA DE AGENDA ────────────────────────────────────────────────
          if (toolCall.function.name === 'consultar_disponibilidade_agenda') {
            let calArgs: { date_from: string; date_to: string };
            try {
              calArgs = JSON.parse(toolCall.function.arguments);
            } catch {
              this.logger.error(`[SERENA] JSON inválido nos argumentos da agenda.`);
              return { type: 'reply', text: 'Não consegui interpretar o intervalo de datas. Pode informar os dias que prefere?' };
            }

            this.logger.log(`[SERENA] Consultando agenda de ${calArgs.date_from} até ${calArgs.date_to}`);
            const availableSlots = await this.calendarService.getAvailableSlots(calArgs.date_from, calArgs.date_to);

            const calendarToolResult =
              availableSlots.length > 0
                ? `Horários disponíveis: ${availableSlots.join(', ')}`
                : 'Não há horários disponíveis neste período. Sugira outro intervalo ao paciente.';

            this.logger.log(`[SERENA] Resultado da agenda: ${calendarToolResult}`);

            const secondCompletion = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                systemPrompt,
                ...history,
                responseMessage,
                {
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: calendarToolResult,
                } as OpenAI.Chat.ChatCompletionToolMessageParam,
              ],
              tools: tools,
              tool_choice: 'auto',
              temperature: 0.2,
            });

            const secondResponse = secondCompletion.choices[0].message;

            // A IA pode encadear gerar_pix_e_travar_agenda após ver os slots
            if (secondResponse.tool_calls && secondResponse.tool_calls.length > 0) {
              const secondToolCall = secondResponse.tool_calls[0];

              if (secondToolCall.type === 'function' && secondToolCall.function.name === 'gerar_pix_e_travar_agenda') {
                let pixArgs: { patient_name: string; patient_cpf: string; procedure: string; target_date: string };
                try {
                  pixArgs = JSON.parse(secondToolCall.function.arguments);
                } catch {
                  // fall through to text response
                  return { type: 'reply', text: secondResponse.content ?? 'Verifiquei a agenda. Posso ajudar com mais alguma informação?' };
                }

                if (patientContext && clinic.asaasApiKey) {
                  const pixToolResult = await this.executePixCharge(pixArgs, clinic, patientContext);

                  const finalCompletion = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                      systemPrompt,
                      ...history,
                      responseMessage,
                      { role: 'tool', tool_call_id: toolCall.id, content: calendarToolResult } as OpenAI.Chat.ChatCompletionToolMessageParam,
                      secondResponse,
                      { role: 'tool', tool_call_id: secondToolCall.id, content: pixToolResult } as OpenAI.Chat.ChatCompletionToolMessageParam,
                    ],
                    tools: tools,
                    tool_choice: 'none',
                    temperature: 0.3,
                  });

                  return {
                    type: 'reply',
                    text: finalCompletion.choices[0].message.content ?? 'Sua reserva foi processada com sucesso.',
                  };
                }

                // Fallback
                return {
                  type: 'generate_pix',
                  bookingData: {
                    patient_name: pixArgs.patient_name || 'Paciente',
                    procedure: pixArgs.procedure,
                    target_date: pixArgs.target_date,
                  },
                };
              }

              if (secondToolCall.type === 'function' && secondToolCall.function.name === 'acionar_handoff_humano') {
                return { type: 'handoff_reschedule' };
              }
            }

            if (secondResponse.content) {
              return { type: 'reply', text: secondResponse.content };
            }

            return { type: 'reply', text: 'Verifiquei a agenda. Posso ajudar com mais alguma informação?' };
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

  /**
   * Executa a cobrança Pix via AsaasService e retorna a string de resultado
   * a ser enviada de volta à IA como conteúdo da tool call.
   */
  private async executePixCharge(
    args: { patient_name: string; patient_cpf: string; procedure: string; target_date: string },
    clinic: Clinic,
    patientContext: PatientContext,
  ): Promise<string> {
    try {
      const pixResult = await this.asaasService.createPixCharge({
        clinicId: clinic.id,
        patientId: patientContext.id,
        patientName: args.patient_name || patientContext.name,
        patientCpf: args.patient_cpf,
        patientPhone: patientContext.phone,
        procedure: args.procedure,
        scheduledAt: new Date(args.target_date),
        asaasApiKey: clinic.asaasApiKey!,
        reservationFee: clinic.reservationFee,
      });

      this.logger.log(`[SERENA] Pix gerado — Invoice: ${pixResult.asaasInvoiceId}, Appointment: ${pixResult.appointmentId}`);

      // Persiste o CPF criptografado no registro do paciente (LGPD)
      if (args.patient_cpf) {
        await this.prisma.patient.update({
          where: { id: patientContext.id },
          data: { cpfEncrypted: this.cryptoService.encrypt(args.patient_cpf) },
        }).catch((err) => this.logger.error(`[SERENA] Falha ao salvar CPF criptografado: ${err.message}`));
      }

      return (
        `Pix gerado com sucesso.\n` +
        `Código Copia e Cola: ${pixResult.pixCode}\n` +
        `ID do Agendamento: ${pixResult.appointmentId}\n` +
        `A reserva expira em 15 minutos. Instrua o paciente a pagar imediatamente.`
      );
    } catch (err) {
      this.logger.error(`[SERENA] AsaasService falhou: ${err.message}`);

      // Erros de validação de CPF/CNPJ: repassa para a IA pedir nova tentativa
      const isCpfError =
        /cpf|cnpj|inválido|invalid|400/i.test(err.message) ||
        err.response?.status === 400 ||
        err.response?.status === 401;

      if (isCpfError) {
        return JSON.stringify({
          error: true,
          code: 'INVALID_CPF',
          message:
            'O CPF informado foi recusado pelo sistema bancário. Informe o paciente de forma natural e peça que ele digite o CPF correto novamente. Não mencione erro técnico.',
        });
      }

      return JSON.stringify({
        error: true,
        code: 'PIX_GENERATION_FAILED',
        message:
          `Não foi possível gerar o Pix neste momento (${err.message}). ` +
          `Avise o paciente com educação que houve uma instabilidade técnica e que a equipe já foi notificada. Não invente um código Pix.`,
      });
    }
  }
}
