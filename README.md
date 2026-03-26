# ♾️ Symetra | Inteligência de Liquidação Estética

> **O fim do lead curioso.** A Symetra é uma infraestrutura de "Concierge Digital" e liquidação financeira desenhada exclusivamente para clínicas de Harmonização Facial High-Ticket. 

---

## 💎 A Tese do Produto
Diferente de chatbots genéricos, a Symetra não foca em conversação recreativa. Nosso foco é a **Liquidação Financeira**. Utilizamos IA (OpenAI Function Calling) para triar intenções, quebrar objeções aristocráticas e forçar a reserva de agenda via Pix (Asaas) com trava atômica no banco de dados.

### Diferenciais Técnicos (O nosso Moat)
* **Fricção Seletiva:** IA treinada para "expurgar" leads de baixo ticket sem intervenção humana.
* **Race Condition Protection:** Bloqueio físico de agenda no PostgreSQL (`@@unique([clinic_id, target_date])`) impedindo agendamentos duplos no mesmo milissegundo.
* **Idempotência de Pagamento:** Processamento de webhooks do Asaas blindado contra retentativas de rede.
* **Clean Luxury UI:** Interface brutalista desenvolvida em Next.js 15 e Shadcn/ui.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/) |
| **Back-end** | [NestJS](https://nestjs.com/) (Node.js) |
| **Front-end** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Banco de Dados** | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Inteligência** | [OpenAI API](https://openai.com/) (gpt-4o-mini / Function Calling) |
| **Mensageria** | [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) (Meta) |
| **Financeiro** | [Asaas API](https://www.asaas.com/) (Pix & Split Payment) |

---

## 📂 Estrutura do Projeto

```bash
.
├── apps
│   ├── api          # Back-end NestJS (O cérebro e integrações)
│   └── web          # Front-end Next.js 15 (Dashboard B2B e Agência)
├── packages
│   ├── eslint-config # Configurações de linting compartilhadas
│   └── typescript    # Configurações de TS compartilhadas
└── README.md
```

---

## 🚀 Guia de Início Rápido

### 1. Requisitos
* Node.js 20+ & pnpm
* Instância PostgreSQL (Supabase recomendada)
* Chaves de API: OpenAI, Asaas (Sandbox) e Meta Developer.

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/symetra-core.git

# Instale as dependências na raiz
pnpm install
```

### 3. Configuração do Banco
No diretório `apps/api`, configure seu `.env` e rode:
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Execução (Desenvolvimento)
Para rodar todo o ecossistema (API + Web) simultaneamente:
```bash
pnpm dev
```

---

## 🛡️ Camadas de Segurança (DevOps)
* **SLA de Limpeza:** CronJob automático que libera horários na agenda caso o Pix não seja pago em 15 minutos.
* **Validation Pipe:** Uso de `Zod` e `Class-Validator` em todas as entradas de dados (API).
* **Logging:** Sistema de logs estruturados para rastreamento de conversas da Serena.

---

## 📈 Milestones de Evolução
- [x] **Fase 1:** Fundação Monorepo e Banco de Dados.
- [x] **Fase 2:** Integração Asaas e OpenAI Function Calling.
- [x] **Fase 3:** Webhook Meta (WhatsApp) e Orquestrador de Mensagens.
- [ ] **Fase 4:** Dashboard B2B (Next.js 15) e Integração Google Calendar.
- [ ] **Fase 5:** Split Payment Automatizado e Painel de Agência Parceira.

---

> **Symetra Inc. © 2026** - *Tecnologia aristocrática para resultados de alta performance.*