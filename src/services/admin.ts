import { type CacheStatus, CacheStatusSchema } from "@schemas/admin";
import { BaseService } from "@services/base";
import { z } from "zod";

export class AdminService extends BaseService {
  async getCacheStatus(): Promise<CacheStatus[]> {
    return this.get("/statusCache", z.array(CacheStatusSchema));
  }

  async clearCache(cacheName: string): Promise<void> {
    await this.put(`/statusCache/${cacheName}`, z.void());
  }
}
