// Modo de pré-visualização do painel, só para ver o front sem banco nem API.
// Liga com DASHBOARD_PREVIEW=1 no ambiente local. Nunca configure isso na Vercel:
// com ele ligado, /dashboard abre sem login e mostra dados fictícios.
import type {
  AgencyClinicResponse,
  AppointmentResponse,
  ClinicResponse,
  MessagesResponse,
  MetricsResponse,
  PatientResponse,
} from "./api";

export const PREVIEW = process.env.DASHBOARD_PREVIEW === "1";

const CLINIC_ID = "preview-clinic";

export const previewSession = {
  expires: new Date(Date.now() + 86_400_000).toISOString(),
  user: {
    id: "preview-user",
    name: "Clínica Exemplo (pré-visualização)",
    email: "preview@symetra.com.br",
    role: "CLINIC_ADMIN",
    clinicId: CLINIC_ID,
    agencyId: "preview-agency",
  },
};

const now = Date.now();
const H = 3_600_000;
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

const PEOPLE = [
  { id: "p1", name: "Juliana Moraes", whatsappPhone: "5511988887777" },
  { id: "p2", name: "Camila Souza", whatsappPhone: "5511977776666" },
  { id: "p3", name: "Ana Beatriz Lima", whatsappPhone: "5511966665555" },
  { id: "p4", name: "Mariana Fontes", whatsappPhone: "5511955554444" },
  { id: "p5", name: "Patrícia Rocha", whatsappPhone: "5511944443333" },
];

const APPOINTMENTS: AppointmentResponse[] = [
  { procedure: "Harmonização labial", status: "PAID", at: 26 * H, created: -2 * H, handoff: -H },
  { procedure: "Preenchimento malar", status: "PENDING", at: 50 * H, created: -0.2 * H, handoff: null },
  { procedure: "Botox preventivo", status: "PAID", at: 74 * H, created: -30 * H, handoff: -29 * H },
  { procedure: "Bioestimulador", status: "COMPLETED", at: -48 * H, created: -120 * H, handoff: -119 * H },
  { procedure: "Skinbooster", status: "CANCELLED", at: 98 * H, created: -10 * H, handoff: null },
].map((a, i) => ({
  id: `a${i + 1}`,
  status: a.status as AppointmentResponse["status"],
  procedureName: a.procedure,
  durationMinutes: 60,
  scheduledAt: iso(a.at),
  handoffTime: a.handoff === null ? null : iso(a.handoff),
  slaViolated: false,
  isAiMuted: a.handoff !== null,
  paymentConfirmedAt: a.status === "PAID" || a.status === "COMPLETED" ? iso(a.created + 0.5 * H) : null,
  createdAt: iso(a.created),
  updatedAt: iso(a.created),
  patient: PEOPLE[i],
}));

const METRICS: MetricsResponse = {
  totalToday: 3,
  totalMonth: 42,
  conversionRate: 61,
  avgSlaMinutes: 4,
  pixConfirmedByDay: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(now - (6 - i) * 24 * H).toISOString().slice(0, 10),
    count: [2, 4, 1, 5, 3, 6, 3][i],
  })),
};

const CLINIC: ClinicResponse = {
  id: CLINIC_ID,
  name: "Clínica Exemplo",
  doctorName: "Dra. Ana",
  persona: "SOFISTICADA",
  whatsappNumberId: "000000000000000",
  receptionistPhone: "5511900000000",
  receptionistName: "Recepção",
  knowledgeBase: "Atendemos de segunda a sábado, das 9h às 19h.",
  catalog: [],
  reservationFee: 150,
  createdAt: iso(-90 * 24 * H),
};

const PATIENTS: PatientResponse[] = PEOPLE.map((p, i) => ({
  ...p,
  botPaused: i === 0,
  requiresHuman: i === 1,
  createdAt: iso(-(i + 1) * 24 * H),
  appointments: [
    {
      id: APPOINTMENTS[i].id,
      status: APPOINTMENTS[i].status,
      procedureName: APPOINTMENTS[i].procedureName,
      scheduledAt: APPOINTMENTS[i].scheduledAt,
      createdAt: APPOINTMENTS[i].createdAt,
    },
  ],
}));

