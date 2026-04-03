// TODO: remover após migração completa para REST API (apps/web/src/lib/api.ts).
// Ainda usado em: chat/actions.ts (getPatients, toggleBotStatus, sendManualMessage),
// agency/actions.ts (getAgencyMetrics) — endpoints correspondentes ainda não existem na API.
//
// TODO: Este singleton usa PrismaClient diretamente (padrão Next.js).
// O schema canônico agora vive em apps/api/prisma/schema.prisma.
// Após qualquer alteração no schema, rodar: pnpm --filter api exec prisma generate
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
