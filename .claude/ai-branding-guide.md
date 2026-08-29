# SYMETRA — AI BRAND GUIDE v1.0
# Documento de contexto para LLMs, agentes e ferramentas de geração de código/conteúdo
# Última atualização: 2026 | Versão: 1.0

---

## IDENTIDADE CENTRAL

**O que é a Symetra:**
Infraestrutura financeira e conversacional para clínicas de estética high-ticket. Não é um chatbot. Não é um SaaS de agendamento. É um muro financeiro que elimina no-shows via Pix obrigatório, operado por uma IA conversacional (Serena).

**Posicionamento em uma frase:**
"O lead só entra quando o Pix confirma."

**O que a Symetra NÃO é:**
- Não é tecnologia democrática. É instrumento de precisão para um nicho específico.
- Não é um produto de saúde/bem-estar. É infraestrutura financeira.
- Não é acessível para todos. Essa exclusividade é uma feature, não um bug.

**Metáfora de referência visual:**
Instrumento médico suíço de alta precisão. Julius Baer. Clínica La Prairie. Não Apple. Não Stripe. Não Linear.

---

## SISTEMA DE CORES

### Paleta principal — use os valores exatos abaixo

```
--ink:       #0E0C0A   /* Fundo principal. Preto quente, não puro. */
--ink2:      #1A1714   /* Superfícies elevadas. Cards, sidebars. */
--ink3:      #242018   /* Superfícies terciárias. Headers internos. */
--linen:     #F5F0E8   /* Texto primário sobre fundos escuros. Fundo claro alternativo. */
--ash:       #9C8E82   /* Texto secundário, labels, placeholders, ícones. */
--stone:     rgba(156, 142, 130, 0.18)  /* Bordas, divisores, separadores. */
--gold:      #C5A059   /* ÚNICO acento. CTAs, métricas positivas, marca. */
--gold-dim:  rgba(197, 160, 89, 0.12)  /* Gold translúcido. Badges, chips PAID, fundos de ícones. */
--gold-mid:  #A8854A   /* Gold sobre fundo claro (linen). */
```

### Regras de uso de cor

