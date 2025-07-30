import { FiltroSchema, TribunalSchema } from "@schemas/search";
import { z } from "zod";

// User schemas
export const UserProfileSchema = z.object({
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
  // Error flags for loading favorites
  erroAoCarregarMagistradoFavorito: z.boolean().optional(),
  erroAoCarregarOrgaoJulgadorFavorito: z.boolean().optional(),
  erroAoCarregarTribunaisFavoritos: z.boolean().optional(),
  // Cached favorites data
  tribunaisFavoritos: z.array(TribunalSchema).nullable().optional(),
  orgaoJulgadorFavorito: z.string().nullable().optional(),
  magistradoFavorito: z.string().nullable().optional(),
});

export const SavedSearchSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  dataCriacao: z.string(),
  filtro: FiltroSchema,
});

export const NotificationSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descricao: z.string(),
  dataCadastro: z.string(),
  lido: z.boolean(),
});

// Word cloud and statistics schemas
export const WordCloudItemSchema = z.object({
  text: z.string(),
  weight: z.number(),
});

export const UserStatisticsSchema = z.object({
  totalPesquisas: z.number(),
  documentosVisualizados: z.number(),
  citacoesGeradas: z.number(),
  ranking: z.number(),
  totalUsuarios: z.number(),
});

export const UserRankingSchema = z.object({
  posicao: z.number(),
  totalPesquisas: z.number(),
  totalUsuarios: z.number(),
  percentil: z.number().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type WordCloudItem = z.infer<typeof WordCloudItemSchema>;
export type UserStatistics = z.infer<typeof UserStatisticsSchema>;
export type UserRanking = z.infer<typeof UserRankingSchema>;
