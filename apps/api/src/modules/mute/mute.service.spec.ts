import { Test, TestingModule } from '@nestjs/testing';
import { MuteService } from './mute.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

const mockPrisma = {
  session: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('MuteService', () => {
  let service: MuteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<MuteService>(MuteService);
    jest.clearAllMocks();
  });

  // ── getIsAiMuted ──────────────────────────────────────────────────────────

  describe('getIsAiMuted', () => {
    it('returns true from cache without hitting Postgres', async () => {
      mockRedis.get.mockResolvedValue('true');

      const result = await service.getIsAiMuted('session-1');

      expect(result).toBe(true);
      expect(mockPrisma.session.findUnique).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('returns false from cache without hitting Postgres', async () => {
      mockRedis.get.mockResolvedValue('false');

      const result = await service.getIsAiMuted('session-1');

      expect(result).toBe(false);
      expect(mockPrisma.session.findUnique).not.toHaveBeenCalled();
    });

    it('queries Postgres on cache miss and populates cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.session.findUnique.mockResolvedValue({ isAiMuted: true });

      const result = await service.getIsAiMuted('session-2');

      expect(result).toBe(true);
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-2' },
        select: { isAiMuted: true },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:session-2:isAiMuted',
        'true',
        60,
      );
    });

    it('returns false and caches false when session does not exist in Postgres', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const result = await service.getIsAiMuted('nonexistent');

      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:nonexistent:isAiMuted',
        'false',
        60,
      );
    });

    it('uses the correct Redis key pattern', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.session.findUnique.mockResolvedValue({ isAiMuted: false });

      await service.getIsAiMuted('abc-123');

      expect(mockRedis.get).toHaveBeenCalledWith('session:abc-123:isAiMuted');
    });
  });

  // ── setIsAiMuted ──────────────────────────────────────────────────────────

  describe('setIsAiMuted', () => {
    it('updates Postgres then invalidates cache', async () => {
      mockPrisma.session.update.mockResolvedValue({ id: 'session-1', isAiMuted: true });
      mockRedis.del.mockResolvedValue(1);

      await service.setIsAiMuted('session-1', true);

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isAiMuted: true },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('session:session-1:isAiMuted');
    });

    it('calls Postgres before Redis (order check)', async () => {
      const callOrder: string[] = [];
      mockPrisma.session.update.mockImplementation(async () => {
        callOrder.push('postgres');
        return { id: 's', isAiMuted: false };
      });
      mockRedis.del.mockImplementation(async () => {
        callOrder.push('redis');
        return 1;
      });

      await service.setIsAiMuted('s', false);

      expect(callOrder).toEqual(['postgres', 'redis']);
    });

    it('throws and does NOT touch Redis when Postgres update fails', async () => {
      const dbError = new Error('DB connection refused');
      mockPrisma.session.update.mockRejectedValue(dbError);

      await expect(service.setIsAiMuted('session-1', false)).rejects.toThrow(dbError);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('resolves without throwing when Redis DEL fails after a successful Postgres update', async () => {
      mockPrisma.session.update.mockResolvedValue({ id: 'session-1', isAiMuted: false });
      mockRedis.del.mockRejectedValue(new Error('Redis unavailable'));

      await expect(service.setIsAiMuted('session-1', false)).resolves.toBeUndefined();
      expect(mockPrisma.session.update).toHaveBeenCalled();
    });
  });
});
