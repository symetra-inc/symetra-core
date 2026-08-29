"use server";

import { prisma } from "@/lib/prisma";

// ── Helpers (espelham a lógica do agency.service.ts na API) ───────────────────

function planFixedFee(monthlyAvg: number): number {
  if (monthlyAvg > 80) return 2997;
  if (monthlyAvg > 40) return 1997;
  return 1497;
}

function cliffRate(clinicCreatedAt: Date, activeClinicsCount: number): number {
  const months = (Date.now() - clinicCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months <= 3) return 0.20;
  if (months <= 12) return 0.10;
  // Fase 3: depende do tier da agência
  if (activeClinicsCount >= 16) return 0.05;
  if (activeClinicsCount >= 6) return 0.025;
  return 0;
}

// ── Action ────────────────────────────────────────────────────────────────────

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
      tier: "Certified",
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

  // Tiers: Certified ≤ 5, Silver 6-15, Gold 16+
  let tier = "Certified";
  if (activeClinicsCount >= 16) tier = "Gold";
  else if (activeClinicsCount >= 6) tier = "Silver";

  const targetGold = 16;
  const tierProgress = Math.min((activeClinicsCount / targetGold) * 100, 100);

  let isSetupComplete = activeClinicsCount > 0;
  let missingMeta = false;
  let missingAsaas = false;

  for (const clinic of agency.clinics) {
    if (!clinic.whatsappNumberId) { missingMeta = true; isSetupComplete = false; }
    if (!clinic.asaasApiKey) { missingAsaas = true; isSetupComplete = false; }
  }

  let totalPaidAppointments = 0;
  let agencyMargin = 0;

  agency.clinics.forEach((clinic) => {
    totalPaidAppointments += clinic.appointments.filter((a) => a.status === "PAID").length;

    // Calcular RevShare desta clínica: cliffRate × fixo do plano
    const monthsActive = Math.max(
      (Date.now() - clinic.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      1,
    );
    const monthlyAvg = clinic.appointments.length / monthsActive;
    const rate = cliffRate(clinic.createdAt, activeClinicsCount);
    agencyMargin += rate * planFixedFee(monthlyAvg);
  });

  return {
    tier,
    activeClinicsCount,
    tierProgress: tierProgress.toFixed(0),
    clinicsToGold: Math.max(targetGold - activeClinicsCount, 0),
    isSetupComplete,
    missingMeta,
    missingAsaas,
    totalLeads: agency.clinics.reduce((sum, c) => sum + c.appointments.length, 0),
    totalPaidAppointments,
    agencyMargin,
    clinics: agency.clinics,
  };
}
