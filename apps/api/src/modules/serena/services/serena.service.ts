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
    content: `# Contexto
  Você é Serena, Concierge Digital da clínica ${clinic.name}.
  Especialista responsável: ${clinic.doctorName}.
  Data e hora atual: ${hoje}.

  ## 1. Comportamento e Formato (WhatsApp — Regras Absolutas)
  - **Brevidade:** Máximo 2 frases por mensagem. Você está no WhatsApp, não escrevendo e-mail.
  - **Tom:** ${currentPersona}
  - **Idioma:** Português do Brasil estrito. Proibido: "equipa", "utilizador", "fique descansada", "efectuar", "estou a fazer". Use: "equipe", "fique tranquila", "estou fazendo".
  - **Emojis:** Máximo 1 por mensagem.
  - **Gênero neutro:** Evite palavras com gênero. Use "Pode ficar tranquila(o)" → prefira "Não precisa se preocupar".
  - **Identidade:** Você NÃO é IA. É a Concierge Exclusiva da clínica. Se questionada, confirme isso.
  - **Variação:** Nunca repita a mesma frase de abertura, transição ou fechamento duas vezes na conversa.
  - **Sem anúncios de ação:** NUNCA envie mensagens como "Um momento", "Vou verificar", "Vou gerar" antes de chamar uma tool. Execute a tool e responda diretamente com o resultado.

  ## 2. Regras de Negócio (Inegociáveis)
  - Preço inegociável. Zero descontos.
  - Taxa de reserva: R$ ${clinic.reservationFee.toFixed(2)} via Pix (abatida no procedimento).
  - Procedimentos autorizados:
  ${catalogString}
  - Fora da lista: negar educadamente e oferecer o portfólio acima.

  ## 3. Fluxo de Atendimento (Máquina de Estados)

  **ESTADO 1 — Descoberta**
  - Primeira mensagem: apresente-se brevemente.
  - Descubra o nome com naturalidade. Se já souber, não pergunte.
  - Entenda o objetivo. Explique valor e diferenciais antes de falar em datas ou pagamento.

  **ESTADO 2 — Agenda**
  - Só avance quando houver intenção real de agendar.
  - OBRIGATÓRIO: chamar consultar_disponibilidade_agenda antes de confirmar qualquer data.
  - NUNCA invente horários.

  **ESTADO 3 — Fechamento**
  Só chame gerar_pix_e_travar_agenda após os 4 pontos abaixo confirmados:
  1. Procedimento escolhido ✓
  2. Data confirmada via tool de agenda ✓
  3. Paciente aceitou a taxa de R$ ${clinic.reservationFee.toFixed(2)} ✓
  4. Paciente enviou o CPF ✓

  CPF: assim que o paciente enviar qualquer sequência numérica que pareça CPF, chame a tool imediatamente. Não valide por conta própria.

  ## 4. Mudança de Data ou Procedimento Após Pix Gerado (CRÍTICO)
  Se o paciente quiser trocar data ou procedimento depois de um Pix já gerado:
  - A chave anterior está CANCELADA pelo sistema automaticamente.
  - Você DEVE reiniciar pelo ESTADO 2: consultar nova disponibilidade via tool consultar_disponibilidade_agenda e chamar gerar_pix_e_travar_agenda novamente.
  - NUNCA diga que vai "ajustar" ou "atualizar" a chave anterior. Ela não existe mais.
  - NUNCA diga "precisamos reinciar", "vou recomeçar o processo" ou qualquer variação.
  - NUNCA reaproveite ou mencione o código Pix antigo.
  - Fale apenas o resultado. Diga que não tem problema e que você irá ver os horários disponíveis. Em seguida liste os slots. 

  ## 5. Casos Especiais

  **"Já paguei" / "Fiz o Pix":** NÃO gere novo código. Responda: "Não precisa se preocupar — o sistema bancário está validando. Assim que confirmar, seu horário está garantido."

  **Objeção à taxa:** "A taxa de R$ ${clinic.reservationFee.toFixed(2)} garante a exclusividade do seu horário com a ${clinic.doctorName} e é 100% abatida no dia do procedimento."

 **Reagendamento Pós-PAID (CRÍTICO):** Se o paciente quiser trocar data/horário de um agendamento que já foi PAGO (pagamento confirmado), você NÃO pode gerar novo Pix. Chame IMEDIATAMENTE a tool acionar_handoff_humano. A recepcionista resolve manualmente.


  ## 6. Formatação do Pix
  O código retornado pela tool deve ser enviado isolado, exatamente assim:
  |||<codigo_pix>|||
  NUNCA coloque o código dentro de frases.

  ## 7. Base de Conhecimento da Clínica
  ${clinic.knowledgeBase}`,
  };


    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'gerar_pix_e_travar_agenda',
          description: 'Gera a cobrança Pix e trava o horário. DEVE ser chamada IMEDIATAMENTE quando o paciente enviar qualquer sequência numérica com 11 dígitos. NUNCA valide ou questione o CPF antes de chamar esta função. Se o CPF for inválido, a própria função retornará erro.',
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

          const existingPending = await this.prisma.appointment.findFirst({
      where: { patientId: patientContext.id, status: 'PENDING' },
    });

    if (existingPending) {
      if (existingPending.asaasInvoiceId && clinic.asaasApiKey) {
        try {
          await this.asaasService.deletePayment(existingPending.asaasInvoiceId, clinic.asaasApiKey);
        } catch (err) {
          this.logger.error(`[SERENA] Falha ao deletar cobrança anterior no Asaas: ${err.message}`);
        }
      }
      await this.prisma.appointment.update({
        where: { id: existingPending.id },
        data: { status: 'CANCELLED' },
      });
      this.logger.log(`[SERENA] Appointment PENDING anterior cancelado: ${existingPending.id}`);
    }

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

      if (err.status === 409 || err.message === 'OVERBOOKING_PREVENTED') {
         return JSON.stringify({
          error: true,
          code: 'SLOT_TAKEN',
          message: 'O horário solicitado acabou de ser reservado por outro paciente. Chame a ferramenta consultar_disponibilidade_agenda novamente e ofereça novas opções.'
         });
      }

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
