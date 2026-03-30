import { Calendar, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { getAppointments } from "./actions";
import { AppointmentStatus } from "@prisma/client";

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PAID: {
    label: "PAGO",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  PENDING: {
    label: "PENDENTE",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  COMPLETED: {
    label: "CONCLUÍDO",
    className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  CANCELLED: {
    label: "CANCELADO",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-md ${className}`}>
      {label}
    </span>
  );
}

export default async function ClinicDashboard() {
  const appointments = await getAppointments();

  const total = appointments.length;
  const paid = appointments.filter((a) => a.status === "PAID").length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
  const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

  const recent = appointments.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visão Geral</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Acompanhe o desempenho da clínica em tempo real.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</span>
            <Calendar className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">{total}</p>
            <p className="text-xs text-zinc-500 mt-1">agendamentos</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider">Pagos</span>
            <CheckCircle className="w-4 h-4 text-emerald-500/50" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-emerald-400">{paid}</p>
            <p className="text-xs text-emerald-500/60 mt-1">confirmados</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-500/70 uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500/50" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-amber-400">{pending}</p>
            <p className="text-xs text-amber-500/60 mt-1">aguardando pix</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Conversão</span>
            <TrendingUp className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">{conversionRate}%</p>
            <p className="text-xs text-zinc-500 mt-1">leads → pagos</p>
          </div>
        </div>

      </div>

      {/* Recent appointments table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Últimos agendamentos</h2>
          <span className="text-xs font-mono text-zinc-600 border border-white/[0.06] rounded-xl px-3 py-1">
            {total} registros
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {recent.length === 0 ? (
            <div className="px-6 py-16 text-center text-zinc-600 text-sm">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Paciente", "Procedimento", "Data/Hora", "Status", "Ação"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((appt, i) => (
                  <tr
                    key={appt.id}
                    className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${
                      i % 2 !== 0 ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-white font-medium tracking-tight">
                      {appt.patient.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">{appt.procedureName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                      {appt.scheduledAt.toLocaleDateString("pt-BR")}
                      {" · "}
                      {appt.scheduledAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-zinc-600 hover:text-white border border-white/[0.06] hover:border-white/20 rounded-xl px-3 py-1 transition-all duration-200">
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
