import { ArrowUpRight, DollarSign, Activity, ListFilter } from "lucide-react";
import { Inter } from "next/font/google";
import { getClinicMetrics } from "./actions"; // Importa a action

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default async function ClinicDashboard() {
  // O Next.js resolve a action direto no servidor antes de renderizar
  const metrics = await getClinicMetrics();

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${inter.className}`}>
      {/* ... Header igual ... */}
      
      {/* WIDGETS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* WIDGET 1: Receita Retida */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A38A5E] opacity-[0.03] rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717A] uppercase tracking-wider">Receita Retida (Pix)</h3>
            <DollarSign className="w-4 h-4 text-[#A38A5E]" />
          </div>
          <div className="flex items-baseline gap-2">
            {/* Variavel real aqui */}
            <span className="text-4xl font-bold text-[#FAFAFA] tracking-tighter">
              R$ {metrics.retainedRevenue.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-2">Sinal de garantia retido.</p>
        </div>

        {/* WIDGET 2: Agendamentos */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717A] uppercase tracking-wider">Agendamentos</h3>
            <Activity className="w-4 h-4 text-[#71717A]" />
          </div>
          <div className="flex items-baseline gap-2">
            {/* Variaveis reais aqui */}
            <span className="text-4xl font-bold text-[#FAFAFA] tracking-tighter">{metrics.paidAppointments}</span>
            <span className="text-xs text-[#71717A] font-medium">/ {metrics.totalLeads} Leads</span>
          </div>
          <p className="text-xs text-[#71717A] mt-2">Taxa de conversão: {metrics.conversionRate}%</p>
        </div>

        {/* WIDGET 3: Faltas Evitadas */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#71717A] uppercase tracking-wider">No-Shows Evitados</h3>
            <ListFilter className="w-4 h-4 text-[#71717A]" />
          </div>
          <div className="flex items-baseline gap-2">
            {/* Variavel real aqui */}
            <span className="text-4xl font-bold text-[#FAFAFA] tracking-tighter">{metrics.canceledAppointments}</span>
          </div>
          <p className="text-xs text-[#71717A] mt-2">Curiosos barrados pela Serena.</p>
        </div>
      </div>
      
      {/* FEED DA SERENA E GRÁFICO (Layout Dividido) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Conversão (Placeholder Brutalista para o MVP) */}
        <div className="lg:col-span-2 p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A]">
          <h3 className="text-sm font-medium text-[#FAFAFA] uppercase tracking-wider mb-6">Status de Conversão (Leads vs Pagos)</h3>
          <div className="h-64 w-full border-b border-l border-[#71717A]/20 relative flex items-end px-2 gap-4 pb-2">
            {/* Barras simulando dados reais em Brushed Gold e Zinc */}
            {[40, 65, 30, 85, 50, 95, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 group">
                <div 
                  className="w-full bg-[#A38A5E] hover:bg-[#A38A5E]/80 transition-all rounded-t-sm" 
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-[#71717A] mt-2">0{i + 1}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* O Feed da Serena (Log de Eventos) */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-[#FAFAFA] uppercase tracking-wider">Feed da Serena</h3>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {/* Item do Log */}
            <div className="flex gap-3 text-sm">
              <span className="text-[#71717A] font-mono text-xs mt-0.5">[22:04]</span>
              <div>
                <p className="text-[#FAFAFA] font-medium">Agendamento Confirmado</p>
                <p className="text-[#71717A] text-xs">Preenchimento Labial • R$ 100,00</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <span className="text-[#71717A] font-mono text-xs mt-0.5">[21:15]</span>
              <div>
                <p className="text-[#FAFAFA] font-medium">Pix Gerado</p>
                <p className="text-[#71717A] text-xs">Harmonização Facial • Aguardando Pagamento</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm opacity-60">
              <span className="text-[#71717A] font-mono text-xs mt-0.5">[19:30]</span>
              <div>
                <p className="text-[#FAFAFA] font-medium line-through">Curioso Bloqueado</p>
                <p className="text-[#71717A] text-xs">Recusou pagamento de sinal.</p>
              </div>
            </div>
            
            <div className="flex gap-3 text-sm">
              <span className="text-[#71717A] font-mono text-xs mt-0.5">[18:45]</span>
              <div>
                <p className="text-[#FAFAFA] font-medium">Agendamento Confirmado</p>
                <p className="text-[#71717A] text-xs">Fios de PDO • R$ 100,00</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}