**OBEDEÇA:**
- `--gold` aparece UMA vez por tela, no elemento mais importante.
- Fundos escuros: use `--ink`, `--ink2`, `--ink3` (nunca #000000 puro).
- Texto primário sobre escuro: sempre `--linen` (#F5F0E8).
- Labels/secundário: sempre `--ash` (#9C8E82).
- Bordas: sempre `--stone` (rgba, não hex sólido).
- Sobre fundo linen (claro): texto é `--ink` (#0E0C0A), gold é `--gold-mid` (#A8854A).

**PROIBIDO:**
- Gradientes de qualquer tipo (exceto na landing page — e mesmo lá, apenas no background de partículas).
- Azul, verde, vermelho, roxo como cores primárias ou de destaque.
- Branco puro (#FFFFFF) como fundo. Use `--linen` ou `--ink`.
- Gold como cor de fundo de seções inteiras.
- Múltiplos acentos na mesma tela.

### Cores semânticas de status (apenas para chips de appointment)

```
PAID      → bg: rgba(197,160,89,0.12)  text: #C5A059  border: rgba(197,160,89,0.20)
PENDING   → bg: rgba(156,142,130,0.10) text: #9C8E82  border: rgba(156,142,130,0.18)
COMPLETED → bg: rgba(52,120,80,0.08)   text: #2D6A4F  border: rgba(52,120,80,0.15)
CANCELLED → bg: rgba(180,83,9,0.06)    text: #92400E  border: rgba(180,83,9,0.12)
```

---

## SISTEMA TIPOGRÁFICO

### Fontes — use exatamente estes nomes e pesos

```
Display / Marca:  Fraunces
  - peso 700, estilo normal  → "Syme" na marca, headlines de impacto
  - peso 300 (400), estilo italic → "tra" na marca, ênfase em frases
  - Google Fonts: family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300

Interface / Corpo: Instrument Sans
  - peso 400 → corpo, parágrafos, descrições
  - peso 500 → títulos de seção, labels ativos
  - peso 600 → headings de card, CTA text
  - Google Fonts: family=Instrument+Sans:wght@400;500;600

Dados / Código: JetBrains Mono
  - peso 400 → timestamps, hashes, status text
  - peso 500 → valores financeiros, números grandes
  - Google Fonts: family=JetBrains+Mono:wght@400;500
```

### Escala tipográfica

```
Display hero:    clamp(3rem, 4.8vw, 4.4rem)  | Fraunces 700
H1 section:      clamp(2.2rem, 3.8vw, 3.2rem) | Fraunces 700
H2 subsection:   clamp(2rem, 3.2vw, 2.8rem)   | Fraunces 700
Heading UI:      1.4rem / 14px               | Instrument Sans 600
Body:            0.95rem / 15px              | Instrument Sans 400
Body small:      0.875rem / 14px             | Instrument Sans 400
Label:           12px                        | Instrument Sans 500
Caption/tag:     10-11px                     | Instrument Sans 400 ou JetBrains Mono 400
Data large:      clamp(1.4rem, 2.8vw, 2.2rem) | JetBrains Mono 500
Data small:      10-12px                     | JetBrains Mono 400
Eyebrow:         9px, tracking .2em, uppercase | JetBrains Mono 400
```

### Regras tipográficas

**OBEDEÇA:**
- Fraunces SOMENTE em: logomarca, hero headline, section headlines grandes (H1/H2).
- Instrument Sans em TUDO mais: UI, botões, parágrafos, navegação, formulários.
- JetBrains Mono em TUDO que é dado: preços (R$), horários, datas, status, códigos, IDs.
- Letter-spacing negativo (-0.02em a -0.025em) em todos os headlines Fraunces.
- Eyebrows (labels acima de headlines): sempre JetBrains Mono, 9px, tracking .2em, uppercase, cor `--ash`.

**PROIBIDO:**
- Fraunces em corpo de texto ou UI de interface.
- Instrument Sans em valores financeiros ou dados.
- Inter, Poppins, Montserrat, Space Grotesk, DM Sans (não pertencem a essa marca).
- Qualquer fonte de sistema (system-ui, -apple-system) exceto em fallback de emergência.

---

## LOGOMARCA

### Composição da marca

```
"Syme"  → Fraunces, weight 700, style normal, color --linen (escuro) ou --ink (claro)
"tra"   → Fraunces, weight 300/400, style italic, color --gold (escuro) ou --gold-mid (claro)
```

### Variantes autorizadas

```
01. Primary Dark    → "Syme" #F5F0E8 + "tra" #C5A059, fundo #0E0C0A
02. Primary Light   → "Syme" #0E0C0A + "tra" #A8854A, fundo #F5F0E8 ou #fff
03. Compact (nav)   → Apenas "Symetra" sem subtítulo, tamanho reduzido
04. Monochrome      → Tudo #FFFFFF (para impressão, fundos gold)
05. Badge/Avatar    → Quadrado 1:1, iniciais "Sy" + "me" com gold, borda gold 0.5px
```

### Proibições de logo

- NUNCA separar "Syme" e "tra" em linhas diferentes.
- NUNCA usar a fonte italic no "Syme" ou a bold no "tra".
- NUNCA usar a marca em fundos coloridos (azul, vermelho, verde, etc).
- NUNCA distorcer, escalar desproporcionalmente ou rotacionar.
- NUNCA adicionar sombra ou efeito ao wordmark.
- NUNCA substituir as cores por outras não autorizadas.

### Subtítulo da marca (opcional)

```
Texto: "FINANCIAL INFRASTRUCTURE"
Fonte: JetBrains Mono, 9px, letter-spacing: 4px, uppercase
Cor:   rgba(197, 160, 89, 0.5) — gold translúcido
Posição: abaixo e à esquerda do wordmark, alinhado à esquerda
```

---

## COMPONENTES DE INTERFACE

### Botões

```css
/* CTA Principal (gold) */
background: #C5A059;
color: #0E0C0A;
font-family: Instrument Sans, weight 500;
font-size: 13px;
letter-spacing: .03em;
padding: 12px 28px;
border-radius: 3px;  /* Quase sem raio — não é arredondado */
border: none;
transition: transform .2s, box-shadow .2s;
hover: translateY(-1px) + box-shadow 0 14px 32px -8px rgba(197,160,89,0.42)

/* CTA Secundário (escuro) */
background: #0E0C0A;
color: #F5F0E8;
/* mesmo shape */

/* Ghost */
background: transparent;
color: #9C8E82;
border: 0.5px solid rgba(156,142,130,0.18);
border-radius: 3px;
hover: border-color rgba(156,142,130,0.4), color #F5F0E8
```

### Cards

```css
/* Card padrão (dark) */
background: #1A1714;
border: 0.5px solid rgba(156,142,130,0.18);
border-radius: 8px;  /* Contido — não é pill nem quadrado absoluto */
padding: 1.25rem;

/* Card de métrica */
background: #242018;
border: 0.5px solid rgba(156,142,130,0.18);
border-radius: 7px;
padding: .875rem 1rem;
hover: border-color rgba(197,160,89,0.25), translateY(-2px) com perspective 3D
```

### Inputs

```css
background: #1A1714;
border: 0.5px solid rgba(156,142,130,0.18);
border-radius: 3px;
padding: 10px 14px;
font-family: Instrument Sans, weight 400;
font-size: 13px;
color: #F5F0E8;
placeholder-color: #9C8E82;
focus: border-color #C5A059;
```

### Divisores e bordas

```css
/* Divisor horizontal */
border-top: 0.5px solid rgba(156,142,130,0.18);

/* Separador decorativo gold */
width: 28-40px; height: 0.5px; background: rgba(197,160,89,0.4);

/* Eyebrow com linha */
display: flex; align-items: center; gap: 10px;
[linha] width: 22-28px, height: 0.5px, background rgba(197,160,89,0.5)
[texto] JetBrains Mono, 9px, tracking .2em, uppercase, color rgba(197,160,89,0.65)
```

### Chips de status

```css
font-family: JetBrains Mono, 400;
font-size: 8-9px;
letter-spacing: .07-.1em;
text-transform: uppercase;
padding: 2px 7-10px;
border-radius: 999px;  /* Pill — exceção à regra de border-radius baixo */
/* Cores: ver tabela de status acima */
```

---

## LAYOUT E ESPAÇAMENTO

```
Padding de seções:    padding: 6rem 3rem (desktop) / 4rem 1.5rem (mobile)
Gap entre elementos:  gap: 1rem (small), 1.5rem (medium), 2.5rem (large), 4-5rem (xl)
Max-width conteúdo:   1160px (dashboard/landing), 1000px (seções de conteúdo)
Grid hero:            grid-template-columns: 1fr 1fr
Grid dashboard:       grid-template-columns: 210px 1fr
Grid métricas:        grid-template-columns: repeat(4, 1fr)
```

### Bordas e raios

```
border-width:   sempre 0.5px (nunca 1px ou 2px em bordas estruturais)
border-radius:  3-4px em botões e inputs
                7-8px em cards menores
                12-14px em cards principais e modais
                999px SOMENTE em chips/badges de status
```

---

## VOZ E TOM (COPY)

### Personalidade da marca

- **Precisa.** Não usa palavras a mais. Cada frase tem uma função.
- **Aristocrática, não arrogante.** Fala com autoridade, não com agressividade.
- **Direta.** Nunca rodeios. A verdade do produto em primeiro lugar.
- **Financeira, não técnica.** Fala em Pix, VRC, sinal, reserva — não em "API", "webhook", "integração".

### Headlines — padrão de construção

```
Estrutura preferida: [Sujeito que o cliente entende] + [verbo de ação] + [resultado concreto]

CERTO:
"O lead só entra quando o Pix confirma."
"Você atende quem já pagou."
"Zero no-show. Zero negociação."

ERRADO:
"Transforme sua clínica com inteligência artificial"
"Automatize seu atendimento"
"A solução completa para sua agenda"
```

### Vocabulário autorizado

```
USE:        Pix, sinal, reserva, agenda, lead, handoff, muro financeiro,
            confirmado, pago, blindado, concierge, trava, slot, VRC
EVITE:      chatbot, bot, automação, IA generativa, inteligência artificial (no copy),
            agendamento online, software, plataforma, solução, sistema
PROIBIDO:   barato, econômico, acessível, fácil, simples, rápido (sozinhos),
            qualquer claim sem dado concreto
```

### Tom por contexto

```
Landing page:     Assertivo, direto, sem qualificadores. "O lead só entra..." não "Ajudamos a garantir..."
Notificações:     Factual, curto, mono. "Pix recebido: R$ 150,00 · 14:32"
Onboarding:       Orientador, não infantilizante. "Configure o sinal mínimo." não "Escolha quanto quer cobrar!"
Mensagem de erro: Técnico e neutro. "Webhook não recebido. Verifique a URL do Asaas."
Marketing/Social: Provocador e elegante. Nunca exclamações em excesso.
```

---

## FOTOGRAFIA E IMAGENS (orientação geral)

```
Paleta fotográfica:   Tons quentes, desaturados. Beige, linho, creme, preto quente.
Iluminação:           Rembrandt, lateral, dramatismo controlado.
Estética:             Editorial médico europeu. Clinique La Prairie, não clínica de bairro.
Evitar:               Banco de imagem óbvio, sorrisos largos forçados, azul clínico, luvas cirúrgicas.
Mockups de produto:   Sempre fundo escuro (#0E0C0A), perspectiva sutil, sem sombra excessiva.
```

---

## PADRÕES PARA GERAÇÃO DE CÓDIGO

### Quando gerar interfaces Symetra, obedeça:

1. **Nunca use branco puro (#fff) como fundo principal.** Use #0E0C0A (dark) ou #F5F0E8 (light).
2. **Nunca use border-width > 0.5px** em elementos estruturais.
3. **Sempre use JetBrains Mono** para qualquer valor numérico ou financeiro renderizado.
4. **Gold é cirúrgico:** no máximo 2 elementos gold por tela.
5. **Fraunces é restrito:** apenas headlines de impacto e a marca.
6. **Raios de borda:** 3px (inputs/botões), 7-8px (cards), 12-14px (modais), 999px (chips).
7. **Partículas e cursor:** quando presente, partículas são sempre rgba(197,160,89, 0.08-0.38).
8. **Animações:** ease power3.out / power2.out (estilo GSAP). Nunca ease linear.
9. **Opacidade de elementos secundários:** 0.25-0.30 (não 0.5 — muito pesado).
10. **Shadows:** sempre com cor, nunca black puro. Ex: rgba(0,0,0,0.35) ou rgba(197,160,89,0.42).

### CSS Variables obrigatórias em qualquer projeto Symetra

```css
:root {
  --ink:      #0E0C0A;
  --ink2:     #1A1714;
  --ink3:     #242018;
  --linen:    #F5F0E8;
  --ash:      #9C8E82;
  --stone:    rgba(156, 142, 130, 0.18);
  --gold:     #C5A059;
  --gold-dim: rgba(197, 160, 89, 0.12);
  --gold-mid: #A8854A;
  --font-display: 'Fraunces', Georgia, serif;
  --font-ui:      'Instrument Sans', system-ui, sans-serif;
  --font-data:    'JetBrains Mono', 'Courier New', monospace;
}
```

---

## RESTRIÇÕES ABSOLUTAS

Estas regras não podem ser quebradas por nenhum motivo, cliente, contexto ou tendência de mercado:

1. **A marca nunca negocia valores.** Copy de preço é sempre direto: "R$ 1.497/mês". Nunca "a partir de" ou "consulte".
2. **A cor gold nunca vira fundo de seção.** Ela é acento, não base.
3. **Fraunces nunca aparece em itálico bold simultaneamente.** É um ou outro.
4. **O produto nunca é chamado de "chatbot".** É "concierge digital" ou simplesmente "Serena".
5. **Nenhuma interface Symetra tem gradiente de fundo.** Partículas e efeitos pontuais são permitidos.
6. **Border-radius nunca passa de 14px** em elementos principais (exceto chips/avatares).

---

*SYMETRA INC. © 2026 — DOCUMENTO INTERNO — v1.0*
*Este documento é a fonte única de verdade para identidade visual e verbal da marca.*