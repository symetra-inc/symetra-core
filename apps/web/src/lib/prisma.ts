// TODO: Este singleton usa PrismaClient diretamente (padrão Next.js).
// O schema canônico agora vive em apps/api/prisma/schema.prisma.
// Após qualquer alteração no schema, rodar: pnpm --filter api exec prisma generate
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
