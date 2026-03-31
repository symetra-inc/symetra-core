'use client'

import './landing.css'
import { useEffect, useRef, useState } from 'react'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})
const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
})

/* ── Discriminated union — TypeScript happy ── */
type MsgText = { t: 'ai' | 'user'; s: string }
type MsgPix  = { t: 'pix'; amt: string }
type Message = MsgText | MsgPix

type StepItem = { n: string; title: string; desc: string }

/* ── Constants ── */
const WA_ACCESS = 'https://wa.me/5511947391058?text=Quero%20solicitar%20acesso%20%C3%A0%20Symetra'
const WA_AGENCY = 'https://wa.me/5511947391058?text=Quero%20saber%20sobre%20o%20modelo%20de%20parceria%20Symetra'

const CONVERSATIONS: Message[][] = [
  [{ t: 'ai',   s: 'Olá! Sou a Serena, concierge da Clínica Dra. Ana. Em que posso ajudá-la? 🤍' }],
  [{ t: 'user', s: 'Queria informações sobre harmonização labial.' },
   { t: 'ai',   s: 'Que ótimo! Trabalhamos com os melhores protocolos para realce natural e discreto. Posso perguntar seu nome?' }],
  [{ t: 'user', s: 'Juliana.' },
   { t: 'ai',   s: 'Olá, Juliana! Tenho horários disponíveis na quinta às 14h ou sexta às 10h. Qual prefere?' }],
  [{ t: 'user', s: 'Quinta está ótimo.' },
   { t: 'ai',   s: 'Perfeito! Para confirmar sua reserva, há um sinal de R$ 150. Gero o Pix agora?' },
   { t: 'user', s: 'Sim, por favor.' }],
  [{ t: 'pix',  amt: 'R$ 150,00' }],
]

const PIX_AMOUNTS = [150, 200, 120, 180, 100]
const PIX_LABELS  = ['+ R$ 150,00', '+ R$ 200,00', '+ R$ 120,00', '+ R$ 180,00', '+ R$ 100,00']

const STEPS: StepItem[] = [
  { n: '01', title: 'Lead chega pelo tráfego',            desc: 'O lead manda mensagem no número da clínica. A Serena responde em segundos com a persona configurada — Aristocrata, Sofisticada ou Especialista.' },
  { n: '02', title: 'Qualificação e quebra de objeção',   desc: 'Extração de interesse, identificação do procedimento, manejo de objeções de preço. Zero negociação manual. Zero diagnóstico médico.' },
  { n: '03', title: 'Agenda verificada em tempo real',    desc: 'A Serena consulta o Google Calendar da clínica antes de sugerir horários. Sem conflitos, sem promessas que não se cumprem.' },
  { n: '04', title: 'Pix gerado · agenda travada 15 min', desc: 'Pix Copia e Cola enviado via WhatsApp. Slot travado atomicamente. Sem pagamento confirmado, o horário é liberado e a conversa encerra.' },
  { n: '05', title: 'Handoff com contexto completo',      desc: 'Asaas confirma o Pix. Secretária recebe resumo da conversa no WhatsApp. SLA começa. Você atende quem já pagou.' },
]

/* ── Micro-components ── */
function CheckCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="#C5A059" strokeWidth="1.2" />
      <path d="M4 6.5L5.5 8L8 4.5" stroke="#C5A059" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 7H12M12 7L8 3M12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════ */
