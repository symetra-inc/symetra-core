import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Tipos de resposta ─────────────────────────────────────────────────────────

export interface ClinicResponse {
  id: string;
  name: string;
  doctorName: string;
  persona: "ARISTOCRATA" | "SOFISTICADA" | "ESPECIALISTA";
  whatsappNumberId: string;
  receptionistPhone: string | null;
  receptionistName: string | null;
  knowledgeBase: string;
  catalog: unknown;
  reservationFee: number;
  createdAt: string;
}

export interface UpdateClinicData {
  name?: string;
  doctorName?: string;
  personaType?: "ARISTOCRATA" | "SOFISTICADA" | "ESPECIALISTA";
  knowledgeBase?: string;
  catalog?: unknown;
  secretaryPhone?: string;
  secretaryName?: string;
}

export interface AppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentPatient {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface AppointmentResponse {
  id: string;
  status: "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";
  procedureName: string;
  scheduledAt: string;
  handoffTime: string | null;
  slaViolated: boolean;
  isAiMuted: boolean;
  paymentConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: AppointmentPatient;
}

export interface MetricsResponse {
  totalToday: number;
  totalMonth: number;
  conversionRate: number;
  avgSlaMinutes: number;
  pixConfirmedByDay: { date: string; count: number }[];
}

export interface PatientAppointmentSummary {
  id: string;
  status: string;
  procedureName: string;
  scheduledAt: string;
  createdAt: string;
}

export interface PatientResponse {
  id: string;
  name: string;
  whatsappPhone: string;
  botPaused: boolean;
  requiresHuman: boolean;
  createdAt: string;
  appointments: PatientAppointmentSummary[];
}

export interface ApiMessage {
  id?: string;
  role: string;
  content: string;
  createdAt?: string;
}

export interface MessagesResponse {
  source: "redis" | "database";
  messages: ApiMessage[];
}

// ── Infra ─────────────────────────────────────────────────────────────────────

/**
 * Lê o JWT do cookie de sessão do NextAuth v5.
 * Com o encode customizado (HS256), o valor do cookie é diretamente o Bearer token.
 */
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  // NextAuth v5: __Secure- prefix em produção (HTTPS), sem prefix em dev
  const name =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  return cookieStore.get(name)?.value ?? null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} — ${init?.method ?? "GET"} ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export function getClinic(id: string) {
  return apiFetch<ClinicResponse>(`/clinics/${id}`);
}

export function updateClinic(id: string, data: UpdateClinicData) {
  return apiFetch<ClinicResponse>(`/clinics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getAppointments(clinicId: string, filters?: AppointmentFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  const qs = params.size > 0 ? `?${params.toString()}` : "";
  return apiFetch<AppointmentResponse[]>(`/clinics/${clinicId}/appointments${qs}`);
}

export function getMetrics(clinicId: string) {
  return apiFetch<MetricsResponse>(`/clinics/${clinicId}/appointments/metrics`);
}

export function getPatients(clinicId: string) {
  return apiFetch<PatientResponse[]>(`/clinics/${clinicId}/patients`);
}

export function getMessages(patientId: string) {
  return apiFetch<MessagesResponse>(`/patients/${patientId}/messages`);
}
