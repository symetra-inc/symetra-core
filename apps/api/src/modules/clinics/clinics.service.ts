import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, PersonaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface UpdateClinicDto {
  name?: string;
  doctorName?: string;
  secretaryPhone?: string;   // → receptionistPhone
  secretaryName?: string;    // → receptionistName
  personaType?: PersonaType; // → persona
  knowledgeBase?: string;
  catalog?: unknown;
}

export interface AppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /clinics/:id ──────────────────────────────────────────────────────

  async findOne(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        doctorName: true,
        persona: true,
        whatsappNumberId: true,
        receptionistPhone: true,
        receptionistName: true,
        knowledgeBase: true,
        catalog: true,
        reservationFee: true,
        createdAt: true,
      },
    });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');
    return clinic;
  }

  // ── PATCH /clinics/:id ────────────────────────────────────────────────────

  async update(clinicId: string, dto: UpdateClinicDto) {
    const data: Prisma.ClinicUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.doctorName !== undefined) data.doctorName = dto.doctorName;
    if (dto.secretaryPhone !== undefined) data.receptionistPhone = dto.secretaryPhone;
    if (dto.secretaryName !== undefined) data.receptionistName = dto.secretaryName;
    if (dto.personaType !== undefined) data.persona = dto.personaType;
    if (dto.knowledgeBase !== undefined) data.knowledgeBase = dto.knowledgeBase;
    if (dto.catalog !== undefined) data.catalog = dto.catalog as Prisma.InputJsonValue;

    return this.prisma.clinic.update({
      where: { id: clinicId },
      data,
      select: {
        id: true,
        name: true,
        doctorName: true,
        persona: true,
        whatsappNumberId: true,
        receptionistPhone: true,
        receptionistName: true,
        knowledgeBase: true,
        catalog: true,
        reservationFee: true,
        createdAt: true,
      },
    });
  }

  // ── GET /clinics/:id/appointments ─────────────────────────────────────────

  async findAppointments(clinicId: string, filters: AppointmentFilters) {
    const where: Prisma.AppointmentWhereInput = { clinicId };

    if (filters.status) {
      where.status = filters.status as AppointmentStatus;
    }
    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) (where.scheduledAt as Prisma.DateTimeFilter).gte = new Date(filters.startDate);
      if (filters.endDate) (where.scheduledAt as Prisma.DateTimeFilter).lte = new Date(filters.endDate);
    }

    return this.prisma.appointment.findMany({
      where,
      select: {
        id: true,
        status: true,
        procedureName: true,
        scheduledAt: true,
        handoffTime: true,
        slaViolated: true,
        isAiMuted: true,
        paymentConfirmedAt: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          select: { id: true, name: true, whatsappPhone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── GET /clinics/:id/appointments/metrics ─────────────────────────────────

  async getMetrics(clinicId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalToday, totalMonth, totalAll, totalPaid, slaRows, pixRows] = await Promise.all([
      this.prisma.appointment.count({
        where: { clinicId, createdAt: { gte: startOfToday } },
      }),
      this.prisma.appointment.count({
        where: { clinicId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.appointment.count({ where: { clinicId } }),
      this.prisma.appointment.count({ where: { clinicId, status: AppointmentStatus.PAID } }),
      this.prisma.appointment.findMany({
        where: { clinicId, handoffTime: { not: null } },
        select: { handoffTime: true, createdAt: true },
      }),
      this.prisma.appointment.findMany({
        where: { clinicId, status: AppointmentStatus.PAID, paymentConfirmedAt: { gte: thirtyDaysAgo } },
        select: { paymentConfirmedAt: true },
      }),
    ]);

    const conversionRate = totalAll > 0 ? Math.round((totalPaid / totalAll) * 1000) / 1000 : 0;

    const avgSlaMinutes =
      slaRows.length > 0
        ? Math.round(
            (slaRows.reduce((sum, r) => sum + (r.handoffTime!.getTime() - r.createdAt.getTime()), 0) /
              slaRows.length /
              60000) *
              10,
          ) / 10
        : 0;

    const pixMap = new Map<string, number>();
    for (const r of pixRows) {
      if (!r.paymentConfirmedAt) continue;
      const date = r.paymentConfirmedAt.toISOString().split('T')[0];
      pixMap.set(date, (pixMap.get(date) ?? 0) + 1);
    }
    const pixConfirmedByDay = Array.from(pixMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalToday, totalMonth, conversionRate, avgSlaMinutes, pixConfirmedByDay };
  }

  // ── GET /clinics/:id/patients ─────────────────────────────────────────────

  async findPatients(clinicId: string) {
    return this.prisma.patient.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        whatsappPhone: true,
        botPaused: true,
        requiresHuman: true,
        createdAt: true,
        appointments: {
          select: {
            id: true,
            status: true,
            procedureName: true,
            scheduledAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
