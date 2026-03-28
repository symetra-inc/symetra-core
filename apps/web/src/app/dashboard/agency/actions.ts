"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getAgencyMetrics() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    throw new Error("Não autorizado");
  }

  // 1. Descobrir a Agência do usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agency_id: true }
  });

  if (!user?.agency_id) throw new Error("Agência não encontrada");
  const agencyId = user.agency_id;

  // 2. Buscar dados da agência e suas clínicas
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      clinics: {
        include: {
          appointments: true,
          leads: true
        }
      }
    }
  });

  if (!agency) throw new Error("Agência inválida");

  // 3. Cálculos de Tiers e Clínicas
  const activeClinicsCount = agency.clinics.length;
  const targetGold = 16;
  const tierProgress = activeClinicsCount > 0 ? (activeClinicsCount / targetGold) * 100 : 0;

  // 4. A Trava do Wizard (Onboarding)
  // Verifica se TODAS as clínicas dessa agência já têm o Asaas e a Meta configurados
  let isSetupComplete = true;
  let missingMeta = false;
  let missingAsaas = false;

  if (activeClinicsCount === 0) {
    isSetupComplete = false; // Se não tem clínica, o setup não acabou
  } else {
    for (const clinic of agency.clinics) {
      if (!clinic.whatsapp_number_id) { missingMeta = true; isSetupComplete = false; }
      if (!clinic.asaas_api_key) { missingAsaas = true; isSetupComplete = false; }
    }
  }

  // 5. Cálculos Financeiros (Somatório da Carteira)
  let totalLeads = 0;
  let totalPaidAppointments = 0;
  let totalRetainedRevenue = 0;

  // Repasse simplificado para o MVP (Fase 1: 20%)
  const cutPercentage = 0.20; 

  agency.clinics.forEach(clinic => {
    totalLeads += clinic.leads.length;
    
    const paid = clinic.appointments.filter(app => app.status === "PAID");
    totalPaidAppointments += paid.length;
    totalRetainedRevenue += (paid.length * clinic.reservation_fee);
  });

  const agencyMargin = totalRetainedRevenue * cutPercentage;

  return {
    tier: agency.tier,
    activeClinicsCount,
    tierProgress: Math.min(tierProgress, 100).toFixed(0),
    clinicsToGold: Math.max(targetGold - activeClinicsCount, 0),
    isSetupComplete,
    missingMeta,
    missingAsaas,
    totalLeads,
    totalPaidAppointments,
    agencyMargin,
    clinics: agency.clinics
  };
}