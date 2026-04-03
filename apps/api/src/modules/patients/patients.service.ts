import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

const MAX_MESSAGES = 50;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMessages(patientId: string, callerClinicId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, clinicId: true, whatsappPhone: true },
    });

    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.clinicId !== callerClinicId) throw new ForbiddenException('Acesso negado a este paciente');

    // 1. Tenta Redis primeiro
    const redisHistory = await this.redis.getConversationHistory(patient.whatsappPhone);
    if (redisHistory.length > 0) {
      const slice = redisHistory.slice(-MAX_MESSAGES);
      return { source: 'redis' as const, messages: slice };
    }

    // 2. Fallback: banco (audit log persistente)
    const dbMessages = await this.prisma.message.findMany({
      where: { patientId },
      select: { id: true, role: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_MESSAGES,
    });

    return {
      source: 'database' as const,
      messages: dbMessages.reverse(), // mais antigo primeiro
    };
  }
}
