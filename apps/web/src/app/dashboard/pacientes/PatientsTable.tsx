"use client";

import { useRouter } from "next/navigation";
import type { PatientResponse } from "@/lib/api";

type AppStatus = "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";

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

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as AppStatus];
  if (!cfg) return <span className="font-data text-[9px] text-ash">—</span>;
  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
      className="inline-flex items-center px-2.5 py-[3px] text-[8px] font-data tracking-[0.08em] uppercase border rounded-full"
    >
      {cfg.label}
    </span>
  );
}

export function PatientsTable({ patients }: { patients: PatientResponse[] }) {
  const router = useRouter();

  if (patients.length === 0) {
    return (
      <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] px-6 py-14 text-center">
        <p className="font-data text-[10px] text-ash tracking-[0.1em] uppercase">
          Nenhum paciente encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(156,142,130,0.12)]">
              {["Paciente", "WhatsApp", "Último agendamento", "Status"].map((col) => (
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
            {patients.map((p) => {
              const appt = p.appointments[0] ?? null;
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/dashboard/chat?patientId=${p.id}`)}
                  className="border-b border-[rgba(156,142,130,0.07)] last:border-0 cursor-pointer hover:bg-[rgba(156,142,130,0.04)] transition-colors"
                >
                  <td className="px-5 py-3.5 font-ui text-[13px] font-medium text-linen whitespace-nowrap">
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 font-data text-[11px] text-ash whitespace-nowrap">
                    {p.whatsappPhone}
                  </td>
                  <td className="px-5 py-3.5">
                    {appt ? (
                      <div>
                        <p className="font-ui text-[12px] text-linen/80 truncate max-w-[200px]">
                          {appt.procedureName}
                        </p>
                        <p className="font-data text-[10px] text-ash mt-0.5">
                          {new Date(appt.scheduledAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ) : (
                      <span className="font-data text-[10px] text-ash">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {appt
                      ? <StatusChip status={appt.status} />
                      : <span className="font-data text-[10px] text-ash">—</span>
                    }
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
