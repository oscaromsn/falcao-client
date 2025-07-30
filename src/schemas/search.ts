import { DocumentoSchema } from "@schemas/documents";
import { z } from "zod";

// Search filter schema
export const FiltroSchema = z.object({
  texto: z.string().optional(),
  colecao: z.array(z.string()).optional(),
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

// Available filter value
const ValorFiltroSchema = z.object({
  valor: z.string(),
  quantidade: z.number(),
  valorWeb: z.string().optional(),
  valorBalao: z.string().optional(),
});

// Available filter
const FiltroDisponivelSchema = z.object({
  nomeDoFiltro: z.string(),
  nomeWeb: z.string(),
  ordem: z.number(),
  valoresFiltro: z.array(ValorFiltroSchema),
});

// Search response
export const SearchResponseSchema = z.object({
  documentos: z.array(DocumentoSchema),
  filtrosDisponiveis: z.array(FiltroDisponivelSchema),
  quantidadeTotal: z.number(),
  temasTopFive: z.array(DocumentoSchema).optional(),
});

// Count response
export const CountResponseSchema = z.object({
  filtrosDisponiveis: z.array(FiltroDisponivelSchema),
});

// Autocomplete response
export const AutocompleteResponseSchema = z.object({
  sugestoes: z.array(z.string()),
  queriesRelated: z
    .array(
      z.object({
        queryString: z.string(),
        queryRelated: z.array(z.string()),
      })
    )
    .optional(),
});

// Tribunal info
export const TribunalSchema = z.object({
  sigla: z.string(),
  nome: z.string(),
});

// System information schemas
export const SystemVersionsSchema = z.object({
  versoes: z.array(
    z.object({
      versao: z.string(),
      dataLancamento: z.string(),
      descricao: z.string().optional(),
    })
  ),
});

export const DataUpdateSchema = z.object({
  dataIndexacao: z.string(),
  ultimaAtualizacao: z.string(),
});

export const DataPublicationSchema = z.object({
  dataPublicacao: z.string(),
  fonte: z.string().optional(),
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
