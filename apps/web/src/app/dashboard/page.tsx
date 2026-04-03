import { Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";
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
  return <div>Sem clínica vinculada</div>;
}

const [appointments, metrics] = await Promise.all([
  getAppointments(),
  getMetrics(clinicId),
]);


  const total = appointments.length;
  const paid = appointments.filter((a) => a.status === "PAID").length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Polling — só nas métricas */}
      <MetricsRefresher />

      {/* Heading + SLA badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Visão Geral
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Acompanhe o desempenho da clínica em tempo real.
          </p>
        </div>
        <SlaRiskBadge appointments={appointments} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total
            </span>
            <Calendar className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">
              {total}
            </p>
            <p className="text-xs text-zinc-500 mt-1">agendamentos</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider">
              Pagos
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500/50" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-emerald-400">
              {paid}
            </p>
            <p className="text-xs text-emerald-500/60 mt-1">confirmados</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-500/70 uppercase tracking-wider">
              Pendentes
            </span>
            <Clock className="w-4 h-4 text-amber-500/50" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-amber-400">
              {pending}
            </p>
            <p className="text-xs text-amber-500/60 mt-1">aguardando pix</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Conversão
            </span>
            <TrendingUp className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">
              {conversionRate}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">leads → pagos</p>
          </div>
        </div>
      </div>

      {/* Metrics row: API metrics + Pix chart */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Additional API metrics */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Hoje
            </span>
            <p className="text-3xl font-bold tracking-tight text-white">
              {metrics.totalToday}
            </p>
            <p className="text-xs text-zinc-500">agendamentos hoje</p>

            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                SLA médio
              </span>
              <p className="text-xl font-bold tracking-tight text-white mt-2">
                {metrics.avgSlaMinutes}
                <span className="text-sm font-normal text-zinc-500 ml-1">min</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                do lead ao handoff
              </p>
            </div>
          </div>

          {/* Pix chart — spans 2 columns */}
          <div className="lg:col-span-2">
            <PixChart data={metrics.pixConfirmedByDay} />
          </div>
        </div>
      )}

      {/* Appointments table — full, filterable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Agendamentos</h2>
          <span className="text-xs font-mono text-zinc-600 border border-white/[0.06] rounded-xl px-3 py-1">
            {total} registros
          </span>
        </div>

        <AppointmentsTable appointments={appointments as AppointmentRow[]} />
      </div>
    </div>
  );
}
