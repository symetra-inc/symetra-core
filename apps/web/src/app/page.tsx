import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Playfair_Display, Inter } from "next/font/google";
import { ArrowRight, ShieldCheck, TrendingUp, CalendarCheck, Smartphone, CheckCircle2 } from "lucide-react";

// Fontes injetadas nativamente com zero impacto na performance
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export default function Home() {
  return (
    <div className={`min-h-screen bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#A38A5E]/30 selection:text-white ${inter.className}`}>
      
      {/* HEADER BAR (Brutalista, 1px border Zinc) */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#71717A]/30">
        <div className="flex items-center gap-3">
          {/* Logo Placeholder (Substitua por <Image /> depois) */}
          <div className="w-8 h-8 border border-[#71717A] rounded-sm flex items-center justify-center bg-[#0A0A0A]">
            <span className={`text-[#FAFAFA] font-bold text-xl leading-none ${playfair.className}`}>S</span>
          </div>
          <span className="font-semibold tracking-widest text-sm uppercase text-[#FAFAFA]">Symetra</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="text-[#71717A] hover:text-[#FAFAFA] hover:bg-transparent rounded-sm text-sm tracking-wide">
            Acesso Restrito
          </Button>
        </Link>
      </header>

      {/* SEC 1: HERO (O Impacto) */}
      <main className="flex flex-col items-center justify-center px-6 text-center pt-32 pb-24 relative overflow-hidden">
        <h1 className={`text-5xl md:text-7xl font-semibold tracking-tight mb-8 max-w-4xl text-[#FAFAFA] leading-[1.1] ${playfair.className}`}>
          O fim do lead curioso. <br className="hidden md:block" />
          <span className="text-[#71717A] italic font-normal">A era do agendamento liquidado.</span>
        </h1>
        
        <p className="text-lg text-[#71717A] max-w-2xl mb-12 leading-relaxed font-light">
          Infraestrutura de triagem e reserva para clínicas de alto padrão. Serena, nossa concierge digital, qualifica, agenda e cobra o sinal. O transbordo humano agora só acontece após o pagamento confirmado.
        </p>

        <Link href="/login">
          <Button className="bg-[#A38A5E] hover:bg-[#A38A5E]/80 text-[#FAFAFA] rounded-sm h-14 px-10 text-base font-medium shadow-[0_4px_14px_0_rgba(163,138,94,0.39)] transition-all">
            Solicitar Acesso à Infraestrutura <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>

        {/* MOCKUP CONCEITUAL (Wireframe Brutalista) */}
        <div className="mt-24 relative w-full max-w-3xl aspect-[16/9] border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#71717A10_1px,transparent_1px),linear-gradient(to_bottom,#71717A10_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Celular Fake */}
            <div className="w-64 h-80 border border-[#71717A]/50 rounded-md bg-[#0A0A0A] shadow-2xl p-4 flex flex-col justify-end">
              <div className="w-3/4 p-3 rounded-sm bg-[#FAFAFA] text-[#0A0A0A] text-xs mb-3 self-end">
                Posso gerar o código Pix para prosseguirmos?
              </div>
              <div className="w-1/2 p-3 rounded-sm border border-[#71717A]/50 text-[#FAFAFA] text-xs self-start">
                Sim, por favor.
              </div>
            </div>
            
            {/* Notificação Pix (Brushed Gold) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#A38A5E] text-[#FAFAFA] p-4 rounded-sm shadow-[0_20px_40px_-15px_rgba(163,138,94,0.5)] flex items-center gap-4 w-72 border border-[#A38A5E]/50">
              <CheckCircle2 className="w-6 h-6" />
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Asaas • Agora</p>
                <p className="text-sm font-medium">Pix Recebido: R$ 100,00</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SEC 2: A MATEMÁTICA DA AUTORIDADE */}
      <section className="border-y border-[#71717A]/30 bg-[#0A0A0A] py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-[#71717A]/30">
          <div className="flex flex-col gap-4 md:pr-12 pt-8 md:pt-0">
            <CalendarCheck className="w-8 h-8 text-[#A38A5E]" strokeWidth={1.5} />
            <h3 className={`text-2xl text-[#FAFAFA] ${playfair.className}`}>0% de No-Show</h3>
            <p className="text-[#71717A] text-sm leading-relaxed font-light">
              O compromisso financeiro precede a agenda. Bloqueamos curiosos e garantimos que apenas pacientes investidos ocupem o tempo do seu especialista.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:px-12 pt-8 md:pt-0">
            <ShieldCheck className="w-8 h-8 text-[#A38A5E]" strokeWidth={1.5} />
            <h3 className={`text-2xl text-[#FAFAFA] ${playfair.className}`}>Filtragem Rígida</h3>
            <p className="text-[#71717A] text-sm leading-relaxed font-light">
              Extração automática de anamnese inicial via IA. A qualificação dos dados é feita com precisão clínica, sem espaço para negociações informais.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:pl-12 pt-8 md:pt-0">
            <TrendingUp className="w-8 h-8 text-[#A38A5E]" strokeWidth={1.5} />
            <h3 className={`text-2xl text-[#FAFAFA] ${playfair.className}`}>Liquidez Imediata</h3>
            <p className="text-[#71717A] text-sm leading-relaxed font-light">
              Receba o sinal na sua conta Asaas antes mesmo da secretária abrir o chat. A venda acontece de forma silenciosa e eficiente.
            </p>
          </div>
        </div>
      </section>

      {/* SEC 3: O FLUXO SYMETRA */}
      <section className="py-32 px-6 max-w-4xl mx-auto">
        <h2 className={`text-4xl md:text-5xl text-center mb-20 text-[#FAFAFA] ${playfair.className}`}>
          O Processo de Triagem <span className="text-[#A38A5E] italic">Aristocrático</span>.
        </h2>
        
        <div className="space-y-8">
          {[
            { step: "01", title: "Atendimento", desc: "A Serena recebe o lead do tráfego pago com etiqueta e precisão cirúrgica." },
            { step: "02", title: "Qualificação", desc: "Dados rígidos são extraídos e validados. Curiosos são educadamente filtrados." },
            { step: "03", title: "Reserva", desc: "O horário é selecionado na agenda da clínica em tempo real." },
            { step: "04", title: "Liquidação", desc: "Geração de Pix de reserva (R$ 100+). Sem pagamento, sem agenda." },
            { step: "05", title: "Transbordo", desc: "Apenas o paciente pagante chega ao CRM da sua secretária humana." }
          ].map((item, i) => (
            <div key={i} className="flex gap-6 items-start p-6 border border-[#71717A]/20 rounded-sm bg-[#FAFAFA]/[0.02] hover:bg-[#FAFAFA]/[0.04] transition-colors">
              <span className={`text-[#A38A5E] text-2xl font-semibold ${playfair.className}`}>{item.step}</span>
              <div>
                <h4 className="text-lg text-[#FAFAFA] font-medium mb-1">{item.title}</h4>
                <p className="text-[#71717A] text-sm font-light">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 4: PARA AGÊNCIAS */}
      <section className="bg-[#FAFAFA] text-[#0A0A0A] py-24 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${playfair.className}`}>
            Proteja o ROI do seu cliente.
          </h2>
          <p className="text-[#71717A] text-lg max-w-2xl mb-10 leading-relaxed">
            Pare de entregar "leads" e comece a entregar faturamento. A Symetra elimina o gargalo comercial das clínicas, garantindo que o investimento em tráfego se transforme em dinheiro no caixa, não em conversas infinitas no WhatsApp.
          </p>
          <Button variant="outline" className="border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAFA] rounded-sm h-12 px-8 font-medium">
            Consultar Modelo de RevShare
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-[#71717A]/30 flex flex-col md:flex-row items-center justify-between text-xs text-[#71717A] max-w-6xl mx-auto w-full">
        <div className="mb-4 md:mb-0">
          <span className="font-semibold text-[#FAFAFA] uppercase tracking-widest mr-2">Symetra Inc.</span>
          © 2026. Todos os direitos reservados.
        </div>
        <div className="flex gap-6 items-center">
          <span>Powered by Next.js & OpenAI</span>
          <Link href="#" className="hover:text-[#FAFAFA] transition-colors">Termos e LGPD</Link>
        </div>
      </footer>
    </div>
  );
}