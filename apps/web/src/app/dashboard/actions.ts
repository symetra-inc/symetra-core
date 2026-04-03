"use server";

import { auth } from "@/auth";
import { getAppointments as apiGetAppointments } from "@/lib/api";

/**
 * Retorna agendamentos da clínica autenticada via REST API.
 * As datas são convertidas de ISO string para Date para manter compatibilidade
 * com o componente dashboard/page.tsx (usa .toLocaleDateString / .toLocaleTimeString).
 */
export async function getAppointments() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) return [];

  const appointments = await apiGetAppointments(clinicId);

  return appointments.map((a) => ({
    ...a,
    scheduledAt: new Date(a.scheduledAt),
    handoffTime: a.handoffTime ? new Date(a.handoffTime) : null,
    paymentConfirmedAt: a.paymentConfirmedAt ? new Date(a.paymentConfirmedAt) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
  }));
}
