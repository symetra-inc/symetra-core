import type { Metadata } from 'next'
import { Lexend, Source_Sans_3 } from 'next/font/google'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { ScrollReveal } from './scroll-reveal'
import './home.css'

const lexend = Lexend({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-heading' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Symetra · Tecnologia para escritórios de contabilidade',
  description:
    'A Symetra monta soluções sob medida para tirar o trabalho repetitivo da rotina do escritório contábil. A equipe continua no controle.',
}

/* ── Contato: CNPJ só aparece na página quando preenchido ── */
const EMAIL = 'contato@symetra.com.br'
const CNPJ = '' // ex.: '00.000.000/0001-00'
const LINKEDIN_URL = 'https://www.linkedin.com/in/guilherme-ryam-guedes/'

/* ── Constants ── */
const WA_MESSAGE =
  'Olá! Vi o site da Symetra e quero agendar uma conversa de 15 minutos sobre o meu escritório.'
const WA_LINK = `https://wa.me/5511947391058?text=${encodeURIComponent(WA_MESSAGE)}`
const MAIL_LINK = EMAIL
  ? `mailto:${EMAIL}?subject=${encodeURIComponent('Conversa sobre o meu escritório')}`
  : ''

const HEADING = 'font-[family-name:var(--font-heading)]'
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]'

const PAINS = [
  'Documento de cliente que chega por WhatsApp e e-mail e alguém precisa organizar e digitar.',
  'Conferência feita item por item, todo mês, sempre do mesmo jeito.',
  'Planilha que passa de mão em mão até virar informação no sistema.',
  'Demanda nova, como as da Reforma Tributária, chegando em cima da rotina de sempre.',
]

const STEPS = [
  { title: 'Conversa.',    desc: 'Entendemos a rotina do escritório e onde a equipe perde mais tempo.' },
  { title: 'Proposta.',    desc: 'Escolhemos uma tarefa e desenhamos uma solução para ela, do jeito que o escritório já trabalha.' },
  { title: 'Implantação.', desc: 'A Symetra coloca para funcionar e acompanha. A equipe confere o resultado e decide o que vale.' },
]

const PRINCIPLES = [
  { title: 'A equipe continua no controle.', desc: 'A tecnologia prepara o trabalho. Quem confere e decide é o escritório.' },
  { title: 'Sem trocar de sistema.',         desc: 'A ideia é trabalhar junto com o que vocês já usam, não mudar a forma como o escritório funciona.' },
  { title: 'Confidencialidade.',             desc: 'Os dados dos seus clientes são tratados com sigilo, conforme a LGPD, e usados só para o que foi combinado.' },
  { title: 'Nada sem autorização.',          desc: 'Nenhum acesso a sistema, portal ou certificado sem autorização expressa do escritório.' },
]

const FAQ = [
  {
    q: 'Que tipo de tarefa dá para resolver?',
    a: 'Em geral, tarefa repetitiva, que segue um padrão e toma tempo da equipe todo mês. Na conversa a gente vê se a sua se encaixa. Se não fizer sentido, eu digo.',
  },
  {
    q: 'Isso substitui a minha equipe?',
    a: 'Não. A ideia é tirar da equipe a parte braçal, para que ela tenha tempo para o que exige conhecimento técnico.',
  },
  {
    q: 'Preciso trocar de sistema ou instalar alguma coisa?',
    a: 'A proposta é não mexer no que já funciona. Os detalhes dependem da tarefa e são definidos antes de começar.',
  },
  {
    q: 'Quanto custa?',
    a: 'Depende do que for resolvido. O valor é definido depois da primeira conversa, quando o escopo estiver claro, e combinado antes de começar.',
  },
]

