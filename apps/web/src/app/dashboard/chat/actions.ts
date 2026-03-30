"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
};

export type MessageRow = {
  id: string;
  role: "USER" | "AI" | "HUMAN";
  content: string;
  createdAt: string; // ISO string
};

// ─── Queries ──────────────────────────────────────────────────────────────────

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
      // Cast necessário até próximo `prisma generate` após db push
      botPaused: (p as any).botPaused ?? false,
      requiresHuman: (p as any).requiresHuman ?? false,
      lastMessage: (p as any).messages[0]?.content ?? null,
      lastMessageAt:
        ((p as any).messages[0]?.createdAt ?? p.createdAt).toISOString(),
      lastAppointmentStatus: p.appointments[0]?.status ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
}

export async function getPatientMessages(patientId: string): Promise<MessageRow[]> {
  // Cast necessário até próximo `prisma generate` após db push
  const messages = await (prisma as any).message.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m: any) => ({
    id: m.id,
    role: m.role as "USER" | "AI" | "HUMAN",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Alterna o estado do bot para um paciente.
 * pause=true  → bot silenciado, humano assume
 * pause=false → bot retoma o atendimento
 */
export async function toggleBotStatus(
  patientId: string,
  pause: boolean
): Promise<void> {
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      // Cast necessário até próximo `prisma generate` após db push
      ...(({ botPaused: pause, requiresHuman: pause } as any)),
    },
  });
  revalidatePath("/dashboard/chat");
}

/**
 * Grava uma mensagem enviada pela secretária humana.
 * Também pausa o bot automaticamente.
 * @deprecated use sendManualMessage — não envia ao WhatsApp
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
 * Envia uma mensagem manual da secretária:
 * 1. Grava no banco com role 'HUMAN'
 * 2. Dispara a mensagem REAL no celular do paciente via Meta Cloud API
 * 3. Pausa o bot automaticamente
 */
export async function sendManualMessage(
  patientId: string,
  content: string
): Promise<MessageRow> {
  // Busca paciente + clínica para pegar os dados de envio
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { clinic: true },
  });

  if (!patient) throw new Error(`Paciente ${patientId} não encontrado.`);

  // 1. Persiste no histórico
  const msg = await (prisma as any).message.create({
    data: { patientId, role: "HUMAN", content },
  });

  // 2. Pausa o bot
  await prisma.patient.update({
    where: { id: patientId },
    data: { ...(({ botPaused: true, requiresHuman: true } as any)) },
  });

  // 3. Envia ao WhatsApp do paciente via Meta Cloud API
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
      // Falha no envio não reverte o registro — já foi salvo no histórico
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
