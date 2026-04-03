"use client";

import { useRouter } from "next/navigation";
import type { PatientResponse } from "@/lib/api";

type AppStatus = "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<AppStatus, { label: string; className: string }> = {
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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as AppStatus];
  if (!cfg) return <span className="text-xs text-zinc-600">—</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-md ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function PatientsTable({ patients }: { patients: PatientResponse[] }) {
  const router = useRouter();

  if (patients.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center text-zinc-600 text-sm">
        Nenhum paciente encontrado.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Nome", "WhatsApp", "Último agendamento", "Status"].map((col) => (
                <th
                  key={col}
                  className="text-left px-6 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => {
              const appt = p.appointments[0] ?? null;
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/dashboard/chat?patientId=${p.id}`)}
                  className={`border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.04] transition-colors ${
                    i % 2 !== 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                    {p.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                    {p.whatsappPhone}
                  </td>
                  <td className="px-6 py-4">
                    {appt ? (
                      <div>
                        <p className="text-xs text-zinc-300 truncate max-w-[200px]">
                          {appt.procedureName}
                        </p>
                        <p className="text-[11px] text-zinc-600 font-mono mt-0.5">
                          {new Date(appt.scheduledAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {appt ? <StatusBadge status={appt.status} /> : <span className="text-xs text-zinc-600">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