/* ── Micro-components ── */
function CtaButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0369A1] px-6 py-3 text-[17px] font-semibold text-white no-underline cursor-pointer transition-colors duration-200 hover:bg-[#075985] ${FOCUS_RING} ${className}`}
    >
      Agendar uma conversa de 15 minutos
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </a>
  )
}

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-slate-200 px-4 py-16 md:px-8 md:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <h2 data-reveal className={`${HEADING} max-w-[28ch] text-[clamp(1.5rem,3.2vw,2.1rem)] font-semibold leading-[1.2] tracking-[-0.015em] text-slate-900`}>
          {title}
        </h2>
        <div className="mt-8 md:mt-10">{children}</div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className={`${lexend.variable} ${sourceSans.variable} min-h-screen bg-white font-[family-name:var(--font-body)] text-[17px] leading-[1.65] text-slate-700 antialiased [color-scheme:light]`}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <span className={`${HEADING} text-[19px] font-semibold tracking-[-0.01em] text-slate-900`}>Symetra</span>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-11 items-center rounded-md border border-slate-300 px-4 text-[15px] font-semibold text-slate-900 no-underline cursor-pointer transition-colors duration-200 hover:border-slate-900 ${FOCUS_RING}`}
          >
            Agendar conversa
          </a>
        </div>
      </header>

      <ScrollReveal />
      <main>

        {/* ── HERO ── */}
        <section className="px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-6xl">
            <p className="hero-in mb-5 text-[15px] font-semibold text-[#0369A1]">Para escritórios de contabilidade</p>
            <h1 style={{ '--d': 1 } as React.CSSProperties} className={`hero-in ${HEADING} max-w-[20ch] text-[clamp(2.1rem,5.4vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-slate-900`}>
              Mais tempo para a sua equipe fazer o que só ela sabe fazer.
            </h1>
            <p style={{ '--d': 2 } as React.CSSProperties} className="hero-in mt-6 max-w-[58ch] text-[19px] leading-[1.6] text-slate-600">
              A Symetra monta soluções sob medida para o trabalho repetitivo do escritório. A parte manual sai da rotina; a conferência e as decisões continuam com vocês.
            </p>
            <div style={{ '--d': 3 } as React.CSSProperties} className="hero-in mt-9">
              <CtaButton className="w-full sm:w-auto" />
            </div>
          </div>
        </section>

        {/* ── ONDE COSTUMA TRAVAR ── */}
        <Section title="Onde o tempo costuma ir embora" className="bg-slate-50">
          <ul className="grid max-w-5xl grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2">
            {PAINS.map((p, i) => (
              <li key={p} data-reveal style={{ '--d': i } as React.CSSProperties} className="border-l-2 border-slate-300 pl-4">{p}</li>
            ))}
          </ul>
          <p data-reveal className="mt-10 max-w-[60ch] text-slate-900">
            Se alguma dessas soa familiar, ou se o gargalo do seu escritório é outro, vale a conversa.
          </p>
        </Section>

        {/* ── COMO FUNCIONA ── */}
        <Section title="Como funciona">
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} data-reveal style={{ '--d': i } as React.CSSProperties} className="border-t-2 border-[#0369A1] pt-4">
                <span className={`${HEADING} text-[14px] font-semibold text-[#0369A1]`}>{i + 1}</span>
                <h3 className={`${HEADING} mt-1 text-[18px] font-semibold leading-snug text-slate-900`}>{s.title}</h3>
                <p className="mt-2">{s.desc}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── COMO TRABALHAMOS ── */}
        <Section title="Como trabalhamos">
          <ul className="grid max-w-5xl grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            {PRINCIPLES.map((s, i) => (
              <li key={s.title} data-reveal style={{ '--d': i } as React.CSSProperties} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900">
                  <Check className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                <p>
                  <strong className="font-semibold text-slate-900">{s.title}</strong> {s.desc}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── PILOTO ── */}
        <Section title="Começamos pequeno" className="bg-slate-50">
          <div className="grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-12">
            <p data-reveal>
              O primeiro passo é um piloto: uma tarefa só, com escopo fechado, prazo curto e preço combinado antes de começar.
            </p>
            <p data-reveal style={{ '--d': 1 } as React.CSSProperties}>
              Medimos quanto tempo a equipe gasta nessa tarefa antes e depois. Você decide se continua olhando para o resultado, não para promessa.
            </p>
          </div>
        </Section>

        {/* ── QUEM ESTÁ POR TRÁS ── */}
        <Section title="Quem está por trás">
          <div data-reveal className="max-w-3xl">
            <p className="max-w-[62ch]">
              A Symetra trabalha com tecnologia aplicada a processos: entender como uma tarefa é feita hoje e colocar a parte repetitiva para rodar sozinha, sempre com uma pessoa conferindo o resultado. Cada projeto é acompanhado de perto, do começo ao fim, por quem desenhou a solução.
            </p>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[#0369A1] underline underline-offset-4 cursor-pointer hover:text-[#075985] ${FOCUS_RING}`}>
              Ver perfil no LinkedIn
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </Section>

        {/* ── FAQ ── */}
        <Section title="Perguntas frequentes">
          <div className="max-w-4xl border-t border-slate-200">
            {FAQ.map((f, i) => (
              <details key={f.q} data-reveal style={{ '--d': i } as React.CSSProperties} className="group border-b border-slate-200">
                <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}>
                  <span className={`${HEADING} text-[18px] font-medium text-slate-900`}>{f.q}</span>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <p className="max-w-[62ch] pb-6">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* ── CTA FINAL ── */}
        <section className="bg-slate-900 px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 data-reveal className={`${HEADING} text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white`}>
              Uma conversa de 15 minutos
            </h2>
            <p data-reveal style={{ '--d': 1 } as React.CSSProperties} className="mt-4 max-w-[56ch] text-slate-300">
              Me conta como é a rotina do seu escritório. Se der para ajudar, eu digo como. Se não der, também digo.
            </p>
            <div data-reveal style={{ '--d': 2 } as React.CSSProperties} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-[17px] font-semibold text-slate-900 no-underline cursor-pointer transition-colors duration-200 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Chamar no WhatsApp
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
              {MAIL_LINK && (
                <a
                  href={MAIL_LINK}
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-500 px-6 py-3 text-[17px] font-semibold text-white no-underline cursor-pointer transition-colors duration-200 hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Mandar um e-mail
                </a>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="px-4 py-8 md:px-8">
        <p className="mx-auto max-w-6xl text-[15px] text-slate-500">
          Symetra
          {CNPJ && <> · CNPJ {CNPJ}</>}
          {EMAIL && (
            <>
              {' · '}
              <a href={MAIL_LINK} className={`cursor-pointer text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline ${FOCUS_RING}`}>{EMAIL}</a>
            </>
          )}
          {' · '}
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={`cursor-pointer text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline ${FOCUS_RING}`}>
            WhatsApp +55 (11) 94739-1058
          </a>
        </p>
      </footer>
    </div>
  )
}