export default function Home() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const chTopRef    = useRef<HTMLDivElement>(null)
  const chBotRef    = useRef<HTMLDivElement>(null)
  const chLftRef    = useRef<HTMLDivElement>(null)
  const chRgtRef    = useRef<HTMLDivElement>(null)
  const chCtrRef    = useRef<HTMLDivElement>(null)
  const pnRefs      = useRef<(HTMLDivElement | null)[]>([])
  const ctrRef      = useRef<HTMLDivElement>(null)
  const msgsRef     = useRef<HTMLDivElement>(null)
  const stmtBgRef   = useRef<HTMLDivElement>(null)
  const mcRefs      = useRef<(HTMLDivElement | null)[]>([])

  const [activeStep, setActiveStep] = useState(0)

  /* ── Crosshair cursor ── */
  useEffect(() => {
    let mx = 0, my = 0, hovered = false
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', onMove)
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => { hovered = true })
      el.addEventListener('mouseleave', () => { hovered = false })
    })
    let raf: number
    const tick = () => {
      const [top, bot, lft, rgt, ctr] = [chTopRef.current, chBotRef.current, chLftRef.current, chRgtRef.current, chCtrRef.current]
      if (top && bot && lft && rgt && ctr) {
        const vU = hovered ? 8 : 14, vD = hovered ? 14 : 22, h = hovered ? 6 : 10
        ctr.style.transform = `translate(${mx - 1.5}px,${my - 1.5}px)`
        top.style.transform = `translate(${mx - .25}px,${my - vU - 2}px)`; top.style.height = `${vU}px`
        bot.style.transform = `translate(${mx - .25}px,${my + 3}px)`;      bot.style.height = `${vD}px`
        lft.style.transform = `translate(${mx - h - 2}px,${my - .25}px)`;  lft.style.width  = `${h}px`
        rgt.style.transform = `translate(${mx + 3}px,${my - .25}px)`;      rgt.style.width  = `${h}px`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  /* ── Particle field ── */
  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return
    const ctx = cvs.getContext('2d')!
    let W = window.innerWidth, H = window.innerHeight
    cvs.width = W; cvs.height = H
    let pmx = W / 2, pmy = H / 2
    const onMouse = (e: MouseEvent) => { pmx = e.clientX; pmy = e.clientY }
    document.addEventListener('mousemove', onMouse)
    const pts = Array.from({ length: 52 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.1 + .35,   o: Math.random() * .3 + .08,
    }))
    let raf: number
    const frame = () => {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        const dx = pmx - p.x, dy = pmy - p.y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 130) { const f = (130 - d) / 130; p.vx -= (dx / d) * f * .45; p.vy -= (dy / d) * f * .45 }
        p.vx *= .978; p.vy *= .978; p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(197,160,89,${p.o})`; ctx.fill()
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const onResize = () => { W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize) }
  }, [])

  /* ── GSAP ── */
  useEffect(() => {
    const init = async () => {
      const { default: gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      gsap.timeline({ delay: .3 })
        .to('.hero-eyebrow', { opacity: 1, y: 0, duration: .7,  ease: 'power3.out' })
        .to('.hero-h1',      { opacity: 1, y: 0, duration: .8,  ease: 'power3.out' }, '-=.4')
        .to('.hero-sub',     { opacity: 1, y: 0, duration: .7,  ease: 'power3.out' }, '-=.5')
        .to('.btn-cta-hero', { opacity: 1, y: 0, duration: .6,  ease: 'power3.out' }, '-=.4')
        .to('.hero-stats',   { opacity: 1, y: 0, duration: .6,  ease: 'power3.out' }, '-=.35')
      gsap.utils.toArray<Element>('.reveal').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 83%' } })
      })
      gsap.utils.toArray<Element>('.sec-entry').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .75, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } })
      })
      const sbg = stmtBgRef.current
      if (sbg) window.addEventListener('scroll', () => { sbg.style.transform = `translateY(-50%) translateX(${-scrollY * .12}px)` }, { passive: true })
      let si: ReturnType<typeof setInterval>, cur = 0
      ScrollTrigger.create({
        trigger: '#mechanism', start: 'top 65%',
        onEnter:     () => { si = setInterval(() => { cur = (cur + 1) % 5; setActiveStep(cur) }, 3000) },
        onLeave:     () => clearInterval(si),
        onEnterBack: () => { si = setInterval(() => { cur = (cur + 1) % 5; setActiveStep(cur) }, 3000) },
        onLeaveBack: () => clearInterval(si),
      })
      ScrollTrigger.create({
        trigger: '#final-cta', start: 'top bottom', end: 'bottom top', scrub: 1.2,
        onUpdate: self => {
          document.querySelectorAll<HTMLElement>('.cta-ring').forEach((r, i) => {
            r.style.transform = `translate(-50%,-50%) scale(${1 + self.progress * .18 * (i + 1)})`
          })
        },
      })
    }
    init()
  }, [])

  /* ── Pix notification loop ── */
  useEffect(() => {
    let total = 0
    let outerTimeout: ReturnType<typeof setTimeout>
    const animNum = (from: number, to: number) => {
      const step = (to - from) / 22; let v = from
      const iv = setInterval(() => {
        v += step; if (Math.abs(v - to) < 1) { v = to; clearInterval(iv) }
        if (ctrRef.current) ctrRef.current.textContent = 'R$ ' + Math.round(v).toLocaleString('pt-BR')
      }, 28)
    }
    const fireLoop = async () => {
      const { default: gsap } = await import('gsap')
      pnRefs.current.forEach((n, i) => {
        setTimeout(() => {
          if (!n) return
          gsap.fromTo(n, { opacity: 0, x: 36, y: -16 }, {
            opacity: 1, x: 0, y: 0, duration: .55, ease: 'power3.out',
            onComplete: () => {
              total += PIX_AMOUNTS[i]; animNum(total - PIX_AMOUNTS[i], total)
              setTimeout(() => gsap.to(n, { opacity: 0, y: 18, duration: .45, ease: 'power2.in' }), 2000)
            },
          })
        }, i * 880 + 700)
      })
      outerTimeout = setTimeout(() => { total = 0; if (ctrRef.current) ctrRef.current.textContent = 'R$ 0'; fireLoop() }, pnRefs.current.length * 880 + 3400)
    }
    fireLoop()
    return () => clearTimeout(outerTimeout)
  }, [])

  /* ── Phone conversation ── */
  useEffect(() => {
    const run = async () => {
      const { default: gsap } = await import('gsap')
      const msgs = msgsRef.current; if (!msgs) return
      msgs.innerHTML = ''
      CONVERSATIONS[activeStep].forEach((m, j) => {
        setTimeout(() => {
          let el: HTMLElement
          if (m.t === 'pix') {
            el = document.createElement('div')
            el.className = 'pix-bbl m-2 rounded-lg p-3 bg-[rgba(197,160,89,0.09)] border border-[rgba(197,160,89,0.28)]'
            el.innerHTML = `
              <div style="font-family:var(--font-jetbrains);font-size:7px;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);margin-bottom:3px">Asaas · Pix Copia e Cola</div>
              <div style="font-family:var(--font-jetbrains);font-size:15px;font-weight:500;color:var(--gold)">${m.amt}</div>
              <div style="font-size:8px;color:var(--ash);margin-top:3px">Válido por 15 minutos · agenda travada</div>`
          } else {
            el = document.createElement('div')
            const ai = m.t === 'ai'
            el.className = 'msg'
            el.style.cssText = `max-width:84%;padding:7px 11px;border-radius:13px;font-size:10px;line-height:1.55;color:var(--linen);align-self:${ai ? 'flex-start' : 'flex-end'};background:${ai ? 'var(--ink3)' : 'rgba(197,160,89,0.13)'};border-radius:${ai ? '13px 13px 13px 3px' : '13px 13px 3px 13px'};${!ai ? 'border:0.5px solid rgba(197,160,89,0.18)' : ''}`
            el.textContent = m.s
          }
          msgs.appendChild(el)
          gsap.fromTo(el, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: .38, ease: 'power2.out' })
        }, j * 680)
      })
    }
    run()
  }, [activeStep])

  /* ── Metric cards 3D hover ── */
  useEffect(() => {
    type H = { el: HTMLDivElement; mm: (e: MouseEvent) => void; ml: () => void }
    const hs: H[] = []
    mcRefs.current.filter(Boolean).forEach(c => {
      const el = c as HTMLDivElement
      const mm = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        el.style.transform = `translateY(-2px) perspective(500px) rotateX(${-((e.clientY - r.top) / r.height - .5) * 9}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 9}deg)`
      }
      const ml = () => { el.style.transform = 'translateY(0) perspective(500px) rotateX(0) rotateY(0)' }
      el.addEventListener('mousemove', mm); el.addEventListener('mouseleave', ml)
      hs.push({ el, mm, ml })
    })
    return () => hs.forEach(({ el, mm, ml }) => { el.removeEventListener('mousemove', mm); el.removeEventListener('mouseleave', ml) })
  }, [])

  /* ── Render ── */
  return (
    <div className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} min-h-screen bg-[#0E0C0A] text-[#F5F0E8] overflow-x-hidden`}
         style={{ fontFamily: 'var(--font-instrument, sans-serif)', WebkitFontSmoothing: 'antialiased' }}>

      {/* Crosshair */}
      <div ref={chTopRef} className="ch ch-v" />
      <div ref={chBotRef} className="ch ch-v" />
      <div ref={chLftRef} className="ch ch-h" />
      <div ref={chRgtRef} className="ch ch-h" />
      <div ref={chCtrRef} className="ch-center" />

      {/* Particles */}
      <canvas ref={canvasRef} id="particles" />

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 border-b border-[rgba(156,142,130,0.18)] bg-[rgba(14,12,10,0.88)] backdrop-blur-lg">
        <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-.01em' }}>
          Syme<em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C5A059' }}>tra</em>
        </div>
        <nav className="flex items-center gap-9">
          {['#mechanism:Como funciona', '#proof:Dashboard', '#agency:Agências'].map(item => {
            const [href, label] = item.split(':')
            return <a key={href} href={href} className="text-xs text-[#9C8E82] hover:text-[#F5F0E8] transition-colors no-underline tracking-wide">{label}</a>
          })}
          <a href={WA_ACCESS} target="_blank" rel="noopener noreferrer"
             className="text-[11px] font-medium tracking-wider px-5 py-2 rounded-sm no-underline transition-all hover:opacity-85 hover:-translate-y-px"
             style={{ color: '#0E0C0A', background: '#C5A059' }}>
            Solicitar acesso
          </a>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="relative z-10 min-h-screen grid grid-cols-2 items-center gap-16 px-12 pt-32 pb-20">
        <div className="max-w-xl">
          <div className="hero-eyebrow flex items-center gap-2.5 mb-8">
            <span className="w-5 h-px" style={{ background: 'rgba(197,160,89,.5)' }} />
            <span className="text-[9px] tracking-[.2em] uppercase" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(197,160,89,.65)' }}>
              Infraestrutura de conversão high-ticket
            </span>
          </div>

          <h1 className="hero-h1 text-[clamp(3rem,4.8vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.025em] mb-6"
              style={{ fontFamily: 'var(--font-fraunces)' }}>
            O lead só entra<br />quando o{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C5A059' }}>Pix</em><br />confirma.
          </h1>

          <p className="hero-sub text-[.95rem] text-[#9C8E82] leading-[1.8] max-w-[430px] mb-10">
            A Symetra é o muro financeiro entre sua agenda e o lead sem intenção real. Serena qualifica, agenda e cobra. Você atende quem já pagou.
          </p>

          <a href={WA_ACCESS} target="_blank" rel="noopener noreferrer"
             className="btn-cta-hero inline-flex items-center gap-2.5 text-[13px] font-medium tracking-wide px-8 py-3.5 rounded-sm no-underline transition-all hover:-translate-y-0.5"
             style={{ color: '#0E0C0A', background: '#C5A059' }}>
            Solicitar acesso restrito <ArrowIcon />
          </a>

          <div className="hero-stats flex gap-10 mt-10 pt-8 border-t border-[rgba(156,142,130,0.18)]">
            {[['R$ 0', 'em no-shows pós-Pix'], ['15 min', 'trava atômica'], ['100%', 'multi-tenant LGPD']].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="text-[1.1rem] font-medium text-[#C5A059]" style={{ fontFamily: 'var(--font-jetbrains)' }}>{val}</div>
                <div className="text-[10px] text-[#9C8E82] mt-0.5 tracking-wide">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pix stack */}
        <div className="hero-right relative h-[540px] flex items-center justify-center">
          {PIX_LABELS.map((amt, i) => (
            <div key={i} ref={el => { pnRefs.current[i] = el }}
                 className="pn bg-[#1A1714] rounded-[10px] p-3 flex items-center gap-2.5 min-w-[220px]"
                 style={{ border: '.5px solid rgba(197,160,89,.22)', boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(197,160,89,.12)' }}>
                <CheckCircleIcon />
              </div>
              <div>
                <div className="text-[8px] tracking-[.1em] uppercase text-[#9C8E82]" style={{ fontFamily: 'var(--font-jetbrains)' }}>Asaas · Pix recebido</div>
                <div className="text-[12px] font-medium text-[#C5A059] mt-0.5" style={{ fontFamily: 'var(--font-jetbrains)' }}>{amt}</div>
              </div>
            </div>
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] bg-[#1A1714] rounded-2xl px-10 py-8 text-center min-w-[240px] z-20"
               style={{ border: '.5px solid rgba(156,142,130,.18)' }}>
            <div className="text-[9px] tracking-[.18em] uppercase text-[#9C8E82] mb-2" style={{ fontFamily: 'var(--font-jetbrains)' }}>VRC · Hoje</div>
            <div ref={ctrRef} className="text-[2.6rem] font-medium text-[#C5A059] leading-none" style={{ fontFamily: 'var(--font-jetbrains)', letterSpacing: '-.02em' }}>R$ 0</div>
            <div className="text-[10px] text-[#9C8E82] mt-1.5">Pix de reserva confirmados</div>
          </div>
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section id="statement" className="relative z-10 min-h-[80vh] flex items-center justify-center px-12 py-32 overflow-hidden">
        <div ref={stmtBgRef} className="stmt-bg text-[clamp(7rem,16vw,15rem)] font-bold tracking-tight"
             style={{ fontFamily: 'var(--font-fraunces)', color: 'rgba(197,160,89,.025)' }}>
          NO-SHOW
        </div>
        <div className="relative text-center max-w-[860px]">
          <p className="reveal text-[clamp(1.8rem,3.2vw,2.8rem)] font-light italic leading-[1.4] tracking-tight mb-6"
             style={{ fontFamily: 'var(--font-fraunces)' }}>
            "Cada lead sem sinal financeiro é uma{' '}
            <em style={{ fontStyle: 'normal', fontWeight: 700, color: '#C5A059' }}>aposta</em>{' '}
            com o tempo da sua especialista."
          </p>
          <div className="reveal w-10 h-px mx-auto my-6" style={{ background: 'rgba(197,160,89,.3)' }} />
          <div className="reveal text-[#9C8E82]" style={{ fontFamily: 'var(--font-jetbrains)', letterSpacing: '.04em' }}>
            Ticket médio de harmonização high-ticket
            <strong className="block font-medium text-[#C5A059] my-1" style={{ fontSize: 'clamp(1.4rem,2.8vw,2.2rem)' }}>R$ 3.200</strong>
            <span style={{ color: 'rgba(245,240,232,.5)', fontSize: '.85em' }}>4 no-shows por mês = R$ 12.800 evaporados</span>
            <span className="block mt-2" style={{ fontSize: '.72em', color: 'rgba(156,142,130,.65)' }}>R$ 153.600 / ano que a Symetra elimina.</span>
          </div>
        </div>
      </section>

      {/* ── MECHANISM ── */}
      <section id="mechanism" className="relative z-10 px-12 py-32 max-w-[1160px] mx-auto">
        <div className="sec-lbl sec-entry flex items-center gap-3 mb-16">
          <span className="w-7 h-px" style={{ background: 'rgba(197,160,89,.4)' }} />
          <span className="text-[9px] tracking-[.2em] uppercase text-[#9C8E82]" style={{ fontFamily: 'var(--font-jetbrains)' }}>O fluxo Symetra</span>
        </div>
        <div className="sec-entry grid grid-cols-2 gap-20 items-center">
          <div className="flex flex-col">
            {STEPS.map((s, i) => (
              <div key={i} onClick={() => setActiveStep(i)}
                   className={`flex gap-6 py-5 border-b border-[rgba(156,142,130,0.18)] first:border-t first:border-[rgba(156,142,130,0.18)] transition-opacity duration-300 ${activeStep === i ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}>
                <span className="text-[9px] text-[#C5A059] tracking-[.1em] pt-0.5 flex-shrink-0 opacity-70" style={{ fontFamily: 'var(--font-jetbrains)' }}>{s.n}</span>
                <div>
                  <div className="text-sm font-medium text-[#F5F0E8] mb-1">{s.title}</div>
                  <div className="text-xs text-[#9C8E82] leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-[255px] bg-[#1A1714] rounded-[30px] overflow-hidden"
                 style={{ border: '.5px solid rgba(156,142,130,.18)', boxShadow: '0 40px 80px -20px rgba(0,0,0,.65), inset 0 0 0 .5px rgba(255,255,255,.04)' }}>
              <div className="h-11 bg-[#242018] flex items-center px-4 gap-2 border-b border-[rgba(156,142,130,.18)]">
                <div className="w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-semibold text-[#C5A059]" style={{ background: 'rgba(197,160,89,.12)' }}>S</div>
                <div>
                  <div className="text-[10px] font-medium text-[#F5F0E8]">Serena · Clínica Dra. Ana</div>
                  <div className="text-[8px]" style={{ color: 'rgba(197,160,89,.6)' }}>● online</div>
                </div>
              </div>
              <div ref={msgsRef} className="p-3.5 flex flex-col gap-1.5 min-h-[440px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <section id="proof" className="relative z-10 px-12 py-32">
        <div className="max-w-[1160px] mx-auto mb-14 flex items-end justify-between reveal">
          <h2 className="text-[clamp(2.2rem,3.8vw,3.2rem)] font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-fraunces)' }}>
            O que a secretária vê<br />quando o{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C5A059' }}>Pix</em> cai.
          </h2>
          <p className="text-xs text-[#9C8E82] max-w-[260px] text-right leading-relaxed">Contexto completo, SLA visível, zero pergunta repetida.</p>
        </div>

        <div className="max-w-[1160px] mx-auto bg-[#1A1714] rounded-2xl overflow-hidden reveal"
             style={{ border: '.5px solid rgba(156,142,130,.18)', boxShadow: '0 60px 120px -30px rgba(0,0,0,.55)' }}>
          <div className="h-11 bg-[#242018] border-b border-[rgba(156,142,130,.18)] flex items-center px-5 gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,95,87,.55)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,189,46,.55)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[rgba(39,201,63,.55)]" />
            <span className="mx-auto px-4 py-0.5 rounded text-[9px] text-[#9C8E82] tracking-wide"
                  style={{ fontFamily: 'var(--font-jetbrains)', background: 'rgba(255,255,255,.04)', border: '.5px solid rgba(156,142,130,.18)' }}>
              app.symetra.com.br/dashboard
            </span>
          </div>
          <div className="grid grid-cols-[210px_1fr] min-h-[480px]">
            <div className="bg-[#242018] border-r border-[rgba(156,142,130,.18)] p-5">
              <div className="text-[.9rem] font-bold mb-6 pb-4 border-b border-[rgba(156,142,130,.18)]" style={{ fontFamily: 'var(--font-fraunces)' }}>
                Syme<em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C5A059' }}>tra</em>
              </div>
              {['Visão geral', 'Conversas', 'Agenda', 'Métricas', 'Config.'].map((label, i) => (
                <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-[11px] transition-colors ${i === 0 ? 'text-[#C5A059]' : 'text-[#9C8E82] hover:text-[#F5F0E8]'}`}
                     style={i === 0 ? { background: 'rgba(197,160,89,.12)' } : {}}>
                  {label}
                </div>
              ))}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-2.5 mb-5">
                {[
                  { lbl: 'VRC Hoje',  val: 'R$ 2.100', gold: true,  d: '↑ 7 reservas' },
                  { lbl: 'Conversão', val: '68%',       gold: false, d: '↑ leads → PAID' },
                  { lbl: 'No-shows',  val: '0',         gold: false, d: 'com Pix pago' },
                  { lbl: 'SLA médio', val: '3:42',      gold: false, d: 'min até handoff' },
                ].map((m, i) => (
                  <div key={i} ref={el => { mcRefs.current[i] = el }}
                       className="mc bg-[#242018] rounded-lg px-4 py-3.5" style={{ border: '.5px solid rgba(156,142,130,.18)' }}>
                    <div className="text-[9px] uppercase tracking-wider text-[#9C8E82] mb-1">{m.lbl}</div>
                    <div className="text-[1.35rem] font-medium leading-none" style={{ fontFamily: 'var(--font-jetbrains)', letterSpacing: '-.02em', color: m.gold ? '#C5A059' : '#F5F0E8' }}>{m.val}</div>
                    <div className="text-[9px] mt-1" style={{ color: m.lbl === 'No-shows' ? 'rgba(197,160,89,.6)' : 'rgba(39,201,63,.75)' }}>{m.d}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#242018] rounded-lg overflow-hidden" style={{ border: '.5px solid rgba(156,142,130,.18)' }}>
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-4 py-2 border-b border-[rgba(156,142,130,.18)]">
                  {['Paciente', 'Procedimento', 'Status', 'Valor', 'SLA'].map(h => (
                    <span key={h} className="text-[9px] uppercase tracking-wider text-[#9C8E82]">{h}</span>
                  ))}
                </div>
                {[
                  { name: 'Maria F. Silva', proc: 'Harmonização labial', status: 'PAID',    val: 'R$ 150', sla: '⏱ 02:14', urgent: true  },
                  { name: 'Juliana Moraes', proc: 'Preenchimento malar',  status: 'PAID',    val: 'R$ 200', sla: 'Handoff ✓', urgent: false },
                  { name: 'Camila Souza',   proc: 'Botox preventivo',     status: 'PENDING', val: '—',      sla: '11:42 restam', urgent: false },
                  { name: 'Ana Beatriz L.', proc: 'Bioestimulador',       status: 'PAID',    val: 'R$ 120', sla: 'Handoff ✓', urgent: false },
                ].map((r, i) => (
                  <div key={i} className="dash-tr grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-4 py-2 items-center border-b border-[rgba(156,142,130,.05)] last:border-b-0">
                    <span className="text-[11px] text-[#F5F0E8]">{r.name}</span>
                    <span className="text-[11px] text-[#F5F0E8]">{r.proc}</span>
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit"
                          style={{ fontFamily: 'var(--font-jetbrains)', ...(r.status === 'PAID' ? { background: 'rgba(197,160,89,.12)', color: '#C5A059', border: '.5px solid rgba(197,160,89,.2)' } : { background: 'rgba(156,142,130,.1)', color: '#9C8E82', border: '.5px solid rgba(156,142,130,.18)' }) }}>
                      {r.status}
                    </span>
                    <span className="text-[10px] text-[#F5F0E8]" style={{ fontFamily: 'var(--font-jetbrains)' }}>{r.val}</span>
                    <span className="text-[9px]" style={{ fontFamily: 'var(--font-jetbrains)', color: r.urgent ? '#D97706' : '#9C8E82' }}>{r.sla}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENCY ── */}
      <section id="agency" className="relative z-10 px-12 py-32 bg-[#F5F0E8]">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 gap-24 items-center">
          <div className="reveal">
            <div className="text-[9px] tracking-[.2em] uppercase mb-5" style={{ fontFamily: 'var(--font-jetbrains)', color: '#A8854A' }}>
              Programa de parceria
            </div>
            <h2 className="text-[clamp(2rem,3.2vw,2.8rem)] font-bold tracking-tight leading-[1.1] mb-5 text-[#0E0C0A]"
                style={{ fontFamily: 'var(--font-fraunces)' }}>
              Para agências que pararam<br />de vender{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#A8854A' }}>cliques.</em>
            </h2>
            <p className="text-[.9rem] leading-[1.8] mb-8" style={{ color: '#5C5249' }}>
              Entregue faturamento, não leads. A Symetra converte o tráfego que você gera em Pix confirmados na conta do cliente. RevShare automático, dashboard de agência, zero operacional.
            </p>
            <a href={WA_AGENCY} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 text-xs font-medium tracking-wide px-6 py-3 rounded-sm no-underline transition-all hover:-translate-y-px hover:opacity-90"
               style={{ color: '#F5F0E8', background: '#0E0C0A' }}>
              Consultar modelo de parceria <ArrowIcon size={11} />
            </a>
          </div>

          <div className="reveal bg-white rounded-xl p-7" style={{ border: '.5px solid #E2D9CE' }}>
            <div className="text-[10px] font-medium uppercase tracking-widest mb-5 pb-4 border-b border-[#E2D9CE]" style={{ color: '#9C8E82' }}>
              Modelo RevShare · Como funciona
            </div>
            {[
              { section: 'Precificação base', rows: [
                { lbl: 'Mensalidade fixa',    val: 'R$ 1.497 / clínica', gold: false },
                { lbl: 'Taxa por sinal pago', val: '+ R$ 10 / Pix',     gold: false },
                { lbl: 'Sinal mínimo',        val: 'R$ 100',            gold: false },
              ]},
              { section: 'RevShare por clínica inputada', rows: [
                { lbl: 'Meses 1–6 (cliff)',  val: '20% · ~R$ 299/mês', gold: true  },
                { lbl: 'Meses 7–12',         val: '10% · ~R$ 150/mês', gold: false },
                { lbl: '+13 meses (badge)',   val: '0% → 5%',           gold: false },
              ]},
              { section: 'Badges após 12 meses', rows: [
                { lbl: '0–5 clínicas',  val: '0%',   gold: false },
                { lbl: '6–15 clínicas', val: '2,5%', gold: true  },
                { lbl: '+16 clínicas',  val: '5%',   gold: true  },
              ]},
            ].map(({ section, rows }) => (
              <div key={section}>
                <div className="text-[8px] tracking-[.12em] uppercase mt-3.5 mb-1 pt-2 border-t border-[#F0EAE0]" style={{ color: '#9C8E82', fontFamily: 'var(--font-jetbrains)' }}>
                  {section}
                </div>
                {rows.map(({ lbl, val, gold }) => (
                  <div key={lbl} className="flex items-baseline justify-between py-1 text-xs">
                    <span style={{ color: '#5C5249' }}>{lbl}</span>
                    <span className="font-medium" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '12px', color: gold ? '#A8854A' : '#0E0C0A' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-[#E2D9CE] flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-[#0E0C0A]">5 clínicas · primeiros 6 meses</span>
              <span className="text-[1.3rem] font-medium" style={{ fontFamily: 'var(--font-jetbrains)', color: '#A8854A' }}>R$ 1.495/mês</span>
            </div>
            <div className="text-[9px] leading-relaxed mt-2" style={{ color: '#9C8E82' }}>
              Cada clínica tem contagem independente. Uma nova clínica reinicia o cliff de 20%, independente do tempo de parceria.
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="final-cta" className="relative z-10 min-h-[65vh] flex items-center justify-center px-12 py-32 text-center overflow-hidden">
        <div className="cta-ring" style={{ width: 640, height: 640 }} />
        <div className="cta-ring" style={{ width: 420, height: 420, borderColor: 'rgba(197,160,89,.09)' }} />
        <div className="cta-ring" style={{ width: 230, height: 230, borderColor: 'rgba(197,160,89,.13)' }} />
        <div className="reveal relative">
          <div className="mb-6 text-[8px] tracking-[.22em] uppercase" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(197,160,89,.45)' }}>
            Acesso restrito · Vagas limitadas
          </div>
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight leading-[1.05] mb-5"
              style={{ fontFamily: 'var(--font-fraunces)' }}>
            Pronto para blindar<br />sua{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#C5A059' }}>agenda?</em>
          </h2>
          <p className="text-sm text-[#9C8E82] mb-10 leading-relaxed">
            Sem compromisso. A demo é ao vivo:<br />WhatsApp → Serena → Pix → Dashboard.
          </p>
          <a href={WA_ACCESS} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-3 text-sm font-medium tracking-wide px-10 py-4 rounded no-underline transition-all hover:-translate-y-0.5"
             style={{ color: '#0E0C0A', background: '#C5A059' }}>
            Solicitar acesso à infraestrutura <ArrowIcon />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-12 py-6 flex items-center justify-between border-t border-[rgba(156,142,130,.18)]">
        <span className="text-[10px] text-[#9C8E82]">
          <span style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', color: '#F5F0E8' }}>Symetra</span> Inc. © 2026
        </span>
        <div className="flex gap-6">
          {['Termos de uso', 'Política LGPD'].map(l => (
            <a key={l} href="#" className="text-[10px] text-[#9C8E82] hover:text-[#F5F0E8] no-underline transition-colors">{l}</a>
          ))}
          <a href={WA_ACCESS} target="_blank" rel="noopener noreferrer"
             className="text-[10px] text-[#9C8E82] hover:text-[#F5F0E8] no-underline transition-colors">Contato</a>
        </div>
      </footer>
    </div>
  )
}