const MESSAGES: MessagesResponse = {
  source: "database",
  messages: [
    { id: "m1", role: "USER", content: "Oi! Queria saber sobre harmonização labial.", createdAt: iso(-3 * H) },
    { id: "m2", role: "AI", content: "Oi, Juliana! Tenho quinta às 14h ou sexta às 10h. Qual fica melhor?", createdAt: iso(-2.9 * H) },
    { id: "m3", role: "USER", content: "Quinta está ótimo.", createdAt: iso(-2.8 * H) },
    { id: "m4", role: "AI", content: "Perfeito! O sinal é R$ 150. Te mando o Pix?", createdAt: iso(-2.7 * H) },
    { id: "m5", role: "USER", content: "Pode mandar. Já paguei!", createdAt: iso(-2.5 * H) },
  ],
};

const AGENCY_CLINICS: AgencyClinicResponse[] = [
  { id: "c1", name: "Clínica Exemplo", totalLeads: 42, totalPaid: 26, plan: "GROWTH", fixedFee: 1997, cliffPhase: 1, cliffRate: 0.2, estimatedRevShare: 399 },
  { id: "c2", name: "Instituto Bela Pele", totalLeads: 18, totalPaid: 9, plan: "STARTER", fixedFee: 1497, cliffPhase: 2, cliffRate: 0.1, estimatedRevShare: 150 },
];

/** Resposta fictícia para cada chamada da API REST (lib/api.ts). */
export function previewApi(path: string, init?: RequestInit): unknown {
  const method = init?.method ?? "GET";
  if (path.startsWith("/clinics/") && path.includes("/appointments/metrics")) return METRICS;
  if (path.startsWith("/clinics/") && path.includes("/appointments")) return APPOINTMENTS;
  if (path.startsWith("/clinics/") && path.endsWith("/patients")) return PATIENTS;
  if (path.startsWith("/clinics/")) return method === "PATCH" ? { ...CLINIC, ...JSON.parse(String(init?.body ?? "{}")) } : CLINIC;
  if (path.startsWith("/patients/") && path.endsWith("/messages")) return MESSAGES;
  if (path.startsWith("/appointments/")) return { appointmentId: path.split("/")[2] };
  if (path === "/agency/clinics") return AGENCY_CLINICS;
  return {};
}

/** Lista da caixa de conversas (dashboard/chat), que normalmente vem do Prisma. */
export function previewChatPatients() {
  return PATIENTS.map((p, i) => ({
    id: p.id,
    name: p.name,
    whatsappPhone: p.whatsappPhone,
    botPaused: p.botPaused,
    requiresHuman: p.requiresHuman,
    lastMessage: ["Pode mandar. Já paguei!", "Tem horário sábado?", "Obrigada!", "Qual o valor?", "Vou pensar"][i],
    lastMessageAt: iso(-(i + 1) * 0.7 * H),
    lastAppointmentStatus: p.appointments[0].status,
    lastAppointmentIsAiMuted: APPOINTMENTS[i].isAiMuted,
    lastAppointmentCreatedAt: APPOINTMENTS[i].createdAt,
    lastAppointmentHandoffTime: APPOINTMENTS[i].handoffTime,
    lastAppointmentId: APPOINTMENTS[i].id,
  }));
}

/** Métricas do portal da agência, que normalmente vêm do Prisma. */
export function previewAgencyMetrics() {
  return {
    tier: "Certified",
    activeClinicsCount: 2,
    tierProgress: "13",
    clinicsToGold: 14,
    isSetupComplete: true,
    missingMeta: false,
    missingAsaas: false,
    totalLeads: 60,
    totalPaidAppointments: 35,
    agencyMargin: 549,
    clinics: [],
  };
}
