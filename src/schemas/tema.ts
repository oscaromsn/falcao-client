import { z } from "zod";
import {
  AssuntoSchema,
  LimiteSuspensaoSchema,
  OptionalDateSchema,
  ProcessoParadigmaSchema,
  ReferenciaLegislativaSchema,
  SituacaoSchema,
} from "./common";
import { AllHighlightFieldsSchema } from "./highlight";

/**
 * TemaTopFive schema
 */

export const TemaTopFiveItemSchema = z
  .object({
    // Core identification fields (all optional for client flexibility)
    tribunal: z.string().optional(),
    tituloDecisao: z.string().optional(),
    origemDocumentos: z.string().optional(),
    descricaoTribunal: z.string().optional(),
    situacao: SituacaoSchema.optional(),
    pendenteDecisao: z.boolean().optional(),
    idTema: z.string().optional(),
    sumula: z.boolean().optional(),
    teseJuridicaPrevalecente: z.boolean().optional(),
    orientacaoJurisprudencial: z.boolean().optional(),
    baseJuridicaAntiga: z.boolean().optional(),
    conteudoDecisao: z.string().optional(),
    id: z.string().optional(),
    relator: z.string().optional(),
    numero: z.string().optional(),
    categoria: z.string().optional(),
    tituloCategoria: z.string().optional(),
    orgao: z.string().optional(),
    descricaoOrgao: z.string().optional(),

    // Optional complex objects
    assuntos: z.array(AssuntoSchema).nullable().optional(),
    limiteSuspensao: LimiteSuspensaoSchema.nullable().optional(),
    processosParadigma: z.array(ProcessoParadigmaSchema).nullable().optional(),

    // Optional date fields
    dataAdmissao: OptionalDateSchema,
    dataInstauracaoIac: OptionalDateSchema,
    dataJulgamento: OptionalDateSchema,
    dataJulgamentoEmbargos: z.null().optional(),
    dataPublicacao: OptionalDateSchema,
    dataSituacao: OptionalDateSchema,
    dataTransitoJulgado: OptionalDateSchema,
    vistaRegimental: OptionalDateSchema,

    // Optional text fields
    classeProcessual: z.string().nullable().optional(),
    decisao: z.string().nullable().optional(),
    nomeRedator: z.string().nullable().optional(),
    nomeRelator: z.string().nullable().optional(),
    numeroOrientacaoJurisprudencial: z.string().nullable().optional(),
    numeroSumula: z.string().nullable().optional(),
    numeroTema: z.string().nullable().optional(),
    numeroTemaSobrestado: z.string().nullable().optional(),
    numeroTeseJuridicaPrevalecente: z.string().nullable().optional(),
    observacao: z.string().nullable().optional(),
    orgaoJudicante: z.string().nullable().optional(),
    orgaoJulgador: z.string().nullable().optional(),
    orientacaoJurisprudencialRA_SE: z.string().nullable().optional(),
    questao: z.string().nullable().optional(),
    suspensaoGeral: z.string().nullable().optional(),
    teorDecisao: z.string().nullable().optional(),
    tese: z.string().nullable().optional(),
    texto: z.string().nullable().optional(),
    textoAcordaoMerito: z.string().nullable().optional(),
    textoDecisaoAdmissao: z.string().nullable().optional(),
    textoDecisaoSuspensao: z.string().nullable().optional(),
    textoEmentaAdmissao: z.string().nullable().optional(),
    textoEmentaMerito: z.string().nullable().optional(),
    tipo: z.string().nullable().optional(),
    titulo: z.string().nullable().optional(),
    link: z.string().nullable().optional(),

    // Special fields
    processosIncidente: z.null().optional(),
    referenciaLegislativa: ReferenciaLegislativaSchema,

    // Common document fields (since temasTopFive might contain document-like objects)
    numeroProcesso: z.string().optional(),
    ementa: z.string().optional(),
    textoAcordao: z.string().optional(),
    classeProcesso: z.string().optional(),
    siglaClasseProcesso: z.string().optional(),
    turma: z.string().optional(),
    idTurma: z.number().optional(),
    gabinete: z.string().nullable().optional(),
    idGabinete: z.number().nullable().optional(),
    possuiEmenta: z.union([z.boolean(), z.string()]).optional(),
    idDocumentoAcordao: z.string().optional(),
    dataJuntada: OptionalDateSchema,

    // All highlight fields
    ...AllHighlightFieldsSchema.shape,
  })
  .loose(); // Allow additional fields for maximum flexibility

// Type
export type TemaTopFiveItem = z.infer<typeof TemaTopFiveItemSchema>;
