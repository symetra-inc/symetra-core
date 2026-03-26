import { z } from 'zod';

export const asaasPayloadSchema = z.object({
  event: z.string(),
  payment: z.object({
    id: z.string(),
  }),
});

// Inferência automática de tipo para o TypeScript
export type AsaasPayloadDto = z.infer<typeof asaasPayloadSchema>;