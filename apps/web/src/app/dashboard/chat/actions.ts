"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getMessages as apiGetMessages } from "@/lib/api";

// ─── Tipos serializáveis (Date → string para passar Server → Client) ──────────

export type PatientRow = {
  id: string;
  name: string;
  whatsappPhone: string;
  botPaused: boolean;
  requiresHuman: boolean;
  /** Texto da última mensagem (truncado) */
  lastMessage: string | null;
  /** ISO string da última interação */
  lastMessageAt: string;
  /** Status do agendamento mais recente (PENDING | PAID | COMPLETED | CANCELLED | null) */
  lastAppointmentStatus: string | null;
  /** Se a IA está silenciada no agendamento mais recente */
  lastAppointmentIsAiMuted: boolean | null;
  /** ISO string de criação do agendamento mais recente (para timer de SLA) */
  lastAppointmentCreatedAt: string | null;
  /** ISO string do handoff do agendamento mais recente (null = sem handoff ainda) */
  lastAppointmentHandoffTime: string | null;
};

export type MessageRow = {
  id: string;
  role: "USER" | "AI" | "HUMAN";
  content: string;
  createdAt: string; // ISO string
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * TODO: migrar para GET /clinics/:id/patients quando o endpoint incluir
 * lastMessage e lastMessageAt (dados de mensagens por paciente).
 * Por ora mantém Prisma direto pois a API não retorna esses campos.
 */
export async function getPatients(): Promise<PatientRow[]> {
  const patients = await prisma.patient.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      appointments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return patients
    .map((p) => ({
      id: p.id,
      name: p.name,
      whatsappPhone: p.whatsappPhone,
      botPaused: (p as any).botPaused ?? false,
      requiresHuman: (p as any).requiresHuman ?? false,
      lastMessage: (p as any).messages[0]?.content ?? null,
      lastMessageAt:
        ((p as any).messages[0]?.createdAt ?? p.createdAt).toISOString(),
      lastAppointmentStatus: p.appointments[0]?.status ?? null,
      lastAppointmentIsAiMuted: p.appointments[0]?.isAiMuted ?? null,
      lastAppointmentCreatedAt: p.appointments[0]?.createdAt.toISOString() ?? null,
      lastAppointmentHandoffTime: p.appointments[0]?.handoffTime?.toISOString() ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
}

/** Migrado para GET /patients/:id/messages via api.ts */
export async function getPatientMessages(patientId: string): Promise<MessageRow[]> {
  const result = await apiGetMessages(patientId);
  return result.messages.map((m, i) => ({
    // Mensagens do Redis não têm id nem createdAt — geramos valores sintéticos
    id: m.id ?? `msg-${i}`,
    role: m.role as MessageRow["role"],
    content: m.content,
    createdAt: m.createdAt ?? new Date().toISOString(),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * TODO: migrar para PATCH /patients/:id/status quando o endpoint existir.
 * Mantém Prisma direto — não há endpoint na API para alterar botPaused/requiresHuman.
 */
export async function toggleBotStatus(
  patientId: string,
  pause: boolean
): Promise<void> {
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(({ botPaused: pause, requiresHuman: pause } as any)),
    },
  });
  revalidatePath("/dashboard/chat");
}

/**
 * @deprecated use sendManualMessage — não envia ao WhatsApp
 * TODO: remover após confirmar que não há mais chamadas externas.
 */
export async function sendHumanMessage(
  patientId: string,
  content: string
): Promise<MessageRow> {
  const msg = await (prisma as any).message.create({
    data: { patientId, role: "HUMAN", content },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: { ...(({ botPaused: true, requiresHuman: true } as any)) },
  });

  revalidatePath("/dashboard/chat");

  return {
    id: msg.id,
    role: "HUMAN",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  };
}

/**
 * TODO: migrar para POST /patients/:id/messages quando o endpoint existir.
 * Por ora mantém Prisma + chamada direta à Meta API — lógica complexa sem endpoint correspondente.
 */
export async function sendManualMessage(
  patientId: string,
  content: string
): Promise<MessageRow> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { clinic: true },
  });

  if (!patient) throw new Error(`Paciente ${patientId} não encontrado.`);

  const msg = await (prisma as any).message.create({
    data: { patientId, role: "HUMAN", content },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: { ...(({ botPaused: true, requiresHuman: true } as any)) },
  });

  const token = process.env.META_WA_TOKEN;
  const clinicPhoneId = patient.clinic.whatsappNumberId;

  if (token && clinicPhoneId) {
    try {
      await fetch(
        `https://graph.facebook.com/v19.0/${clinicPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: patient.whatsappPhone,
            type: "text",
            text: { preview_url: false, body: content },
          }),
        }
      );
    } catch {
      console.error("[sendManualMessage] Falha ao enviar via Meta API");
    }
  }

  revalidatePath("/dashboard/chat");

  return {
    id: msg.id,
    role: "HUMAN",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  };
}
