/**
 * Grounded Mock Data Helpers
 * Generated from real API responses
 * CRITICAL: Real API returns RAW data, not wrapped in ApiResponse<T>
 */

import type { AutocompleteResponse, Notification } from "@schemas/index";

// Real API data helpers (NO WRAPPER - APIs return raw data)

/**
 * Based on real notification data, Returns array of notifications directly (no wrapper)
 * Pattern: GET /no-auth/notificacoes
 * Structure: Array<object>
 */
export const createMockNoAuthNotificacoes = (): Notification[] => [
  {
    id: 16,
    titulo: "Versão 2.12.0 liberada",
    descricao:
      'Acesse o link "Novidades" e "Ajuda" no rodapé da página para mais detalhes.',
    dataCadastro: "17/07/2025 18:32:13",
    lido: false,
  },
  {
    id: 15,
    titulo: "Versão 2.11.0 liberada",
    descricao:
      'Acesse o link "Novidades" e "Ajuda" no rodapé da página para mais detalhes.',
    dataCadastro: "17/06/2025 15:06:37",
    lido: true,
  },
  {
    id: 14,
    titulo: "Sistema em manutenção programada",
    descricao:
      "O sistema estará indisponível das 02:00 às 06:00 para manutenção.",
    dataCadastro: "01/07/2025 09:00:00",
    lido: true,
  },
];

/**
 * Based on real autocomplete data, Includes queriesRelated with extensive related terms, Response includes performance timing fields
 * Pattern: GET /no-auth/autocompletar
 * Structure: Object{sugestoes, tempoElasticsearch, tempoConsultaCompleta...}
 */
export const createMockNoAuthAutocompletar = (
  query = ""
): AutocompleteResponse => ({
  sugestoes: [
    `${query} suggestion 1`,
    `${query} suggestion 2`,
    `${query} suggestion 3`,
    "related term 1",
    "related term 2",
  ],
  tempoElasticsearch: 5,
  tempoConsultaCompleta: 5,
  queriesRelated: [
    {
      queryString: query,
      queryRelated: [
        query,
        `${query} related term 1`,
        `${query} related term 2`,
        "complementary term 1",
        "complementary term 2",
        "legal concept 1",
        "legal concept 2",
      ],
    },
  ],
});
