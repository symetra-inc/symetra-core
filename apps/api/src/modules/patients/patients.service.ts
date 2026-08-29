import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMessages(patientId: string, callerClinicId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, clinicId: true },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.clinicId !== callerClinicId) throw new ForbiddenException('Acesso negado a este paciente');

    const messages = await this.prisma.message.findMany({
      where: { patientId },
      select: { id: true, role: true, content: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return { source: 'database' as const, messages };
  }
}
