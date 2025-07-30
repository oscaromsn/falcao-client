import { z } from "zod";

// Admin schemas
export const CacheStatusSchema = z.object({
  nome: z.string(),
  grupo: z.string(),
  tamanho: z.number(),
  totalEmUso: z.number(),
  totalBuscadoNoCache: z.number(),
  percentualAcessoCache: z.string(),
  totalBuscadoForaDoCache: z.number(),
  percentualForaDoCache: z.string(),
});

export const SystemInfoSchema = z.object({
  version: z.string(),
  uptime: z.number(),
  memory: z.object({
    used: z.number(),
    total: z.number(),
  }),
  activeConnections: z.number(),
});

// Export types
export type CacheStatus = z.infer<typeof CacheStatusSchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
