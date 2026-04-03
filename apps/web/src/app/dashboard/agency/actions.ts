"use server";

import { prisma } from "@/lib/prisma";

/**
 * TODO: migrar para endpoint de agência na REST API quando existir.
 * Requer: GET /agencies/:id/metrics com dados de clínicas e agendamentos consolidados.
 * Por ora mantém Prisma direto — não há endpoint correspondente na API NestJS.
 */
export async function getAgencyMetrics() {
  const agency = await prisma.agency.findFirst({
    include: {
      clinics: {
        include: {
          appointments: true,
        },
      },
    },
  });

  if (!agency) {
    return {
      tier: "Bronze",
      activeClinicsCount: 0,
      tierProgress: "0",
      clinicsToGold: 16,
      isSetupComplete: false,
      missingMeta: true,
      missingAsaas: true,
      totalLeads: 0,
      totalPaidAppointments: 0,
      agencyMargin: 0,
      clinics: [],
    };
  }

  const activeClinicsCount = agency.clinics.length;
  const targetGold = 16;
  const tierProgress = Math.min((activeClinicsCount / targetGold) * 100, 100);

  let tier = "Bronze";
  if (activeClinicsCount >= 16) tier = "Gold";
  else if (activeClinicsCount >= 8) tier = "Silver";

  let isSetupComplete = activeClinicsCount > 0;
  let missingMeta = false;
  let missingAsaas = false;

  for (const clinic of agency.clinics) {
    if (!clinic.whatsappNumberId) { missingMeta = true; isSetupComplete = false; }
    if (!clinic.asaasApiKey) { missingAsaas = true; isSetupComplete = false; }
  }

  let totalPaidAppointments = 0;
  let totalRetainedRevenue = 0;

  agency.clinics.forEach((clinic) => {
    const paid = clinic.appointments.filter((a) => a.status === "PAID");
    totalPaidAppointments += paid.length;
    totalRetainedRevenue += paid.length * clinic.reservationFee;
  });

  const agencyMargin = totalRetainedRevenue * agency.commissionRate;

  return {
    tier,
    activeClinicsCount,
    tierProgress: tierProgress.toFixed(0),
    clinicsToGold: Math.max(targetGold - activeClinicsCount, 0),
    isSetupComplete,
    missingMeta,
    missingAsaas,
    totalLeads: 0,
    totalPaidAppointments,
    agencyMargin,
    clinics: agency.clinics,
  };
}
