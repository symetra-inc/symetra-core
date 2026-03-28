import { ShieldCheck, Trophy, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { Inter } from "next/font/google";
import { getAgencyMetrics } from "./actions";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default async function AgencyDashboard() {
  const metrics = await getAgencyMetrics();

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${inter.className}`}>
      
      {/* HEADER DA AGÊNCIA */}
      <div className="flex items-end justify-between border-b border-[#71717A]/30 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Portal do Operador</h2>
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#A38A5E] text-[#FAFAFA] rounded-sm">
              Tier {metrics.tier}
            </span>
          </div>
          <p className="text-[#71717A] text-sm">Gestão de carteira, homologação e repasses (Cliff Protocol).</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[#71717A] uppercase tracking-wider mb-1">Margem Retida (Mês)</p>
          <p className="text-2xl font-bold text-[#FAFAFA]">
            R$ {metrics.agencyMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* A TRAVA DO WIZARD: Só aparece se o setup estiver incompleto */}
      {!metrics.isSetupComplete && (
        <div className="p-5 border border-amber-500/30 bg-amber-500/5 rounded-sm flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-1">Ação Requerida: Homologação Pendente</h3>
            <p className="text-[#71717A] text-sm mb-4">
              A infraestrutura de algumas clínicas não pode ser ativada até a conclusão do setup de segurança.
            </p>
            <div className="flex gap-6 text-sm">
              <div className={`flex items-center gap-2 font-medium ${metrics.missingAsaas ? 'text-amber-500' : 'text-emerald-500'}`}>
                {metrics.missingAsaas ? <CircleDashed className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2 className="w-4 h-4" />} 
                Webhook Asaas
              </div>
              <div className={`flex items-center gap-2 font-medium ${metrics.missingMeta ? 'text-amber-500' : 'text-emerald-500'}`}>
                {metrics.missingMeta ? <CircleDashed className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2 className="w-4 h-4" />} 
                Token Meta WhatsApp
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-amber-400 transition-colors">
            Finalizar Setup
          </button>
        </div>
      )}

      {/* WIDGETS DE PROGRESSÃO (Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PROGRESSO DE TIER */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-[#FAFAFA] uppercase tracking-wider">Progressão de Tier</h3>
            <Trophy className="w-4 h-4 text-[#A38A5E]" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-[#A38A5E]">{metrics.tier} (Atual)</span>
              <span className="text-[#71717A]">Gold (16+ Clínicas)</span>
            </div>
            <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden">
              <div className="h-full bg-[#A38A5E]" style={{ width: `${metrics.tierProgress}%` }} />
            </div>
            <p className="text-xs text-[#71717A] mt-3">
              <strong className="text-[#FAFAFA]">{metrics.activeClinicsCount}</strong> clínicas ativas. Faltam <strong className="text-[#FAFAFA]">{metrics.clinicsToGold}</strong> para o Tier Gold.
            </p>
          </div>
        </div>

        {/* STATUS GERAL DA CARTEIRA */}
        <div className="p-6 border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#FAFAFA] uppercase tracking-wider">Saúde da Carteira</h3>
            <ShieldCheck className="w-4 h-4 text-[#71717A]" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{metrics.totalLeads}</p>
              <p className="text-xs text-[#71717A] uppercase tracking-wider mt-1">Leads Processados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{metrics.totalPaidAppointments}</p>
              <p className="text-xs text-[#A38A5E] uppercase tracking-wider mt-1">Pix Liquidados</p>
            </div>
          </div>
        </div>
      </div>

      {/* CLIFF DE REPASSE (Tabela Transparente do CFO) */}
      <div className="border border-[#71717A]/30 rounded-sm bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-[#71717A]/30 flex justify-between items-center bg-[#FAFAFA]/[0.02]">
          <h3 className="text-sm font-medium text-[#FAFAFA] uppercase tracking-wider">Cliff de Repasse (Symetra Protocol)</h3>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0A0A0A] text-[#71717A] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium border-b border-[#71717A]/30">Clínica</th>
              <th className="px-6 py-4 font-medium border-b border-[#71717A]/30">Tempo de Contrato</th>
              <th className="px-6 py-4 font-medium border-b border-[#71717A]/30">Status do Cliff</th>
              <th className="px-6 py-4 font-medium border-b border-[#71717A]/30 text-right">Repasse (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#71717A]/10 text-[#FAFAFA]">
            {/* Linha 1: Mês 1-6 (20%) */}
            <tr className="hover:bg-[#FAFAFA]/5 transition-colors">
              <td className="px-6 py-4 font-medium">Clínica Harmonize Plus</td>
              <td className="px-6 py-4 text-[#71717A]">Mês 03</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-sm text-xs font-medium">Fase 1 (Max)</span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-[#A38A5E]">20%</td>
            </tr>
            {/* Linha 2: Mês 7-12 (10%) */}
            <tr className="hover:bg-[#FAFAFA]/5 transition-colors">
              <td className="px-6 py-4 font-medium">Dr. Silva Odontologia Estética</td>
              <td className="px-6 py-4 text-[#71717A]">Mês 08</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-sm text-xs font-medium">Fase 2 (Decaimento)</span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-[#FAFAFA]">10%</td>
            </tr>
            {/* Linha 3: Mês 13+ (0% ou residual de Tier) */}
            <tr className="hover:bg-[#FAFAFA]/5 transition-colors opacity-60">
              <td className="px-6 py-4 font-medium">Instituto Facial</td>
              <td className="px-6 py-4 text-[#71717A]">Mês 14</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-[#71717A]/10 text-[#71717A] rounded-sm text-xs font-medium">Fase 3 (Zero Repasse)</span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-[#71717A]">0%</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}