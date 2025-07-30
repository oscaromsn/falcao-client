import type { ErrorResponse } from "@schemas/common";
import type { Documento } from "@schemas/documents";
import type { SearchResponse } from "@schemas/search";
import type { TemaTopFiveItem } from "@schemas/tema";
import type { FalcaoClientConfig } from "@/client";
import type {
  ApiResponse,
  DocumentId,
  Geolocation,
  PaginatedResponse,
  SessionId,
} from "@/types";

// Mock data generators
export const createMockDocument = (
  overrides: Partial<Documento> = {}
): Documento => ({
  id: "doc123",
  tribunal: "STF",
  numeroProcesso: "12345678901234567890",
  tituloDecisao: "Test Document Title",
  ementa: "Test document summary",
  textoCompleto: "Full text of the test document",
  relator: "Ministro Test",
  dataJulgamento: "2024-01-15",
  orgaoJulgador: "Tribunal Pleno",
  classeProcessual: "ADI",
  siglaClasseProcesso: "ADI",
  ...overrides,
});

export const createMockTemaTopFiveItem = (
  overrides: Partial<TemaTopFiveItem> = {}
): TemaTopFiveItem => ({
  tribunal: "STF",
  tituloDecisao: "TEST TEMA DECISION",
  origemDocumentos: "BANJUR",
  descricaoTribunal: "Supremo Tribunal Federal",
  situacao: {
    valor: "EM_VIGOR",
    descricao: "Em Vigor",
  },
  pendenteDecisao: false,
  idTema: "test-tema-1",
  sumula: true,
  teseJuridicaPrevalecente: false,
  orientacaoJurisprudencial: false,
  baseJuridicaAntiga: false,
  conteudoDecisao: "Test decision content for tema",
  id: "tema-id-123",
  relator: "TEST RELATOR",
  numero: "1",
  categoria: "RG",
  tituloCategoria: "Repercussão Geral",
  orgao: "13891",
  descricaoOrgao: "Supremo Tribunal Federal",
  ...overrides,
});

export const createMockSearchResponse = (
  overrides: Partial<SearchResponse> = {}
): SearchResponse => ({
  documentos: [createMockDocument()],
  filtrosDisponiveis: [
    {
      nomeDoFiltro: "tribunal",
      nomeWeb: "Tribunal",
      ordem: 1,
      valoresFiltro: [
        {
          valor: "STF",
          quantidade: 50,
          valorWeb: "Supremo Tribunal Federal",
          valorBalao: "STF",
        },
      ],
    },
  ],
  quantidadeTotal: 100,
  temasTopFive: [createMockTemaTopFiveItem()],
  ...overrides,
});

// DEPRECATED: Real Falcão API returns RAW data without ApiResponse<T> wrapper
// Use grounded mock helpers instead
export const createMockApiResponse = <T>(
  data: T,
  overrides: Partial<ApiResponse<T>> = {}
): ApiResponse<T> => {
  console.warn(
    "⚠️  createMockApiResponse is deprecated - Real API returns raw data. Use grounded helpers instead."
  );
  return {
    data,
    status: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
};

export const createMockErrorResponse = (
  overrides: Partial<ErrorResponse> = {}
): ErrorResponse => ({
  timestamp: new Date().toISOString(),
  status: 500,
  error: "Internal Server Error",
  message: "An error occurred while processing the request",
  path: "/api/test",
  ...overrides,
});

export const createMockGeolocation = (
  overrides: Partial<Geolocation> = {}
): Geolocation => ({
  latitude: -23.5505,
  longitude: -46.6333,
  ...overrides,
});

export const createMockClientConfig = (
  overrides: Partial<FalcaoClientConfig> = {}
): FalcaoClientConfig => ({
  baseURL: "https://api.test.com",
  aiBaseURL: "https://ai.test.com",
  timeout: 5000,
  sessionConfig: {
    persistSession: false,
    storageType: "localStorage",
  },
  ...overrides,
});

// Test utilities
export const createMockSessionId = (): SessionId =>
  `session_${Math.random().toString(36).substr(2, 9)}` as SessionId;

export const createMockDocumentId = (): DocumentId =>
  `doc_${Math.random().toString(36).substr(2, 9)}` as DocumentId;

// Async test helpers
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

// Error simulation helpers
export const createNetworkError = (message = "Network Error") =>
  new Error(message);

export const createTimeoutError = (message = "Request Timeout") =>
  new Error(message);

// Mock response builders
export interface MockResponseBuilder<T> {
  data: T;
  status?: number;
  headers?: Record<string, string>;
  delay?: number;
}

export const mockResponse = <T>(options: MockResponseBuilder<T>) => ({
  status: options.status ?? 200,
  headers: {
    "Content-Type": "application/json",
    ...options.headers,
  },
  json: async () => options.data,
  text: async () => JSON.stringify(options.data),
});

// Validation helpers (these should be used within test files where expect is available)
export const validateResponse = <T>(response: ApiResponse<T>) => {
  return (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "status" in response &&
    "timestamp" in response &&
    typeof response.status === "number" &&
    typeof response.timestamp === "string"
  );
};

export const validatePagination = (pagination: unknown): boolean => {
  return (
    pagination !== null &&
    pagination !== undefined &&
    typeof pagination === "object" &&
    "content" in pagination &&
    "totalElements" in pagination &&
    "totalPages" in pagination &&
    "number" in pagination &&
    Array.isArray((pagination as PaginatedResponse<unknown>).content) &&
    typeof (pagination as PaginatedResponse<unknown>).totalElements ===
      "number" &&
    typeof (pagination as PaginatedResponse<unknown>).totalPages === "number" &&
    typeof (pagination as PaginatedResponse<unknown>).number === "number"
  );
};
