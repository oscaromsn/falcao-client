import { HttpResponse, http } from "msw";
import {
  createMockApiResponse,
  createMockDocument,
  createMockErrorResponse,
  createMockSearchResponse,
} from "../utils/test-helpers";

const BASE_URL = "https://api.test.com";
const AI_BASE_URL = "https://ai.test.com";

export const handlers = [
  // Search endpoints
  http.get(`${BASE_URL}/no-auth/pesquisa`, () => {
    const mockResponse = createMockApiResponse(createMockSearchResponse());
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/no-auth/autocompletar`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("texto") || "";

    const mockResponse = createMockApiResponse({
      sugestoes: [
        `${query} suggestion 1`,
        `${query} suggestion 2`,
        `${query} suggestion 3`,
      ],
      queriesRelated: [],
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/no-auth/pesquisa/count`, () => {
    const mockResponse = createMockApiResponse({
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
    });
    return HttpResponse.json(mockResponse);
  }),

  // Information endpoints
  http.get(`${BASE_URL}/no-auth/informacao/tribunais`, () => {
    const mockTribunals = [
      { sigla: "STF", nome: "Supremo Tribunal Federal" },
      { sigla: "STJ", nome: "Superior Tribunal de Justiça" },
      { sigla: "TST", nome: "Tribunal Superior do Trabalho" },
    ];
    const mockResponse = createMockApiResponse(mockTribunals);
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/versao`, () => {
    const mockResponse = createMockApiResponse({
      versoes: [
        {
          versao: "1.2.3",
          dataLancamento: "2024-01-15",
          descricao: "Falcão Client version 1.2.3",
        },
      ],
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/dataIndexacaoDados`, () => {
    const mockResponse = createMockApiResponse({
      dataIndexacao: "2024-01-15",
      ultimaAtualizacao: "2024-01-15T10:00:00Z",
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/dataPublicacaoDados`, () => {
    const mockResponse = createMockApiResponse({
      dataPublicacao: "2024-01-15",
      fonte: "Official Source",
    });
    return HttpResponse.json(mockResponse);
  }),

  // Document endpoints
  http.get(`${BASE_URL}/documents/:id`, ({ params }) => {
    const mockDocument = createMockDocument({
      id: params.id as any,
    });
    const mockResponse = createMockApiResponse(mockDocument);
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/documents/:id/texto`, ({ params }) => {
    const mockResponse = createMockApiResponse({
      id: params.id,
      texto: "Full document text content for testing purposes...",
      metadata: {
        wordCount: 500,
        pages: 5,
      },
    });
    return HttpResponse.json(mockResponse);
  }),

  http.post(`${BASE_URL}/documents/:id/citacoes`, ({ params }) => {
    const mockResponse = createMockApiResponse({
      documentId: params.id,
      citacoes: [
        {
          id: "cite1",
          titulo: "Citation 1",
          tribunal: "STF",
          relevance: 0.95,
        },
        {
          id: "cite2",
          titulo: "Citation 2",
          tribunal: "STJ",
          relevance: 0.88,
        },
      ],
    });
    return HttpResponse.json(mockResponse);
  }),

  // User endpoints
  http.get(`${BASE_URL}/user/profile`, () => {
    const mockResponse = createMockApiResponse({
      id: "user123",
      name: "Test User",
      email: "test@example.com",
      preferences: {
        resultsPerPage: 10,
        defaultTribunal: "STF",
      },
    });
    return HttpResponse.json(mockResponse);
  }),

  http.post(`${BASE_URL}/user/searches`, async ({ request }) => {
    const body = await request.json();
    const mockResponse = createMockApiResponse({
      id: "search123",
      name: (body as any)?.name || "Saved Search",
      query: (body as any)?.query || {},
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/user/searches`, () => {
    const mockResponse = createMockApiResponse([
      {
        id: "search1",
        name: "Constitutional Cases",
        query: { terms: "constitutional" },
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "search2",
        name: "Administrative Law",
        query: { terms: "administrative" },
        createdAt: "2024-01-02T00:00:00Z",
      },
    ]);
    return HttpResponse.json(mockResponse);
  }),

  // Admin endpoints
  http.get(`${BASE_URL}/admin/system/status`, () => {
    const mockResponse = createMockApiResponse({
      status: "healthy",
      uptime: 86400,
      version: "1.0.0",
      database: "connected",
      cache: "healthy",
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${BASE_URL}/admin/cache/status`, () => {
    const mockResponse = createMockApiResponse({
      redis: "connected",
      memory: "75%",
      hitRate: 0.92,
      size: "2.5GB",
    });
    return HttpResponse.json(mockResponse);
  }),

  // AI endpoints
  http.post(`${AI_BASE_URL}/conversation`, async ({ request }) => {
    const body = await request.json();
    const mockResponse = createMockApiResponse({
      conversationId: "conv123",
      response: `AI response to: ${(body as any)?.message || "hello"}`,
      suggestions: [
        "Tell me more about this case",
        "Find similar cases",
        "Explain the legal reasoning",
      ],
    });
    return HttpResponse.json(mockResponse);
  }),

  http.get(`${AI_BASE_URL}/conversation/:id`, ({ params }) => {
    const mockResponse = createMockApiResponse({
      id: params.id,
      messages: [
        {
          role: "user",
          content: "What are the key aspects of this case?",
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          role: "assistant",
          content: "This case involves constitutional interpretation...",
          timestamp: "2024-01-01T10:00:05Z",
        },
      ],
      createdAt: "2024-01-01T10:00:00Z",
    });
    return HttpResponse.json(mockResponse);
  }),

  // Session management
  http.post(`${BASE_URL}/session`, () => {
    const mockResponse = createMockApiResponse({
      sessionId: "session_123456789",
      juristkn: "token_abcdef123456",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    return HttpResponse.json(mockResponse);
  }),

  // Error responses for testing
  http.get(`${BASE_URL}/error/500`, () => {
    const mockError = createMockErrorResponse({
      status: 500,
      error: "Internal Server Error",
      message: "An internal server error occurred",
      path: "/error/500",
    });
    const mockResponse = createMockApiResponse(mockError, { status: 500 });
    return HttpResponse.json(mockResponse, { status: 500 });
  }),

  http.get(`${BASE_URL}/error/401`, () => {
    const mockError = createMockErrorResponse({
      status: 401,
      error: "Unauthorized",
      message: "Authentication required",
      path: "/error/401",
    });
    const mockResponse = createMockApiResponse(mockError, { status: 401 });
    return HttpResponse.json(mockResponse, { status: 401 });
  }),

  http.get(`${BASE_URL}/error/timeout`, () => {
    return new Promise(() => {
      // Never resolve to simulate timeout
    });
  }),
];
