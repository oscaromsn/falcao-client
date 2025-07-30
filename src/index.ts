// Main client

export type { FalcaoClientConfig } from "./client";
export { FalcaoClient } from "./client";

// Core errors (classes, not types)
export {
  FalcaoApiError,
  FalcaoAuthenticationError,
  FalcaoNetworkError,
  FalcaoValidationError,
} from "./core/errors";
export type { SessionConfig } from "./core/session";
// Core session (class, not types)
export { SessionManager } from "./core/session";
// Re-export enums and non-type values
export { DocumentoTipo } from "./schemas/documents";
// Services (classes, not types)
export { AdminService } from "./services/admin";
export { AIService } from "./services/ai";
export { DocumentService } from "./services/documents";
export { SearchService } from "./services/search";
export { UserService } from "./services/user";
// Export all types from the types index
// Export FalcaoAPI namespace as type
export type {
  // Document types
  AcaoBotaoForm,
  // Utility types
  AdvancedSearchBuilder,
  ApiMethodParams,
  ApiMethodReturn,
  ApiResponse,
  ArrayElement,
  AuthToken,
  // Search types
  AutocompleteResponse,
  BaseDocumento,
  CacheGroup,
  // Admin types
  CacheStatus,
  CitacaoResponse,
  CommonApiParams,
  ConversationId,
  // AI types
  ConversationRequest,
  ConversationResponse,
  CountResponse,
  CustomDateFilter,
  DateFilter,
  DeepPartial,
  DocumentActionType,
  DocumentCollection,
  DocumentId,
  Documento,
  DocumentResponse,
  EmentaFilter,
  ErrorResponse,
  ExtendedNotification,
  FalcaoAPI,
  Filtro,
  FiltroDisponivel,
  // Common types
  Geolocation,
  // User types
  Notification,
  NotificationPriority,
  PaginatedResponse,
  Pagination,
  PrecedentType,
  ProcessNumber,
  QuickDateFilter,
  RateLimitInfo,
  RequisicaoForm,
  ResponseStatus,
  SavedSearch,
  SearchMetadata,
  SearchOperators,
  SearchResponse,
  SessionId,
  SystemStatus,
  TextoResponse,
  Tribunal,
  UserPreferences,
  UserProfile,
  ValorFiltro,
} from "./types";
// Export non-type values from types
export {
  isDocumento,
  isErrorResponse,
  isPaginatedResponse,
  toAuthToken,
  toConversationId,
  toDocumentId,
  toProcessNumber,
  toSessionId,
} from "./types";
