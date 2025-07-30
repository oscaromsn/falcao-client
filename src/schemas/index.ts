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
  // Types
  Assunto,
  ErrorResponse,
  Geolocation,
  LimiteSuspensao,
  Pagination,
  ProcessoParadigma,
  ReferenciaLegislativa,
  RequisicaoForm,
  Situacao,
} from "./common";
// Re-export everything from common schemas
export {
  ApiResponseSchema,
  AssuntoSchema,
  ErrorResponseSchema,
  // Schemas
  GeolocationSchema,
  LimiteSuspensaoSchema,
  OptionalDateSchema,
  OptionalNumberIdSchema,
  OptionalStringIdSchema,
  PaginationSchema,
  ProcessoParadigmaSchema,
  ReferenciaLegislativaItemSchema,
  ReferenciaLegislativaSchema,
  RequiredDateSchema,
  RequisicaoFormSchema,
  SituacaoSchema,
} from "./common";
export type {
  AcaoBotaoForm,
  AcordaoDocumento,
  AcordaoFields,
  // Types
  BaseDocumento,
  CitacaoResponse,
  CoreDocumentFields,
  Documento,
  DocumentResponse,
  ExtendedDocumentFields,
  TextoResponse,
} from "./documents";
// Re-export everything from document schemas
export {
  AcaoBotaoFormSchema,
  AcordaoDocumentoSchema,
  AcordaoFieldsSchema,
  // Schemas
  BaseDocumentoSchema,
  CitacaoResponseSchema,
  CoreDocumentFieldsSchema,
  DocumentoSchema,
  // Enums
  DocumentoTipo,
  DocumentResponseSchema,
  ExtendedDocumentFieldsSchema,
  TextoResponseSchema,
} from "./documents";

// Re-export highlight schemas
export type {
  AllHighlightFields,
  BaseHighlightField,
  HighlightEmenta,
  HighlightQuestao,
  HighlightTese,
  HighlightTextoAcordao,
  HighlightTextoAcordaoAnonimizado,
  HighlightTextoAcordaoDecisao,
  HighlightTextoAcordaoMerito,
  HighlightTextoDecisaoAdmissao,
  HighlightTextoDecisaoSuspensao,
  HighlightTextoEmentaAdmissao,
  HighlightTextoEmentaMerito,
} from "./highlight";
export {
  AllHighlightFieldsSchema,
  BaseHighlightFieldSchema,
} from "./highlight";
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
// Re-export tema schemas
export type { TemaTopFiveItem } from "./tema";
export { TemaTopFiveItemSchema } from "./tema";
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
