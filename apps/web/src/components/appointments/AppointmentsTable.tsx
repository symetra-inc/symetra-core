"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AppointmentDetail } from "./AppointmentDetail";

type AppStatus = "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";

export interface AppointmentRow {
  id: string;
  status: AppStatus;
  procedureName: string;
  scheduledAt: Date;
  handoffTime: Date | null;
  paymentConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient: { id: string; name: string; whatsappPhone: string };
}

interface Props {
  appointments: AppointmentRow[];
}

const STATUS_ORDER: Record<AppStatus, number> = {
  PAID: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3,
};

const STATUS_CONFIG: Record<AppStatus, { label: string; bg: string; text: string; border: string }> = {
  PAID: {
    label: "PAGO",
    bg:     "rgba(197,160,89,0.12)",
    text:   "#C5A059",
    border: "rgba(197,160,89,0.20)",
  },
  PENDING: {
    label: "PENDENTE",
    bg:     "rgba(156,142,130,0.10)",
    text:   "#9C8E82",
    border: "rgba(156,142,130,0.18)",
  },
  COMPLETED: {
    label: "CONCLUÍDO",
    bg:     "rgba(52,120,80,0.08)",
    text:   "#2D6A4F",
    border: "rgba(52,120,80,0.15)",
  },
  CANCELLED: {
    label: "CANCELADO",
    bg:     "rgba(180,83,9,0.06)",
    text:   "#92400E",
    border: "rgba(180,83,9,0.12)",
  },
};

function StatusChip({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
      className="inline-flex items-center px-2.5 py-[3px] text-[8px] font-data tracking-[0.08em] uppercase border rounded-full"
    >
      {cfg.label}
    </span>
  );
}

export function AppointmentsTable({ appointments }: Props) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<AppointmentRow | null>(null);

  const filtered = useMemo(() => {
    let list = [...appointments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.patient.name.toLowerCase().includes(q));
    }
    if (dateFilter) {
      list = list.filter(
        (a) => a.scheduledAt.toISOString().split("T")[0] === dateFilter
      );
    }
    list.sort((a, b) => {
      const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (diff !== 0) return diff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return list;
  }, [appointments, search, dateFilter]);

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ash/50" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[3px] pl-9 pr-4 py-2 font-ui text-[13px] text-linen placeholder:text-ash/50 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[3px] px-4 py-2 font-data text-[12px] text-ash focus:outline-none focus:border-gold transition-colors [color-scheme:dark]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash hover:text-linen text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-data text-[10px] text-ash tracking-[0.1em] uppercase">
              Nenhum agendamento encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(156,142,130,0.12)]">
                  {["Paciente", "Procedimento", "Data / Hora", "Status", ""].map((col) => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 font-data text-[9px] text-ash tracking-[0.15em] uppercase whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b border-[rgba(156,142,130,0.07)] last:border-0 hover:bg-[rgba(156,142,130,0.04)] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-ui text-[13px] font-medium text-linen whitespace-nowrap">
                      {appt.patient.name}
                    </td>
                    <td className="px-5 py-3.5 font-ui text-[12px] text-ash max-w-[180px] truncate">
                      {appt.procedureName}
                    </td>
                    <td className="px-5 py-3.5 font-data text-[11px] text-ash whitespace-nowrap">
                      {appt.scheduledAt.toLocaleDateString("pt-BR")}
                      {" · "}
                      {appt.scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={appt.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelected(appt)}
                        className="font-ui text-[11px] text-ash hover:text-linen border border-[rgba(156,142,130,0.18)] hover:border-[rgba(156,142,130,0.4)] rounded-[3px] px-3 py-1 transition-all duration-200"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />
    </>
  );
}
