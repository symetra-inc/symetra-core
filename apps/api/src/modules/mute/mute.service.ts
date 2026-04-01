import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

const MUTE_TTL_SECONDS = 60;

const muteKey = (sessionId: string): string =>
  `session:${sessionId}:isAiMuted`;

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
}
