"use server";

import { prisma } from "@/lib/prisma";

export async function getAgencyMetrics() {
  // Fetch the first agency with its clinics and appointments
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

  // Derive tier from clinics count
  let tier = "Bronze";
  if (activeClinicsCount >= 16) tier = "Gold";
  else if (activeClinicsCount >= 8) tier = "Silver";

  // Check setup completeness
  let isSetupComplete = activeClinicsCount > 0;
  let missingMeta = false;
  let missingAsaas = false;

  for (const clinic of agency.clinics) {
    if (!clinic.whatsappNumberId) { missingMeta = true; isSetupComplete = false; }
    if (!clinic.asaasApiKey) { missingAsaas = true; isSetupComplete = false; }
  }

  // Financial calculations
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
    totalLeads: 0, // No leads model yet
    totalPaidAppointments,
    agencyMargin,
    clinics: agency.clinics,
  };
}
