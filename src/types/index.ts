/**
 * Falcão API TypeScript Type Definitions
 *
 * This file exports all TypeScript types used by the Falcão API client.
 * These types are automatically inferred from Zod schemas to ensure
 * runtime validation matches compile-time types.
 */

import type { Notification } from "../schemas/user";

// Re-export admin types from schemas
export type { CacheStatus } from "../schemas/admin";
// Re-export AI types from schemas
export type {
  ConversationRequest,
  ConversationResponse,
} from "../schemas/ai";
// Re-export common types
export type {
  ErrorResponse,
  Geolocation,
  Pagination,
  RequisicaoForm,
} from "../schemas/common";
// Re-export document types
export type {
  AcaoBotaoForm,
  BaseDocumento,
  CitacaoResponse,
  Documento,
  DocumentResponse,
  TextoResponse,
} from "../schemas/documents";
export { DocumentoTipo } from "../schemas/documents";
// Re-export search types
export type {
  AutocompleteResponse,
  CountResponse,
  DataPublication,
  DataUpdate,
  Filtro,
  FiltroDisponivel,
  SearchResponse,
  SystemVersions,
  Tribunal,
  ValorFiltro,
} from "../schemas/search";
// Re-export user types from schemas
export type {
  Notification,
  SavedSearch,
  UserProfile,
  UserRanking,
  UserStatistics,
  WordCloudItem,
} from "../schemas/user";

// Additional utility types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ApiResponse<T> {
  data: T;
  timestamp?: string;
  status?: number;
}

// Filter builder types for better DX
export interface QuickDateFilter {
  type:
    | "Hoje"
    | "Ultimos7Dias"
    | "Ultimos30Dias"
    | "Ultimos90Dias"
    | "UltimoAno";
}

export interface CustomDateFilter {
  type: "Personalizado";
  dataInicio: string;
  dataFim: string;
}

export type DateFilter = QuickDateFilter | CustomDateFilter;

// Document collection types
export type DocumentCollection =
  | "acordaos"
  | "precedentes"
  | "sentencas"
  | "decisoesmonocraticas"
  | "recursorevista"
  | "precedentesBNP";

// Precedent types
export type PrecedentType = "J" | "N"; // Julgados | Não julgados

// Ementa filter
export type EmentaFilter = "S" | "N"; // Sim | Não

// Common API parameters that are automatically added
export interface CommonApiParams {
  sessionId: string;
  juristkn: string;
  latitude?: number;
  longitude?: number;
  cidade?: string;
  estado?: string;
  pais?: string;
}

// Search operator types for advanced search
export interface SearchOperators {
  exactPhrase?: string[]; // "exact phrase"
  mandatoryTerms?: string[]; // +term
  excludeTerms?: string[]; // -term
  orTerms?: string[][]; // term1 OR term2
}

// Helper type for building complex searches
export interface AdvancedSearchBuilder {
  baseQuery?: string;
  operators?: SearchOperators;
  filters?: import("../schemas/search").Filtro;
  pagination?: import("../schemas/common").Pagination;
}

// Response status types
export type ResponseStatus = "success" | "error" | "partial";

// Cache group types
export type CacheGroup = "Pesquisa" | "Documentos" | "Sistema" | "Usuario";

// Notification priority
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

// Extended notification type with additional metadata
export interface ExtendedNotification extends Notification {
  priority?: NotificationPriority;
  expiresAt?: string;
  actionUrl?: string;
  tags?: string[];
}

// Search result metadata
export interface SearchMetadata {
  searchId: string;
  executionTime: number;
  cached: boolean;
  version: string;
}

// Document action types
export type DocumentActionType =
  | "copiarInteiroTeor"
  | "citarDecisao"
  | "copiarDecisao"
  | "abrirInteiroTeor"
  | "gerarPdf"
  | "compartilhar";

