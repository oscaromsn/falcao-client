import { BaseService } from "@services/base";
import { z } from "zod";

const CacheStatusSchema = z.object({
  nome: z.string(),
  grupo: z.string(),
  tamanho: z.number(),
  totalEmUso: z.number(),
  totalBuscadoNoCache: z.number(),
  percentualAcessoCache: z.number(),
  totalBuscadoForaDoCache: z.number(),
  percentualForaDoCache: z.number(),
});

export type CacheStatus = z.infer<typeof CacheStatusSchema>;

export class AdminService extends BaseService {
  async getCacheStatus(): Promise<CacheStatus[]> {
    return this.get("/statusCache", z.array(CacheStatusSchema));
  }

  async clearCache(cacheName: string): Promise<void> {
    await this.put(`/statusCache/${cacheName}`, z.void());
  }
}
