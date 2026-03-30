import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const HISTORY_TTL_SECONDS = 24 * 60 * 60; // 24 horas
const MAX_HISTORY_MESSAGES = 20;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    // Busca a URL completa do .env (Padrão de mercado para Nuvem/Railway)
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 100, 3000),
      // O tls é necessário para conexões seguras como a do Upstash (rediss://)
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    });

    this.client.on('connect', () => this.logger.log('[REDIS] Conexão estabelecida com sucesso.'));
    this.client.on('error', (err) => this.logger.error(`[REDIS] Erro de conexão: ${err.message}`));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async getConversationHistory(patientPhone: string): Promise<any[]> {
    try {
      const key = `conv:${patientPhone}`;
      const raw = await this.client.get(key);
      if (!raw) return [];
      return JSON.parse(raw) as any[];
    } catch (error) {
      this.logger.error(`[REDIS] Falha ao ler histórico de ${patientPhone}: ${error.message}`);
      return [];
    }
  }

  async saveConversationHistory(patientPhone: string, history: any[]): Promise<void> {
    try {
      const key = `conv:${patientPhone}`;
      const trimmed = history.length > MAX_HISTORY_MESSAGES
        ? history.slice(-MAX_HISTORY_MESSAGES)
        : history;
      await this.client.set(key, JSON.stringify(trimmed), 'EX', HISTORY_TTL_SECONDS);
    } catch (error) {
      this.logger.error(`[REDIS] Falha ao salvar histórico de ${patientPhone}: ${error.message}`);
    }
  }
}