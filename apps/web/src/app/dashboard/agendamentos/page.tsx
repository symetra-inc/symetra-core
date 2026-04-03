import { Calendar } from "lucide-react";


type AppointmentStatus = "PAID" | "PENDING" | "CANCELLED";

interface Appointment {
  id: string;
  patient: string;
  procedure: string;
  scheduledAt: string;
  status: AppointmentStatus;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patient: "Ana Paula Souza",
    procedure: "Preenchimento Labial",
    scheduledAt: "30/03/2026 · 14:00",
    status: "PAID",
  },
  {
    id: "2",
    patient: "Fernanda Rocha",
    procedure: "Harmonização Facial",
    scheduledAt: "31/03/2026 · 10:30",
    status: "PENDING",
  },
  {
    id: "3",
    patient: "Carla Menezes",
    procedure: "Fios de PDO",
    scheduledAt: "28/03/2026 · 09:00",
    status: "CANCELLED",
  },
];

const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  PAID: {
    label: "PAGO",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  PENDING: {
    label: "PENDENTE",
    className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  },
  CANCELLED: {
    label: "CANCELADO",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded-xl font-mono font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default function AgendamentosPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-zin-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Agendamentos</h2>
            <p className="text-xs text-zinc-500">
              Gerencie os agendamentos da clínica
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-500 border border-zinc-800 rounded-xl px-3 py-1">
          {mockAppointments.length} registros
        </span>
      </div>

      {/* Brutalist table */}
      <div className="border rounded-xl border-zinc-800 bg-zinc-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sec">
              {["Paciente", "Procedimento", "Data/Hora", "Status Financeiro", "Ação"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {mockAppointments.map((appt, i) => (
              <tr
                key={appt.id}
                className={`border-b border-sec last:border-0 hover:bg-white/[0.03] transition-colors ${
                  i % 2 !== 0 ? "bg-white/[0.01]" : ""
                }`}
              >
                <td className="px-6 py-4 text-white font-medium">
                  {appt.patient}
                </td>
                <td className="px-6 py-4 text-zinc-400">{appt.procedure}</td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                  {appt.scheduledAt}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={appt.status} />
                </td>
                <td className="px-6 py-4">
                  <button className="text-xs text-zinc-500 rounded-xl hover:text-gold border border-sec px-3 py-1 transition-colors">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