// User preferences
export interface UserPreferences {
  resultadosPorPagina: number;
  abrirDocumentosNovaAba: boolean;
  mostrarEmentas: boolean;
  ordenacaoPadrao: "relevancia" | "dataDecrescente" | "dataCrescente";
  tribunaisPreferidos: string[];
}

// System status
export interface SystemStatus {
  online: boolean;
  version: string;
  lastUpdate: string;
  maintenance: {
    scheduled: boolean;
    message?: string;
    startTime?: string;
    endTime?: string;
  };
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Export grouped types for better organization
export namespace FalcaoAPI {
  // Common types
  export type Geolocation = import("../schemas/common").Geolocation;
  export type RequisicaoForm = import("../schemas/common").RequisicaoForm;
  export type Pagination = import("../schemas/common").Pagination;

  // Document types
  export type Documento = import("../schemas/documents").Documento;
  export type DocumentoTipo = import("../schemas/documents").DocumentoTipo;

  // Search types
  export type Filtro = import("../schemas/search").Filtro;
  export type SearchResponse = import("../schemas/search").SearchResponse;
  export type SystemVersions = import("../schemas/search").SystemVersions;
  export type DataUpdate = import("../schemas/search").DataUpdate;
  export type DataPublication = import("../schemas/search").DataPublication;

  // User types
  export type UserProfile = import("../schemas/user").UserProfile;
  export type Notification = import("../schemas/user").Notification;
  export type SavedSearch = import("../schemas/user").SavedSearch;
  export type WordCloudItem = import("../schemas/user").WordCloudItem;
  export type UserStatistics = import("../schemas/user").UserStatistics;
  export type UserRanking = import("../schemas/user").UserRanking;

  // AI types
  export type ConversationRequest = import("../schemas/ai").ConversationRequest;
  export type ConversationResponse =
    import("../schemas/ai").ConversationResponse;

  // Admin types
  export type CacheStatus = import("../schemas/admin").CacheStatus;
  export type SystemInfo = import("../schemas/admin").SystemInfo;
}

// Type guards
export const isErrorResponse = (
  response: any
): response is import("../schemas/common").ErrorResponse => {
  return !!(
    response &&
    typeof response.status === "number" &&
    typeof response.error === "string" &&
    typeof response.message === "string"
  );
};

export const isDocumento = (
  obj: any
): obj is import("../schemas/documents").Documento => {
  return !!(
    obj &&
    (typeof obj.id === "string" || typeof obj.id === "number") &&
    typeof obj.tribunal === "string" &&
    typeof obj.numeroProcesso === "string"
  );
};

export const isPaginatedResponse = <T>(
  obj: any
): obj is PaginatedResponse<T> => {
  return !!(
    obj &&
    Array.isArray(obj.content) &&
    typeof obj.totalElements === "number" &&
    typeof obj.totalPages === "number" &&
    typeof obj.number === "number"
  );
};

// Branded types for extra type safety
export type ProcessNumber = string & { readonly brand: unique symbol };
export type AuthToken = string & { readonly brand: unique symbol };
export type SessionId = string & { readonly brand: unique symbol };
export type ConversationId = string & { readonly brand: unique symbol };
export type DocumentId = string & { readonly brand: unique symbol };

// Helper functions to create branded types
export const toProcessNumber = (value: string): ProcessNumber =>
  value as ProcessNumber;
export const toAuthToken = (value: string): AuthToken => value as AuthToken;
export const toSessionId = (value: string): SessionId => value as SessionId;
export const toConversationId = (value: string): ConversationId =>
  value as ConversationId;
export const toDocumentId = (value: string): DocumentId => value as DocumentId;

// Utility type to make all properties optional recursively
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Utility type to extract array element type
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// Utility type for API method parameters
export type ApiMethodParams<T extends (...args: any) => any> = Parameters<T>;

// Utility type for API method return type (unwrapped from Promise)
export type ApiMethodReturn<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;
