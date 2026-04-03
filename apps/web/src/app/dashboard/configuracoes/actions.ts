"use server";

import { updateClinic as apiUpdateClinic } from "@/lib/api";
import type { UpdateClinicData } from "@/lib/api";

export async function saveClinic(id: string, data: UpdateClinicData) {
  return apiUpdateClinic(id, data);
}
