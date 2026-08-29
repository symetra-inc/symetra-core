import { auth } from "@/auth";
import { getMetrics } from "@/lib/api";
import { getAppointments } from "./actions";
import { PixChart } from "@/components/metrics/PixChart";
import { SlaRiskBadge } from "@/components/metrics/SlaRiskBadge";
import { MetricsRefresher } from "@/components/metrics/MetricsRefresher";
import { AppointmentsTable } from "@/components/appointments/AppointmentsTable";
import type { AppointmentRow } from "@/components/appointments/AppointmentsTable";

export default async function Page() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-data text-[11px] text-ash tracking-[0.1em] uppercase">
          Sem clínica vinculada
        </p>
      </div>
    );
  }

  const [appointments, metrics] = await Promise.all([
    getAppointments(),
    getMetrics(clinicId),
  ]);

  const total = appointments.length;
  const paid  = appointments.filter((a) => a.status === "PAID").length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="max-w-[1160px] mx-auto space-y-8">
      <MetricsRefresher />

      {/* ── Heading ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-[28px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
            <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
              Visão Geral
            </span>
          </div>
          <h1 className="font-display font-bold text-linen text-[2rem] tracking-[-0.025em] leading-none">
            Painel da Clínica
          </h1>
        </div>
        <SlaRiskBadge appointments={appointments} />
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-5">
          <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase mb-4">
            Total
          </p>
          <p className="font-data font-medium text-[2.2rem] text-linen leading-none tracking-tight">
            {total}
          </p>
          <p className="font-ui text-[11px] text-ash mt-1.5">agendamentos</p>
        </div>

        {/* Pix Confirmados — gold */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(197,160,89,0.25)] rounded-[12px] p-5">
          <p className="font-data text-[9px] text-gold/60 tracking-[0.2em] uppercase mb-4">
            Pix Confirmado
          </p>
          <p className="font-data font-medium text-[2.2rem] text-gold leading-none tracking-tight">
            {paid}
          </p>
          <p className="font-ui text-[11px] text-ash mt-1.5">leads pagos</p>
        </div>

        {/* Pendentes */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-5">
          <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase mb-4">
            Aguardando Pix
          </p>
          <p className="font-data font-medium text-[2.2rem] text-linen leading-none tracking-tight">
            {pending}
          </p>
          <p className="font-ui text-[11px] text-ash mt-1.5">pendentes</p>
        </div>

        {/* Conversão */}
        <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-5">
          <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase mb-4">
            Conversão
          </p>
          <p className="font-data font-medium text-[2.2rem] text-linen leading-none tracking-tight">
            {conversionRate}%
          </p>
          <p className="font-ui text-[11px] text-ash mt-1.5">leads → pagos</p>
        </div>
      </div>

      {/* ── Métricas secundárias + Gráfico ─────────────────────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Hoje + SLA */}
          <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-5 space-y-5">
            <div>
              <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase mb-3">
                Hoje
              </p>
              <p className="font-data font-medium text-[2rem] text-linen leading-none">
                {metrics.totalToday}
              </p>
              <p className="font-ui text-[11px] text-ash mt-1">agendamentos</p>
            </div>

            <div className="pt-4 border-t border-[rgba(156,142,130,0.12)]">
              <p className="font-data text-[9px] text-ash tracking-[0.2em] uppercase mb-3">
                SLA Médio
              </p>
              <p className="font-data font-medium text-[2rem] text-linen leading-none">
                {metrics.avgSlaMinutes}
                <span className="font-ui text-[13px] font-normal text-ash ml-1">min</span>
              </p>
              <p className="font-ui text-[11px] text-ash mt-1">lead → handoff</p>
            </div>
          </div>

          {/* Gráfico Pix — 2 colunas */}
          <div className="lg:col-span-2">
            <PixChart data={metrics.pixConfirmedByDay} />
          </div>
        </div>
      )}

      {/* ── Tabela de agendamentos ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[22px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
            <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
              Agendamentos
            </span>
          </div>
          <span className="font-data text-[10px] text-ash border border-[rgba(156,142,130,0.18)] rounded-full px-3 py-1">
            {total} registros
          </span>
        </div>
        <AppointmentsTable appointments={appointments as AppointmentRow[]} />
      </div>
    </div>
  );
}
