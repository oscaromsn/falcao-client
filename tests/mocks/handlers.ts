import { HttpResponse, http } from "msw";
import {
  createMockNoAuthAutocompletar,
  createMockNoAuthNotificacoes,
} from "../utils/grounded-mock-helpers";
import {
  createMockDocument,
  createMockErrorResponse,
  createMockSearchResponse,
} from "../utils/test-helpers";

// IMPORTANT: Real Falcão API returns RAW responses without ApiResponse<T> wrapper
// These handlers match the actual API structure exactly
const BASE_URL =
  "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api";
const AI_BASE_URL = "https://ai.jurisprudencia.jt.jus.br/robusto";

export const handlers = [
  // Search endpoints - based on real API responses
  http.get(`${BASE_URL}/no-auth/pesquisa`, ({ request }) => {
    const url = new URL(request.url);
    const texto = url.searchParams.get("texto") || "";

    // Return raw SearchResponse - NO WRAPPER (matches real API)
    const response = createMockSearchResponse({
      documentos: [
        createMockDocument({
          tituloDecisao: `SEARCH RESULT - ${texto}`,
          ementa: `Ementa relacionada a: ${texto}`,
        }),
      ],
    });
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/no-auth/autocompletar`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("texto") || "";

    // Return raw AutocompleteResponse - NO WRAPPER (matches real API)
    const response = createMockNoAuthAutocompletar(query);
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/no-auth/pesquisa/count`, () => {
    // Return raw CountResponse - NO WRAPPER (matches real API)
    const response = {
      countPrecedentes: 863,
      countAcordaos: 5632423,
      countSentencas: 8549757,
      countRR: 2238193,
      countDecisoesMonocraticas: 1810935,
    };
    return HttpResponse.json(response);
  }),

  // Information endpoints
  http.get(`${BASE_URL}/no-auth/informacao/tribunais`, () => {
    const mockTribunals = [
      { sigla: "TST", nome: "Tribunal Superior do Trabalho" },
      { sigla: "TRT1", nome: "Tribunal Regional do Trabalho da 1ª Região" },
      { sigla: "STF", nome: "Supremo Tribunal Federal" },
    ];
    // Return raw array - NO WRAPPER (matches real API)
    return HttpResponse.json(mockTribunals);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/versao`, () => {
    // Return raw array - NO WRAPPER (matches real API)
    const response = [
      {
        versao: "2.12.1",
        data: "18 de Julho de 2025",
        descricao: "Falcão Client version 2.12.1",
      },
    ];
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/dataIndexacaoDados`, () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      dataAtualizacaoPrecedentes: [
        { tribunal: "TST", data: "29/07/2025" },
        { tribunal: "TRT9", data: "29/07/2025" },
      ],
      dataAtualizacaoAcordao: [
        { tribunal: "TRT2", data: "30/07/2025" },
        { tribunal: "TST", data: "30/07/2025" },
      ],
    };
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/no-auth/informacao/dataPublicacaoDados`, () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      dataAtualizacaoPrecedentes: [
        { tribunal: "TST", data: "02/07/2025" },
        { tribunal: "STF", data: null },
      ],
      dataAtualizacaoAcordao: [{ tribunal: "TRT2", data: "29/07/2025" }],
    };
    return HttpResponse.json(response);
  }),

  // Notifications - based on real API response structure
  http.get(`${BASE_URL}/no-auth/notificacoes`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const size = parseInt(url.searchParams.get("size") || "5");

    // Return raw array - NO WRAPPER (matches real API)
    const allNotifications = createMockNoAuthNotificacoes();
    const start = page * size;
    const end = start + size;
    const pageData = allNotifications.slice(start, end);

    return HttpResponse.json(pageData);
  }),

  // Document endpoints
  http.get(
    `${BASE_URL}/no-auth/pesquisa/acordaos/:tribunal/:id`,
    ({ params }) => {
      const mockDocument = createMockDocument({
        id: params.id as any,
        tribunal: params.tribunal as string,
      });
      // Return raw DocumentResponse - NO WRAPPER (matches real API)
      const response = {
        documentos: [mockDocument],
      };
      return HttpResponse.json(response);
    }
  ),

  http.get(
    `${BASE_URL}/no-auth/pesquisa/precedentes/:tribunal/:id`,
    ({ params }) => {
      const mockDocument = createMockDocument({
        id: params.id as any,
        tribunal: params.tribunal as string,
      });
      // Return raw DocumentResponse - NO WRAPPER (matches real API)
      const response = {
        documentos: [mockDocument],
      };
      return HttpResponse.json(response);
    }
  ),

  http.post(`${BASE_URL}/no-auth/pesquisa/copiarInteiroTeor`, async () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      texto: "Inteiro teor do documento para teste...",
    };
    return HttpResponse.json(response);
  }),

  http.post(`${BASE_URL}/no-auth/pesquisa/citarDecisao`, async () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      citacao:
        "BRASIL. Tribunal Superior do Trabalho. Recurso de Revista nº 1234567-89.2024.5.00.0000. Relator: Min. Test. Brasília, 15 de janeiro de 2024.",
    };
    return HttpResponse.json(response);
  }),

  // User endpoints (authenticated)
  http.get(`${BASE_URL}/perfil`, () => {
    // Return raw UserProfile - NO WRAPPER (matches real API)
    const response = {
      id: "user123",
      nome: "Test User",
      email: "test@example.com",
      utilizaIARobusto: true,
      configuracoes: {
        resultadosPorPagina: 20,
        abrirDocumentosNovaAba: true,
      },
    };
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/perfil/tribunaisFavoritos`, () => {
    // Return raw array - NO WRAPPER (matches real API)
    const response = [
      { sigla: "TST", nome: "Tribunal Superior do Trabalho" },
      { sigla: "TRT9", nome: "Tribunal Regional do Trabalho da 9ª Região" },
    ];
    return HttpResponse.json(response);
  }),

  http.post(`${BASE_URL}/pesquisasFavoritas`, async ({ request }) => {
    const body = await request.json();
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      id: "search123",
      titulo: (body as any)?.pesquisaFavorita?.titulo || "Saved Search",
      dataCriacao: new Date().toISOString(),
      filtro: (body as any)?.filtro || {},
    };
    return HttpResponse.json(response);
  }),

  http.get(`${BASE_URL}/pesquisasFavoritas`, () => {
    // Return raw paginated response - NO WRAPPER (matches real API)
    const response = {
      content: [
        {
          id: "search1",
          titulo: "Constitutional Cases",
          dataCriacao: "2024-01-01T00:00:00Z",
          filtro: { texto: "constitutional" },
        },
        {
          id: "search2",
          titulo: "Administrative Law",
          dataCriacao: "2024-01-02T00:00:00Z",
          filtro: { texto: "administrative" },
        },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
    };
    return HttpResponse.json(response);
  }),

  // Admin endpoints
  http.get(`${BASE_URL}/statusCache`, () => {
    // Return raw array - NO WRAPPER (matches real API)
    const response = [
      {
        nome: "SearchCache",
        grupo: "Pesquisa",
        tamanho: 1048576,
        totalEmUso: 524288,
        totalBuscadoNoCache: 15000,
        percentualAcessoCache: "85.5",
        totalBuscadoForaDoCache: 2500,
        percentualForaDoCache: "14.5",
      },
    ];
    return HttpResponse.json(response);
  }),

  // AI endpoints
  http.post(`${AI_BASE_URL}/api/v1/conversation`, async () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
    };
    return HttpResponse.json(response);
  }),

  http.get(`${AI_BASE_URL}/conversation/:id`, ({ params }) => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
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
    };
    return HttpResponse.json(response);
  }),

  // Session management
  http.post(`${BASE_URL}/session`, () => {
    // Return raw object - NO WRAPPER (matches real API)
    const response = {
      sessionId: "session_123456789",
      juristkn: "token_abcdef123456",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    return HttpResponse.json(response);
  }),

  // Error responses for testing
  http.get(`${BASE_URL}/error/500`, () => {
    const mockError = createMockErrorResponse({
      status: 500,
      error: "Internal Server Error",
      message: "An internal server error occurred",
      path: "/error/500",
    });
    // Return raw error - NO WRAPPER (matches real API)
    return HttpResponse.json(mockError, { status: 500 });
  }),

  http.get(`${BASE_URL}/error/401`, () => {
    const mockError = createMockErrorResponse({
      status: 401,
      error: "Unauthorized",
      message: "Authentication required",
      path: "/error/401",
    });
    // Return raw error - NO WRAPPER (matches real API)
    return HttpResponse.json(mockError, { status: 401 });
  }),

  http.get(`${BASE_URL}/error/timeout`, () => {
    return new Promise(() => {
      // Never resolve to simulate timeout
    });
  }),
];
