/**
 * Central export file for all Zod schemas and TypeScript types
 * This provides a single import point for all schema-related exports
 */

export type {
  // Types
  CacheStatus,
  SystemInfo,
} from "./admin";
// Re-export everything from admin schemas
export {
  // Schemas
  CacheStatusSchema,
  SystemInfoSchema,
} from "./admin";
export type {
  // Types
  ConversationRequest,
  ConversationResponse,
} from "./ai";
// Re-export everything from AI schemas
export {
  // Schemas
  ConversationRequestSchema,
  ConversationResponseSchema,
} from "./ai";
export type {
  ErrorResponse,
  // Types
  Geolocation,
  Pagination,
  RequisicaoForm,
} from "./common";
// Re-export everything from common schemas
export {
  ApiResponseSchema,
  ErrorResponseSchema,
  // Schemas
  GeolocationSchema,
  PaginationSchema,
  RequisicaoFormSchema,
} from "./common";
export type {
  AcaoBotaoForm,
  // Types
  BaseDocumento,
  CitacaoResponse,
  Documento,
  DocumentResponse,
  TextoResponse,
} from "./documents";
// Re-export everything from document schemas
export {
  AcaoBotaoFormSchema,
  // Schemas
  BaseDocumentoSchema,
  CitacaoResponseSchema,
  DocumentoSchema,
  // Enums
  DocumentoTipo,
  DocumentResponseSchema,
  TextoResponseSchema,
} from "./documents";
export type {
  AutocompleteResponse,
  CountResponse,
  // Types
  Filtro,
  FiltroDisponivel,
  SearchResponse,
  Tribunal,
  ValorFiltro,
} from "./search";
// Re-export everything from search schemas
export {
  AutocompleteResponseSchema,
  CountResponseSchema,
  // Schemas
  FiltroSchema,
  SearchResponseSchema,
  TribunalSchema,
} from "./search";
export type {
  Notification,
  SavedSearch,
  // Types
  UserProfile,
  UserStatistics,
  WordCloudItem,
} from "./user";
// Re-export everything from user schemas
export {
  NotificationSchema,
  SavedSearchSchema,
  // Schemas
  UserProfileSchema,
  UserStatisticsSchema,
  WordCloudItemSchema,
} from "./user";

// Utility type exports for common patterns
export type ApiResponse<T> = {
  data: T;
  timestamp?: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

// Common validation helpers
export { z } from "zod";
