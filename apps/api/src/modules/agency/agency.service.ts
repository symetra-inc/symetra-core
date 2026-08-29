import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// ── Planos Symetra ────────────────────────────────────────────────────────────
// Baseado em volume mensal de agendamentos
const PLAN_FIXED: Record<string, number> = {
  STARTER: 1497, // ≤ 40 agendamentos/mês
  GROWTH: 1997,  // 41-80 agendamentos/mês
  SCALE: 2997,   // > 80 agendamentos/mês (tudo incluso, sem variável)
};

function planName(monthlyAvg: number): string {
  if (monthlyAvg > 80) return 'SCALE';
  if (monthlyAvg > 40) return 'GROWTH';
  return 'STARTER';
}

// ── Tiers da Agência ──────────────────────────────────────────────────────────
// Aplicado apenas para clínicas com > 12 meses na agência (Fase 3 do Cliff)
function tierRevShareRate(activeClinicsCount: number): number {
  if (activeClinicsCount >= 16) return 0.05;   // Gold
  if (activeClinicsCount >= 6) return 0.025;   // Silver
  return 0;                                     // Certified
}

// ── Cliff Protocol ────────────────────────────────────────────────────────────
// O timer começa na data em que a clínica foi adicionada à agência (clinic.createdAt)
function cliffPhase(
  clinicCreatedAt: Date,
  activeClinicsCount: number,
): { phase: 1 | 2 | 3; rate: number } {
  const months = (Date.now() - clinicCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months <= 3) return { phase: 1, rate: 0.20 };
  if (months <= 12) return { phase: 2, rate: 0.10 };
  return { phase: 3, rate: tierRevShareRate(activeClinicsCount) };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AgencyService {
  constructor(private readonly prisma: PrismaService) {}

  async getClinics(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true },
    });
    if (!agency) throw new NotFoundException('Agência não encontrada');

    const clinics = await this.prisma.clinic.findMany({
      where: { agencyId },
      select: { id: true, name: true, createdAt: true },
    });

    if (clinics.length === 0) return [];

    const activeClinicsCount = clinics.length;
    const clinicIds = clinics.map((c) => c.id);

    const [leadGroups, paidGroups] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ['clinicId'],
        where: { clinicId: { in: clinicIds } },
        _count: { id: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['clinicId'],
        where: { clinicId: { in: clinicIds }, status: AppointmentStatus.PAID },
        _count: { id: true },
      }),
    ]);

    const leadsMap = new Map(leadGroups.map((g) => [g.clinicId, g._count.id]));
    const paidMap = new Map(paidGroups.map((g) => [g.clinicId, g._count.id]));

    return clinics.map((clinic) => {
      const totalLeads = leadsMap.get(clinic.id) ?? 0;
      const totalPaid = paidMap.get(clinic.id) ?? 0;

      // Estimar volume mensal com base no total de leads desde a criação da clínica
      const monthsActive = Math.max(
        (Date.now() - clinic.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        1,
      );
      const monthlyAvg = totalLeads / monthsActive;
      const plan = planName(monthlyAvg);
      const fixedFee = PLAN_FIXED[plan];

      const { phase: cliffPhaseNum, rate: cliffRate } = cliffPhase(clinic.createdAt, activeClinicsCount);

      return {
        id: clinic.id,
        name: clinic.name,
        totalLeads,
        totalPaid,
        plan,               // STARTER | GROWTH | SCALE
        fixedFee,           // R$1.497 | R$1.997 | R$2.997
        cliffPhase: cliffPhaseNum,
        cliffRate,          // 0.20 | 0.10 | tier%
        estimatedRevShare: cliffRate * fixedFee,
      };
    });
  }
}
