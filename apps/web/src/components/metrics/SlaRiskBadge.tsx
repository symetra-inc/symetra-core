"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Appointment {
  status: string;
  handoffTime: Date | string | null;
  createdAt: Date | string;
}

/** 8 minutos sem handoff em agendamento PENDING = SLA em risco */
const THRESHOLD_MS = 8 * 60 * 1000;

export function SlaRiskBadge({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const now = Date.now();

  const count = appointments.filter((a) => {
    if (a.status !== "PENDING") return false;
    if (a.handoffTime) return false;
    return now - new Date(a.createdAt as string).getTime() > THRESHOLD_MS;
  }).length;

  if (count === 0) return null;

  return (
    <button
      onClick={() => router.push("/dashboard/chat")}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-colors"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {count} lead{count > 1 ? "s" : ""} com SLA em risco
    </button>
  );
}
