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
});

export const SavedSearchSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  dataCriacao: z.string(),
  filtro: z.any(), // Reference to Filtro schema
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

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SavedSearch = z.infer<typeof SavedSearchSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type WordCloudItem = z.infer<typeof WordCloudItemSchema>;
export type UserStatistics = z.infer<typeof UserStatisticsSchema>;
