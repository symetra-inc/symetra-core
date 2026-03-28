"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getClinicMetrics() {
  const session = await auth();
  
  if (!session?.user?.id) throw new Error("Não autorizado");

  // 1. Descobrir qual é a clínica desse usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clinic_id: true }
  });

  if (!user?.clinic_id) throw new Error("Clínica não encontrada");

  const clinicId = user.clinic_id;

  // 2. Buscar a clínica para pegar a taxa de reserva (reservation_fee)
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { reservation_fee: true }
  });

  const fee = clinic?.reservation_fee || 100; // Padrão R$ 100

  // 3. Contar total de leads
  const totalLeads = await prisma.lead.count({
    where: { clinic_id: clinicId }
  });

  // 4. Buscar agendamentos Pagos (Handoff feito) e Pendentes (Pix gerado)
  const paidAppointments = await prisma.appointment.count({
    where: { clinic_id: clinicId, status: "PAID" }
  });

  const canceledAppointments = await prisma.appointment.count({
    where: { clinic_id: clinicId, status: "CANCELED" } // No-shows evitados
  });

  // Cálculos de negócio
  const retainedRevenue = paidAppointments * fee;
  const conversionRate = totalLeads > 0 ? ((paidAppointments / totalLeads) * 100).toFixed(1) : "0.0";

  // Buscando os últimos 5 eventos para o Feed da Serena
  const recentEvents = await prisma.appointment.findMany({
    where: { clinic_id: clinicId },
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { lead: true }
  });

  return {
    retainedRevenue,
    paidAppointments,
    totalLeads,
    canceledAppointments,
    conversionRate,
    recentEvents
  };
}