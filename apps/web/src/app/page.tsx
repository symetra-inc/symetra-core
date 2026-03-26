import { ShieldCheck, Database, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* SECTION 1: HERO */}
      <section className="relative flex flex-col items-center justify-center px-6 py-32 text-center border-b border-muted/20">
        <h1 className="font-serif text-5xl md:text-8xl tracking-tight mb-6 max-w-5xl">
          O fim do lead curioso. <br/>
          <span className="text-muted">A era do agendamento liquidado.</span>
        </h1>
        <p className="text-muted text-lg md:text-xl max-w-2xl mb-12">
          Infraestrutura de triagem e reserva para clínicas de alto padrão. Serena, nossa concierge digital, qualifica, agenda e cobra o sinal. O transbordo humano agora só acontece após o pagamento confirmado.
        </p>
        <button className="bg-accent text-background px-8 py-4 uppercase tracking-widest text-xs font-bold hover:brightness-110 transition-all rounded-none border border-accent">
          Solicitar Acesso à Infraestrutura
        </button>
      </section>

      {/* SECTION 2: AUTHORITY STATS */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-muted/20">
        {[
          { label: "0% de No-Show", desc: "O compromisso financeiro precede a agenda.", icon: ShieldCheck },
          { label: "Filtragem Rígida", desc: "Extração de anamnese via GPT-4o-mini.", icon: Database },
          { label: "Liquidez Imediata", desc: "Receba via Asaas antes do transbordo.", icon: Zap },
        ].map((item, i) => (
          <div key={i} className="p-12 border-b md:border-b-0 md:border-r border-muted/20 last:border-r-0 hover:bg-white/[0.02] transition-colors">
            <item.icon className="text-accent mb-6 w-8 h-8" />
            <h3 className="font-serif text-2xl mb-4">{item.label}</h3>
            <p className="text-muted leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* SECTION 3: WORKFLOW */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full border-b border-muted/20">
        <h2 className="font-serif text-4xl mb-16 tracking-tight">O Processo de Triagem Aristocrático</h2>
        <div className="space-y-12">
          {[
            { step: "01", title: "Atendimento", text: "A Serena recebe o lead do tráfego pago com etiqueta e precisão cirúrgica." },
            { step: "02", title: "Qualificação", text: "Dados rígidos extraídos. Curiosos são educadamente filtrados." },
            { step: "03", title: "Reserva", text: "Horário selecionado no Google Calendar em tempo real." },
            { step: "04", title: "Liquidação", text: "Geração de Pix de reserva (R$ 100+). Sem pagamento, sem agenda." },
            { step: "05", title: "Transbordo", text: "Apenas o paciente pagante chega ao CRM da sua secretária." },
          ].map((flow, i) => (
            <div key={i} className="flex gap-8 items-start group">
              <span className="font-mono text-accent text-lg tabular-nums pt-1">{flow.step}</span>
              <div className="border-l border-muted/20 pl-8 group-hover:border-accent transition-colors">
                <h4 className="font-bold uppercase tracking-widest text-sm mb-2">{flow.title}</h4>
                <p className="text-muted max-w-xl">{flow.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-muted font-bold tracking-tighter text-xl">SYMETRA INC.</div>
        <div className="flex gap-8 text-xs text-muted uppercase tracking-widest">
          <span>Powered by <span className="text-foreground">Next.js & OpenAI</span></span>
        </div>
      </footer>
    </main>
  );
}