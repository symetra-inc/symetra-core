"use client";

import { useRouter } from "next/navigation";

interface Appointment {
  status: string;
  handoffTime: Date | string | null;
  createdAt: Date | string;
}

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
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(180,83,9,0.06)] border border-[rgba(180,83,9,0.18)] rounded-full font-data text-[9px] text-[#92400E] tracking-[0.07em] uppercase hover:bg-[rgba(180,83,9,0.10)] transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#92400E] animate-pulse shrink-0" />
      {count} lead{count > 1 ? "s" : ""} com SLA em risco
    </button>
  );
}
