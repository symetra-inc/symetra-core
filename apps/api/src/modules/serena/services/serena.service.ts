import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { Clinic, ClinicTier, PersonaType } from '@prisma/client';
import { CalendarService } from '../../calendar/calendar.service';
import { AsaasService } from '../../asaas/asaas.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CryptoService } from '../../../infrastructure/crypto/crypto.service';
import { normalizeCpf } from '../../../common/utils/cpf.util';

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

// ── Helpers de formatação ──────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

function formatKnowledgeBaseForPrompt(raw: string): string {
  try {
    const kb = JSON.parse(raw);
    if (typeof kb === 'object' && kb !== null) {
      const lines: string[] = [];
      if (kb.endereco) lines.push(`- Endereço: ${kb.endereco}`);
      if (kb.horarioFuncionamento) lines.push(`- Horário de funcionamento: ${kb.horarioFuncionamento}`);
      if (kb.bioMedico) lines.push(`- Médico responsável: ${kb.bioMedico}`);
      if (kb.diferenciaisClinica) lines.push(`- Diferenciais da clínica: ${kb.diferenciaisClinica}`);
      if (kb.diferenciaisProcedimentos) lines.push(`- Características dos procedimentos: ${kb.diferenciaisProcedimentos}`);
      if (kb.informacoesAdicionais) lines.push(`- Informações adicionais: ${kb.informacoesAdicionais}`);
      return lines.length > 0 ? lines.join('\n') : raw;
    }
  } catch {
    // fallback to raw string
  }
  return raw;
}

