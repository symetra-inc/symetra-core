"use server";

import { prisma } from "@/lib/prisma";

export async function getAppointments() {
  return prisma.appointment.findMany({
    include: { patient: true },
    orderBy: { scheduledAt: "desc" },
  });
}
