import { z } from "zod";

/**
 * Shared primitive schemas used across multiple API responses
 * These match the exact structure and terminology from the real API
 */

// Geolocation schema
export const GeolocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
});

// Request form with geolocation
export const RequisicaoFormSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(0),
  size: z.number().int().min(1).max(100),
});

// Common response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    timestamp: z.string().datetime().optional(),
    status: z.number().optional(),
  });

// Error response schema
export const ErrorResponseSchema = z.object({
  timestamp: z.string().datetime(),
  status: z.number(),
  error: z.string(),
  message: z.string(),
  userMessage: z.string().optional(),
  path: z.string(),
});

// Situacao object used in tema responses
export const SituacaoSchema = z.object({
  valor: z.string(),
  descricao: z.string(),
});

// Assunto object used in tema responses
export const AssuntoSchema = z.object({
  codigo: z.number(),
  descricao: z.string(),
});

// ProcessoParadigma object used in tema responses
export const ProcessoParadigmaSchema = z.object({
  numero: z.string(),
  link: z.string().nullable(), // link can be null
  classe: z.string().nullable().optional(),
});

// LimiteSuspensao object used in tema responses
export const LimiteSuspensaoSchema = z.object({
  dataSuspensao: z.string().nullable().optional(),
  dataFimSuspensao: z.string().nullable().optional(),
  detalheAbrangenciaEspecifica: z.string().nullable().optional(),
  linkDecisao: z.string().nullable().optional(),
  parametro: z.string(),
});

// Base reference legislativa item (used in multiple contexts)
export const ReferenciaLegislativaItemSchema = z.string();

// Reference legislativa - can be array or string or null
export const ReferenciaLegislativaSchema = z
  .union([z.array(ReferenciaLegislativaItemSchema), z.string(), z.null()])
  .optional();

// Common date fields (some APIs return null, some return undefined)
export const OptionalDateSchema = z.string().nullable().optional();
export const RequiredDateSchema = z.string();

// Common ID fields
export const OptionalStringIdSchema = z.string().optional();
export const OptionalNumberIdSchema = z.number().optional();

// Types
export type Geolocation = z.infer<typeof GeolocationSchema>;
export type RequisicaoForm = z.infer<typeof RequisicaoFormSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Situacao = z.infer<typeof SituacaoSchema>;
export type Assunto = z.infer<typeof AssuntoSchema>;
export type ProcessoParadigma = z.infer<typeof ProcessoParadigmaSchema>;
export type LimiteSuspensao = z.infer<typeof LimiteSuspensaoSchema>;
export type ReferenciaLegislativa = z.infer<typeof ReferenciaLegislativaSchema>;