function formatCatalogForPrompt(catalog: unknown): string {
  try {
    const items: any[] = Array.isArray(catalog)
      ? catalog
      : JSON.parse(catalog as string);

    const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return items
      .map((item: any) => {
        const precoFormatado = brl.format(Number(item.preco));
        const preco =
          item.precoTipo === 'a_partir'
            ? `A partir de ${precoFormatado}`
            : `${precoFormatado} (fixo)`;
        const duration = item.durationMinutes
          ? ` — duração: ${formatDuration(item.durationMinutes)}`
          : '';
        return `- ${item.procedimento}: ${preco}${duration}`;
      })
      .join('\n');
  } catch {
    return typeof catalog === 'string'
      ? catalog
      : JSON.stringify(catalog, null, 2);
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

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

    // BUG 3 FIX — Personas expandidas com instruções comportamentais distintas
    const personaInstructions: Record<PersonaType, string> = {
      [PersonaType.ARISTOCRATA]: `Tom aristocrático, distante e inflexível.
Use vocabulário refinado e formal. Frases curtas, precisas, impecáveis.
Zero gírias. Sem emojis. Sem excessos de gentileza.
Transmita exclusividade e distanciamento controlado — você representa a elite da medicina estética.
Exemplo de tom: "Nosso portfólio é criterioso. O procedimento mais adequado ao seu perfil seria X. Posso verificar disponibilidade."`,
      [PersonaType.SOFISTICADA]: `Tom sofisticado, caloroso e impecável.
Use o nome do paciente com frequência. Seja ágil, acolhedora e próxima — faça o paciente sentir que é especial.
Emojis com moderação: no máximo 1 por mensagem (✨ ou 🤍 preferidos).
Exemplo de tom: "Que ótimo, [nome]! Tenho o horário perfeito para você. Vamos garantir sua vaga? ✨"`,
      [PersonaType.ESPECIALISTA]: `Tom técnico, direto e autoritário.
Foco em segurança, protocolos originais e autoridade médica. Respostas curtas e objetivas.
Dados, procedimentos, próximos passos. Zero floreios. Sem emojis.
Exemplo de tom: "O protocolo indicado para esse caso é X. Posso verificar disponibilidade agora."`,
    };

    const currentPersona = personaInstructions[clinic.persona] ?? personaInstructions[PersonaType.SOFISTICADA];

    const noAvailabilityMsg: Record<PersonaType, string> = {
      [PersonaType.SOFISTICADA]: `"No momento não temos horários disponíveis para essa data. Posso verificar outra data para você?"`,
      [PersonaType.ARISTOCRATA]: `"Infelizmente não há vagas disponíveis para a data solicitada. Permita-me verificar alternativas."`,
      [PersonaType.ESPECIALISTA]: `"Essa data está sem horários livres! Mas me fala outra opção que verifico pra você 😊"`,
    };
    const currentNoAvailabilityMsg = noAvailabilityMsg[clinic.persona] ?? noAvailabilityMsg[PersonaType.SOFISTICADA];

    // BUG 3 FIX — log de visibilidade da persona ativa (somente em dev)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[Serena] Persona ativa: ${clinic.persona}`);
    }

    // 2. FORMATAÇÃO DO CATÁLOGO (com duração e tipo de preço)
    const catalogString = formatCatalogForPrompt(clinic.catalog);

    // 3. FORMATAÇÃO DA BASE DE CONHECIMENTO (estruturada)
    const knowledgeBaseString = formatKnowledgeBaseForPrompt(clinic.knowledgeBase);

    // 4. PROMPT MESTRE
  const systemPrompt: OpenAI.Chat.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: `# Contexto
  Você é Serena, Concierge Digital da clínica ${clinic.name}.
  Especialista responsável: ${clinic.doctorName}.
  Data e hora atual: ${hoje}.

  ## PERSONA ATIVA: ${clinic.persona}
  ${currentPersona}

  ## 1. Comportamento e Formato (WhatsApp — Regras Absolutas)
  - **Brevidade:** Máximo 2 frases por mensagem. Você está no WhatsApp, não escrevendo e-mail.
  - **Idioma:** Português do Brasil estrito. Proibido: "equipa", "utilizador", "fique descansada", "efectuar", "estou a fazer". Use: "equipe", "fique tranquila", "estou fazendo".
  - **Emojis:** Máximo 1 por mensagem, conforme orientação da persona acima.
  - **Gênero neutro:** Evite palavras com gênero. Use "Pode ficar tranquila(o)" → prefira "Não precisa se preocupar".
  - **Identidade:** Você é a Serena, assistente da ${clinic.name}. Nunca diga que é uma inteligência artificial, sistema automatizado ou robô. Se perguntada diretamente se é uma IA ou robô, responda (adaptando ao tom da sua persona): "Sou a assistente da clínica, aqui para te ajudar com agendamentos! 😊"
  - **Variação:** Nunca repita a mesma frase de abertura, transição ou fechamento duas vezes na conversa.
  - **Sem anúncios de ação:** NUNCA envie mensagens como "Um momento", "Vou verificar", "Vou gerar" antes de chamar uma tool. Execute a tool e responda diretamente com o resultado.
  - **Vocabulário proibido (BUG 2 FIX):** NUNCA use as palavras "reiniciar", "recomeçar", "começar do zero" ou equivalentes. Se perder o contexto da conversa, retome com: "Claro! Para te ajudar melhor, pode me dizer qual procedimento você tem interesse?"

  ## 2. Regras de Negócio (Inegociáveis)
  - Preço inegociável. Zero descontos.
  - Taxa de reserva: R$ ${clinic.reservationFee.toFixed(2)} via Pix (abatida no procedimento).
  - Procedimentos disponíveis:
${catalogString}
  - Fora da lista: negar educadamente e oferecer o portfólio acima.

  ## 3. Fluxo de Atendimento (Máquina de Estados)

  **ESTADO 1 — Descoberta**
  - Primeira mensagem: apresente-se brevemente.
  - Descubra o nome com naturalidade. Se já souber, não pergunte.
  - Entenda o objetivo. Explique valor e diferenciais antes de falar em datas ou pagamento.

  **ORDEM DE COLETA DE DADOS (nunca alterar esta sequência):**
  1. Procedimento de interesse
  2. Data e horário preferidos (após confirmar disponibilidade via tool)
  3. Nome completo do paciente
  4. CPF (somente após o nome — nunca perguntar CPF antes do nome)
  Não coletar mais de um dado por mensagem.

  **ESTADO 2 — Agenda**
  - Só avance quando houver intenção real de agendar.
  - OBRIGATÓRIO: confirmar o procedimento desejado ANTES de consultar disponibilidade, pois a duração varia.
  - OBRIGATÓRIO: chamar consultar_disponibilidade_agenda antes de confirmar qualquer data, passando o durationMinutes do procedimento escolhido.
  - NUNCA invente horários.

  **ESTADO 3 — Fechamento**
  Só chame gerar_pix_e_travar_agenda após os 4 pontos abaixo confirmados:
  1. Procedimento escolhido ✓
  2. Data confirmada via tool de agenda ✓
  3. Paciente aceitou a taxa de R$ ${clinic.reservationFee.toFixed(2)} ✓
  4. Paciente enviou o CPF ✓

  CPF: assim que o paciente enviar qualquer sequência numérica que pareça CPF, chame a tool imediatamente. Não valide por conta própria.

  **FLUXO DE CONFIRMAÇÃO DE AGENDAMENTO (CRÍTICO — BUG 1 FIX):**
  Quando todos os 4 pontos acima estiverem confirmados (especialmente após o paciente enviar o CPF):
  1. Chame IMEDIATAMENTE a tool gerar_pix_e_travar_agenda — sem enviar nenhuma mensagem antes.
  2. Após a tool retornar com sucesso, confirme: "Agendei [procedimento] para [data] às [hora] (duração estimada: [X] min). Segue o código Pix:"
  3. NUNCA diga "vou agendar", "vou gerar seu Pix", "um momento" antes de chamar a tool. O agendamento só existe após a tool retornar com sucesso.
  4. O paciente NÃO precisa enviar mais nenhuma mensagem após o CPF — você age imediatamente.

  **ENCERRAMENTO APÓS PAGAMENTO:**
  Quando o Pix for gerado e o paciente confirmar o agendamento, sua função está concluída.
  Envie a mensagem de confirmação e encerre cordialmente a conversa.
  Não ofereça continuar ajudando, não pergunte se há mais dúvidas.
  A recepcionista entrará em contato para os próximos passos.
  Se o paciente mandar qualquer mensagem após o Pix ser gerado: responda apenas
  "Nossa recepcionista entrará em contato em breve. 😊" — sem retomar o fluxo de agendamento.

  ## 4. Mudança de Data ou Procedimento Após Pix Gerado (CRÍTICO)
  Se o paciente quiser trocar data ou procedimento depois de um Pix já gerado:
  - A chave anterior está CANCELADA pelo sistema automaticamente.
  - Você DEVE voltar ao ESTADO 2: consultar nova disponibilidade via tool consultar_disponibilidade_agenda e chamar gerar_pix_e_travar_agenda novamente.
  - NUNCA diga que vai "ajustar" ou "atualizar" a chave anterior. Ela não existe mais.
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

  ## 7. Regras de Agendamento
  - Cada procedimento tem uma duração específica listada na seção 2.
  - Ao propor um horário, você NUNCA deve sugerir um slot onde (horário proposto + duração do procedimento) sobreponha outro agendamento existente.
  - Sempre confirme com o paciente o procedimento desejado ANTES de consultar disponibilidade, pois a duração varia por procedimento.
  - Ao confirmar o agendamento, mencione a duração estimada: "Sua consulta de [procedimento] tem duração de aproximadamente [duração]."

  ## 8. Base de Conhecimento da Clínica
  INFORMAÇÕES DA CLÍNICA:
${knowledgeBaseString}

  ## 9. Mensagens de Erro e Indisponibilidade
  Sempre mantenha o tom da persona ativa ao comunicar limitações. Nunca use frases genéricas como "Ocorreu um erro" ou "Não foi possível".
  Quando não houver horários disponíveis, use exatamente: ${currentNoAvailabilityMsg}
  Para qualquer outra limitação técnica, comunique com naturalidade no tom da sua persona, sem expor detalhes técnicos.

  ## 10. Recuperação de Contexto
  Se a conversa estiver com contexto incompleto ou ambíguo, retome com naturalidade:
  "Claro! Para te ajudar melhor, pode me dizer qual procedimento você tem interesse?"
  Nunca diga "vou reiniciar", "vou recomeçar" ou equivalentes.`,
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
              durationMinutes: { type: 'number', description: 'Duração do procedimento em minutos, conforme o catálogo da clínica' },
            },
            required: ['patient_name', 'patient_cpf', 'procedure', 'target_date', 'durationMinutes'],
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
          description: 'Consulta os horários disponíveis na agenda da clínica. Use ANTES de confirmar qualquer data com o paciente e ANTES de chamar gerar_pix_e_travar_agenda. Confirme o procedimento desejado antes de chamar, pois durationMinutes é obrigatório.',
          parameters: {
            type: 'object',
            properties: {
              date_from: { type: 'string', description: 'Data e hora de início do intervalo de busca no formato ISO 8601' },
              date_to: { type: 'string', description: 'Data e hora de fim do intervalo de busca no formato ISO 8601' },
              durationMinutes: { type: 'number', description: 'Duração do procedimento em minutos, conforme o catálogo da clínica. Obrigatório para calcular colisões corretamente.' },
            },
            required: ['date_from', 'date_to', 'durationMinutes'],
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

      // 5. INTERCEPTADOR DE FERRAMENTAS
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
            let pixArgs: { patient_name: string; patient_cpf: string; procedure: string; target_date: string; durationMinutes?: number };
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
            let calArgs: { date_from: string; date_to: string; durationMinutes?: number };
            try {
              calArgs = JSON.parse(toolCall.function.arguments);
            } catch {
              this.logger.error(`[SERENA] JSON inválido nos argumentos da agenda.`);
              return { type: 'reply', text: 'Não consegui interpretar o intervalo de datas. Pode informar os dias que prefere?' };
            }

            this.logger.log(`[SERENA] Consultando agenda de ${calArgs.date_from} até ${calArgs.date_to} (duração: ${calArgs.durationMinutes ?? 60}min)`);
            const availableSlots = await this.calendarService.getAvailableSlots(
              calArgs.date_from,
              calArgs.date_to,
              calArgs.durationMinutes ?? 60,
            );

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
                let pixArgs: { patient_name: string; patient_cpf: string; procedure: string; target_date: string; durationMinutes?: number };
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

      // 6. RESPOSTA NORMAL DE TEXTO
      if (responseMessage.content) {
        return { type: 'reply', text: responseMessage.content };
      }

      throw new Error('OpenAI retornou payload vazio e sem ferramentas.');
    } catch (error) {
      this.logger.error(`[SERENA] Falha de processamento na OpenAI: ${error.message}`);
      return { type: 'reply', text: 'Nossos sistemas estão processando sua solicitação. Retornaremos em instantes.' };
    }
  }

  private resolveSplitValue(tier: ClinicTier): number {
    const splits: Record<ClinicTier, number> = {
      STARTER: 15,
      GROWTH: 12,
      SCALE: 0,
    };
    return splits[tier];
  }

  /**
   * Executa a cobrança Pix via AsaasService e retorna a string de resultado
   * a ser enviada de volta à IA como conteúdo da tool call.
   */
  private async executePixCharge(
    args: { patient_name: string; patient_cpf: string; procedure: string; target_date: string; durationMinutes?: number },
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

      const splitValue = this.resolveSplitValue(clinic.currentTier);
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
        durationMinutes: args.durationMinutes ?? 60,
        symetraSplitWalletId: process.env.SYMETRA_ASAAS_WALLET_ID,
        symetraSplitValue: splitValue,
      });

      this.logger.log(`[SERENA] Pix gerado — Invoice: ${pixResult.asaasInvoiceId}, Appointment: ${pixResult.appointmentId}`);

      // Persiste o CPF criptografado no registro do paciente (LGPD)
      // Normalizado (só dígitos) para bater com o valor validado e enviado ao Asaas.
      if (args.patient_cpf) {
        await this.prisma.patient.update({
          where: { id: patientContext.id },
          data: { cpfEncrypted: this.cryptoService.encrypt(normalizeCpf(args.patient_cpf)) },
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

      // 401 = chave de API do Asaas inválida/expirada na clínica — problema de
      // configuração, não do CPF do paciente. Não deve ser reportado como CPF inválido.
      if (err.status === 401 || err.response?.status === 401) {
        this.logger.error(`[SERENA] Asaas API key inválida/expirada para a clínica ${clinic.id}`);
        return JSON.stringify({
          error: true,
          code: 'PIX_GENERATION_FAILED',
          message:
            'Não foi possível gerar o Pix neste momento por instabilidade técnica. Avise o paciente com educação e informe que a equipe já foi notificada. Não invente um código Pix e não peça o CPF novamente.',
        });
      }

      const isCpfError = err.message === 'CPF_INVALID' || err.status === 422;

      if (isCpfError) {
        return JSON.stringify({
          error: true,
          code: 'INVALID_CPF',
          message:
            'O CPF informado é inválido (número de dígitos ou dígitos verificadores incorretos). Informe o paciente de forma natural e peça que ele digite o CPF correto novamente. Não mencione erro técnico.',
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
