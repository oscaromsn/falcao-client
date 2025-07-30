import type { RequisicaoForm } from "@schemas/common";
import { type Tribunal, TribunalSchema } from "@schemas/search";
import { BaseService } from "@services/base";
import { z } from "zod";

// User schemas
const UserProfileSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.email(),
  utilizaIARobusto: z.boolean(),
  configuracoes: z
    .object({
      resultadosPorPagina: z.number(),
      abrirDocumentosNovaAba: z.boolean(),
    })
    .optional(),
});

const SavedSearchSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  dataCriacao: z.string(),
  filtro: z.any(), // Reference to Filtro schema
});

const NotificationSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descricao: z.string(),
  dataCadastro: z.string(),
  lido: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

export class UserService extends BaseService {
  // Profile endpoints
  async getProfile(): Promise<UserProfile> {
    return this.get("/perfil", UserProfileSchema);
  }

  async getFavoriteTribunals(): Promise<Tribunal[]> {
    return this.get("/perfil/tribunaisFavoritos", z.array(TribunalSchema));
  }

  async updateFavoriteTribunals(
    tribunais: Tribunal[],
    requisicao: RequisicaoForm
  ): Promise<void> {
    await this.post("/perfil/tribunaisFavoritos", z.void(), {
      tribunais,
      requisicao,
    });
  }

  async getFavoriteJudges(): Promise<string[]> {
    return this.get("/perfil/magistradosFavoritos", z.array(z.string()));
  }

  async updateFavoriteJudges(
    magistrados: string[],
    requisicao: RequisicaoForm
  ): Promise<void> {
    await this.post("/perfil/magistradosFavoritos", z.void(), {
      magistrados,
      requisicao,
    });
  }

  async getFavoriteJudgingBodies(): Promise<string[]> {
    return this.get("/perfil/orgaosJulgadoresFavoritos", z.array(z.string()));
  }

  async updateFavoriteJudgingBodies(
    orgaos: string[],
    requisicao: RequisicaoForm
  ): Promise<void> {
    await this.post("/perfil/orgaosJulgadoresFavoritos", z.void(), {
      orgaos,
      requisicao,
    });
  }

  // Saved searches
  async getSavedSearches(
    page: number = 0,
    size: number = 20
  ): Promise<{
    content: SavedSearch[];
    totalElements: number;
    totalPages: number;
    number: number;
  }> {
    return this.get(
      "/pesquisasFavoritas",
      z.object({
        content: z.array(SavedSearchSchema),
        totalElements: z.number(),
        totalPages: z.number(),
        number: z.number(),
      }),
      { page, size }
    );
  }

  async saveSearch(
    titulo: string,
    filtro: any,
    requisicao: RequisicaoForm
  ): Promise<SavedSearch> {
    return this.post("/pesquisasFavoritas", SavedSearchSchema, {
      pesquisaFavorita: { titulo },
      filtro,
      requisicao,
    });
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await this.delete(`/pesquisasFavoritas/${id}`, z.void());
  }

  // Notifications
  async getNotifications(
    page: number = 0,
    size: number = 5
  ): Promise<Notification[]> {
    return this.get("/no-auth/notificacoes", z.array(NotificationSchema), {
      page,
      size,
    });
  }

  async markNotificationAsRead(
    notification: Notification,
    requisicao: RequisicaoForm
  ): Promise<void> {
    await this.post("/notificacoes", z.void(), {
      ...notification,
      lido: true,
      requisicao,
    });
  }

  // Analytics
  async getWordCloud(): Promise<Array<{ text: string; weight: number }>> {
    return this.get(
      "/logAcesso/nuvemPalavras",
      z.array(
        z.object({
          text: z.string(),
          weight: z.number(),
        })
      )
    );
  }

  async getUserStatistics(): Promise<{
    totalPesquisas: number;
    documentosVisualizados: number;
    citacoesGeradas: number;
    ranking: number;
    totalUsuarios: number;
  }> {
    return this.get(
      "/logAcesso/estatisticas",
      z.object({
        totalPesquisas: z.number(),
        documentosVisualizados: z.number(),
        citacoesGeradas: z.number(),
        ranking: z.number(),
        totalUsuarios: z.number(),
      })
    );
  }
}
