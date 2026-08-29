import { ShieldCheck, Trophy, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { getAgencyMetrics } from "./actions";
import { getAgencyClinics, type AgencyClinicResponse } from "@/lib/api";

export default async function Page() {
  return <AgencyDashboard />;
}

export async function AgencyDashboard() {
  const [metrics, agencyClinics] = await Promise.all([
    getAgencyMetrics(),
    getAgencyClinics().catch((): AgencyClinicResponse[] => []),
  ]);

  const planLabels: Record<string, string> = {
    STARTER: "Starter · R$1.497",
    GROWTH:  "Growth · R$1.997",
    SCALE:   "Scale · R$2.997",
  };

  const phaseConfig = {
    1: { label: "Fase 1 · 20%",  cls: "bg-[rgba(52,120,80,0.08)] text-[#2D6A4F] border-[rgba(52,120,80,0.15)]" },
    2: { label: "Fase 2 · 10%",  cls: "bg-[rgba(197,160,89,0.12)] text-gold border-[rgba(197,160,89,0.20)]" },
    3: { label: "Fase 3",        cls: "bg-[rgba(156,142,130,0.10)] text-ash border-[rgba(156,142,130,0.18)]" },
  };

  return (
    <div className="max-w-[1160px] mx-auto space-y-8">

      {/* ── Heading ──────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between border-b border-[rgba(156,142,130,0.12)] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-[28px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
            <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
              Portal do Operador
            </span>
          </div>
          <h1 className="font-display font-bold text-linen text-[2rem] tracking-[-0.025em] leading-none">
            Carteira de Clínicas
          </h1>
          <p className="font-ui text-[12px] text-ash mt-1.5">
            Gestão de carteira, homologação e repasses (Cliff Protocol).
          </p>
        </div>
        <div className="text-right">
          <p className="font-data text-[9px] text-ash tracking-[0.15em] uppercase mb-1.5">
            Margem Retida (Mês)
          </p>
          <p className="font-data font-medium text-[2rem] text-gold leading-none">
            R$ {metrics.agencyMargin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Setup wizard ─────────────────────────────────────────────────────── */}
      {!metrics.isSetupComplete && (
        <div className="p-5 border-[0.5px] border-[rgba(180,83,9,0.25)] bg-[rgba(180,83,9,0.04)] rounded-[12px] flex items-start gap-4">
          <AlertTriangle className="w-4 h-4 text-[#92400E] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-ui text-[12px] font-semibold text-[#92400E] uppercase tracking-wider mb-1">
              Homologação Pendente
            </h3>
            <p className="font-ui text-[12px] text-ash mb-4">
              A infraestrutura de algumas clínicas não pode ser ativada até a conclusão do setup.
            </p>
            <div className="flex gap-6 font-ui text-[12px]">
              <div className={`flex items-center gap-2 font-medium ${metrics.missingAsaas ? "text-[#92400E]" : "text-[#2D6A4F]"}`}>
                {metrics.missingAsaas
                  ? <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />
                }
                Webhook Asaas
              </div>
              <div className={`flex items-center gap-2 font-medium ${metrics.missingMeta ? "text-[#92400E]" : "text-[#2D6A4F]"}`}>
                {metrics.missingMeta
                  ? <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />
                }
                Token Meta WhatsApp
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-gold text-ink font-ui text-[12px] font-medium rounded-[3px] hover:-translate-y-px hover:shadow-[0_14px_32px_-8px_rgba(197,160,89,0.42)] transition-all duration-200">
            Finalizar Setup
          </button>
        </div>
      )}

      {/* ── Tier + Saúde ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Progressão de Tier */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase">Progressão de Tier</p>
            <Trophy className="w-3.5 h-3.5 text-gold" />
          </div>
          <div>
            <div className="flex justify-between font-data text-[10px] mb-2">
              <span className="text-gold">{metrics.tier} (atual)</span>
              <span className="text-ash">Gold · 16+ · 5%</span>
            </div>
            <div className="w-full h-[3px] bg-ink3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-700"
                style={{ width: `${metrics.tierProgress}%` }}
              />
            </div>
            <p className="font-ui text-[11px] text-ash mt-3">
              <span className="font-medium text-linen">{metrics.activeClinicsCount}</span> clínicas ativas.{" "}
              Faltam <span className="font-medium text-linen">{metrics.clinicsToGold}</span> para o Gold.
              {metrics.tier === "Certified" && (
                <span className="text-[#92400E]"> Silver começa em 6 (2,5%).</span>
              )}
              {metrics.tier === "Silver" && (
                <span className="text-gold"> Gold começa em 16 (5%).</span>
              )}
            </p>
          </div>
        </div>

        {/* Saúde da Carteira */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase">Saúde da Carteira</p>
            <ShieldCheck className="w-3.5 h-3.5 text-ash" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-data font-medium text-[2.2rem] text-linen leading-none">
                {metrics.totalLeads}
              </p>
              <p className="font-data text-[9px] text-ash tracking-[0.15em] uppercase mt-2">
                Leads Processados
              </p>
            </div>
            <div>
              <p className="font-data font-medium text-[2.2rem] text-gold leading-none">
                {metrics.totalPaidAppointments}
              </p>
              <p className="font-data text-[9px] text-ash tracking-[0.15em] uppercase mt-2">
                Pix Liquidados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carteira de Clínicas ──────────────────────────────────────────────── */}
      <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(156,142,130,0.12)] flex items-center gap-2.5">
          <div className="w-[22px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
          <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
            Cliff de Repasse
          </span>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(156,142,130,0.12)]">
              {["Clínica", "Plano", "Fase do Cliff", "Leads", "Pix", "RevShare Mensal Est."].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 font-data text-[9px] text-ash tracking-[0.15em] uppercase whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agencyClinics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="font-data text-[10px] text-ash tracking-[0.1em] uppercase">
                    Nenhuma clínica cadastrada nesta agência
                  </p>
                </td>
              </tr>
            ) : (
              agencyClinics.map((clinic) => {
                const phase = phaseConfig[clinic.cliffPhase as 1 | 2 | 3];
                const phaseLabel = clinic.cliffPhase === 3
                  ? `Fase 3 · ${(clinic.cliffRate * 100).toFixed(1)}%`
                  : phase.label;

                return (
                  <tr
                    key={clinic.id}
                    className="border-b border-[rgba(156,142,130,0.07)] last:border-0 hover:bg-[rgba(156,142,130,0.03)] transition-colors"
                  >
                    <td className="px-5 py-4 font-ui text-[13px] font-medium text-linen">{clinic.name}</td>
                    <td className="px-5 py-4 font-data text-[10px] text-ash">{planLabels[clinic.plan]}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-[3px] text-[8px] font-data tracking-[0.08em] uppercase border rounded-full ${phase.cls}`}>
                        {phaseLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-data text-[12px] text-ash">{clinic.totalLeads}</td>
                    <td className="px-5 py-4 font-data text-[12px] text-linen">{clinic.totalPaid}</td>
                    <td className="px-5 py-4 font-data font-medium text-[13px] text-gold">
                      R$ {clinic.estimatedRevShare.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
