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

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<AppStatus, number> = {
  PAID: 0,
  PENDING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

const STATUS_CONFIG: Record<AppStatus, { label: string; className: string }> = {
  PAID: {
    label: "PAGO",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
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

function StatusChip({ status }: { status: AppStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-md ${className}`}
    >
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppointmentsTable({ appointments }: Props) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // ISO yyyy-mm-dd
  const [selected, setSelected] = useState<AppointmentRow | null>(null);

  const filtered = useMemo(() => {
    let list = [...appointments];

    // Filter: patient name search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.patient.name.toLowerCase().includes(q));
    }

    // Filter: exact date (scheduledAt)
    if (dateFilter) {
      list = list.filter(
        (a) => a.scheduledAt.toISOString().split("T")[0] === dateFilter
      );
    }

    // Sort: PAID → PENDING → COMPLETED → CANCELLED, then by createdAt desc within group
    list.sort((a, b) => {
      const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (diff !== 0) return diff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return list;
  }, [appointments, search, dateFilter]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-zinc-400 focus:outline-none focus:border-white/20 transition-colors [color-scheme:dark]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-600 text-sm">
            Nenhum agendamento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Paciente", "Procedimento", "Data/Hora", "Status", "Ação"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, i) => (
                  <tr
                    key={appt.id}
                    className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${
                      i % 2 !== 0 ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-white font-medium tracking-tight whitespace-nowrap">
                      {appt.patient.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs max-w-[180px] truncate">
                      {appt.procedureName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                      {appt.scheduledAt.toLocaleDateString("pt-BR")}
                      {" · "}
                      {appt.scheduledAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={appt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelected(appt)}
                        className="text-xs text-zinc-600 hover:text-white border border-white/[0.06] hover:border-white/20 rounded-xl px-3 py-1 transition-all duration-200"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <AppointmentDetail
        appointment={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
