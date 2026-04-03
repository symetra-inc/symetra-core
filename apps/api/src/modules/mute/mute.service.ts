import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

const MUTE_TTL_SECONDS = 60;
const AI_MUTED_TTL_SECONDS = 24 * 60 * 60; // 24h

const muteKey = (sessionId: string): string =>
  `session:${sessionId}:isAiMuted`;

const aiMutedKey = (clinicId: string, patientId: string): string =>
  `clinic:${clinicId}:patient:${patientId}:aiMuted`;

@Injectable()
export class MuteService {
  private readonly logger = new Logger(MuteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getIsAiMuted(sessionId: string): Promise<boolean> {
    const key = muteKey(sessionId);

    // 1. Cache-first
    const cached = await this.redis.get(key);
    if (cached !== null) {
      return cached === 'true';
    }

    // 2. Cache miss → Postgres (source of truth)
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { isAiMuted: true },
    });

    const value = session?.isAiMuted ?? false;

    // 3. Populate cache with TTL
    await this.redis.set(key, String(value), MUTE_TTL_SECONDS);

    return value;
  }

  async setIsAiMuted(sessionId: string, value: boolean): Promise<void> {
    // 1. Write to Postgres first — failure aborts here, Redis untouched
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { isAiMuted: value },
      });
    } catch (error) {
      this.logger.error(
        `[MuteService] Falha ao atualizar isAiMuted no Postgres (sessão=${sessionId}): ${error.message}`,
      );
      throw error;
    }

    // 2. Invalidate cache — failure is logged but not propagated
    try {
      await this.redis.del(muteKey(sessionId));
    } catch (error) {
      this.logger.error(
        `[MuteService] Falha ao invalidar cache Redis (sessão=${sessionId}): ${error.message}`,
      );
    }
  }

  // ── Appointment-scoped dual (Redis 24h + Banco) ───────────────────────────

  /**
   * Leitura: Redis-first → fallback para Banco se cache miss ou Redis offline.
   * Chave: clinic:{clinicId}:patient:{patientId}:aiMuted  TTL: 24h
   */
  async isAiMuted(appointmentId: string): Promise<boolean> {
    // 1. Busca appointment — dá o valor do Banco e os componentes da chave Redis
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { clinicId: true, patientId: true, isAiMuted: true },
    });

    if (!appt) return false;

    const key = aiMutedKey(appt.clinicId, appt.patientId);

    // 2. Redis-first
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) return cached === 'true';
    } catch (err) {
      this.logger.warn(
        `[MuteService] Redis offline, usando Banco (appt=${appointmentId}): ${err.message}`,
      );
      return appt.isAiMuted;
    }

    // 3. Cache miss — popula e retorna valor do Banco
    try {
      await this.redis.set(key, String(appt.isAiMuted), AI_MUTED_TTL_SECONDS);
    } catch {
      // Redis offline — não é crítico
    }

    return appt.isAiMuted;
  }

  /**
   * Escrita: Banco primeiro → Redis segundo (não-fatal se Redis cair).
   * O update retorna clinicId/patientId para montar a chave sem query extra.
   */
  async setAiMuted(appointmentId: string, value: boolean): Promise<void> {
    // 1. Banco é a fonte da verdade — falha aqui aborta tudo
    let clinicId: string;
    let patientId: string;

    try {
      const updated = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { isAiMuted: value },
        select: { clinicId: true, patientId: true },
      });
      clinicId = updated.clinicId;
      patientId = updated.patientId;
    } catch (error) {
      this.logger.error(
        `[MuteService] Falha ao atualizar isAiMuted no Postgres (appt=${appointmentId}): ${error.message}`,
      );
      throw error;
    }

    // 2. Atualiza Redis — falha não propaga
    const key = aiMutedKey(clinicId, patientId);
    try {
      await this.redis.set(key, String(value), AI_MUTED_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(
        `[MuteService] Redis offline, cache não atualizado (appt=${appointmentId}): ${err.message}`,
      );
    }
  }
}
