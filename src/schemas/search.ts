import { z } from "zod";
import { DocumentoSchema } from "./documents";
import { TemaTopFiveItemSchema } from "./tema";

// Search filter schema
export const FiltroSchema = z.object({
  texto: z.string().optional(),
  colecao: z.string().optional(), // API expects single collection, not array
  tribunais: z.array(z.string()).optional(),
  precedente: z.string().optional(),
  temEmenta: z.enum(["S", "N"]).optional(),
  diasPesquisa: z.number().optional(),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dataFim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  nomeRelator: z.array(z.string()).optional(),
  orgaoJulgador: z.array(z.string()).optional(),
  classeProcesso: z.array(z.string()).optional(),
  tipoPrecedente: z.enum(["J", "N"]).optional(),
  filtroRapidoData: z.string().optional(),
  pesquisaSomenteNasEmentas: z.boolean().optional(),
  verTodosPrecedentes: z.boolean().optional(),
});

// Available filter value - updated to match actual API response
const ValorFiltroSchema = z.object({
  valor: z.string(),
  quantidade: z.number().nullable(), // API sometimes returns null
  valorWeb: z.string().optional(),
  valorBalao: z.string().nullable().optional(), // API sometimes returns null
});

// Available filter - updated to match actual API response
const FiltroDisponivelSchema = z.object({
  nomeDoFiltro: z.string(),
  nomeWeb: z.string(),
  ordem: z.number(),
  colecao: z.string().nullable().optional(), // Additional field in API
  valoresFiltro: z.array(ValorFiltroSchema),
});

// Search response - updated with proper TemaTopFive schema
export const SearchResponseSchema = z.object({
  documentos: z.array(DocumentoSchema),
  filtrosDisponiveis: z.array(FiltroDisponivelSchema),
  quantidadeTotal: z.number(),
  temasTopFive: z.array(TemaTopFiveItemSchema),
});

// Count response - actual API structure
export const CountResponseSchema = z.object({
  countPrecedentes: z.number(),
  countAcordaos: z.number(),
  countSentencas: z.number(),
  countRR: z.number(),
  countDecisoesMonocraticas: z.number(),
});

// Autocomplete response
export const AutocompleteResponseSchema = z.object({
  sugestoes: z.array(z.string()),
  tempoElasticsearch: z.number(),
  tempoConsultaCompleta: z.number(),
  queriesRelated: z.array(
    z.object({
      queryString: z.string(),
      queryRelated: z.array(z.string()),
    })
  ),
});

// Tribunal info
export const TribunalSchema = z.object({
  sigla: z.string(),
  nome: z.string(),
});

// System information schemas - actual API structure
export const SystemVersionsSchema = z.array(
  z.object({
    versao: z.string(),
    data: z.string(), // API uses 'data' not 'dataLancamento'
    descricao: z.string().optional(),
  })
);

export const DataUpdateSchema = z.object({
  dataAtualizacaoPrecedentes: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
  dataAtualizacaoPrecedentesBNP: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
  dataAtualizacaoAcordao: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
  dataAtualizacaoSentenca: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
  dataAtualizacaoRecursoRevista: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
  dataAtualizacaoDecisaoMonocratica: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string(),
    })
  ),
});

export const DataPublicationSchema = z.object({
  dataAtualizacaoPrecedentes: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
  dataAtualizacaoPrecedentesBNP: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
  dataAtualizacaoAcordao: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
  dataAtualizacaoSentenca: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
  dataAtualizacaoRecursoRevista: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
  dataAtualizacaoDecisaoMonocratica: z.array(
    z.object({
      tribunal: z.string(),
      data: z.string().nullable(),
    })
  ),
});

// Types
export type Filtro = z.infer<typeof FiltroSchema>;
export type ValorFiltro = z.infer<typeof ValorFiltroSchema>;
export type FiltroDisponivel = z.infer<typeof FiltroDisponivelSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type CountResponse = z.infer<typeof CountResponseSchema>;
export type AutocompleteResponse = z.infer<typeof AutocompleteResponseSchema>;
export type Tribunal = z.infer<typeof TribunalSchema>;
export type SystemVersions = z.infer<typeof SystemVersionsSchema>;
export type DataUpdate = z.infer<typeof DataUpdateSchema>;
export type DataPublication = z.infer<typeof DataPublicationSchema>;
