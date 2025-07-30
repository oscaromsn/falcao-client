import { z } from "zod";

// Base document schema - updated to match actual API response
export const BaseDocumentoSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(), // API sometimes doesn't include id
  tribunal: z.string(),
  numeroProcesso: z.string().optional(), // API sometimes doesn't include numeroProcesso
  tituloDecisao: z.string().optional(), // API sometimes doesn't include tituloDecisao
  ementa: z.string().optional(),
  textoCompleto: z.string().optional(),
  textoAcordao: z.string().optional(), // Actual field name in API
  relator: z.string().optional(),
  dataJulgamento: z.string().nullable().optional(), // API returns null sometimes
  orgaoJulgador: z.string().nullable().optional(), // Can be null or undefined in temasTopFive
  classeProcessual: z.string().nullable().optional(), // API returns null sometimes
  classeProcesso: z.string().optional(), // Actual field name in API
  siglaClasseProcesso: z.string().optional(),
  turma: z.string().optional(),
  idTurma: z.number().optional(),
  gabinete: z.string().nullable().optional(),
  idGabinete: z.number().nullable().optional(),
  possuiEmenta: z.union([z.boolean(), z.string()]).optional(), // API returns string like "S"/"N"
  idDocumentoAcordao: z.string().optional(),
  highlightTextoAcordaoAnonimizado: z
    .union([z.array(z.string()), z.string()])
    .optional(), // API can return string
  highlightEmenta: z.union([z.array(z.string()), z.string()]).optional(), // API can return string
  highlightTextoAcordao: z.union([z.array(z.string()), z.string()]).optional(), // API can return string
  referenciaLegislativa: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .optional(), // API can return string, null, or be undefined
  dataJuntada: z.string().optional(),
});

// Extended document schema with additional fields
export const DocumentoSchema = BaseDocumentoSchema.loose();

// Document types enum
export enum DocumentoTipo {
  Acordao = "acordaos",
  Precedente = "precedentes",
  PrecedenteBNP = "precedentesBNP",
  RecursoRevista = "recursorevista",
  Sentenca = "sentencas",
  DecisaoMonocratica = "decisoesmonocraticas",
}

// Document action request
export const AcaoBotaoFormSchema = z.object({
  documento: z.object({
    idDocumento: z.string(),
    tipoDocumento: z.string(),
    tribunal: z.string(),
  }),
  urlEncurtador: z.string().nullable().optional(),
  indiceItemSelecionado: z.number(),
  numeroPagina: z.number(),
  tamanhoPagina: z.number(),
  top5: z.boolean(),
});

// Document response schemas
export const DocumentResponseSchema = z.object({
  documentos: z.array(DocumentoSchema),
});

export const CitacaoResponseSchema = z.object({
  citacao: z.string(),
});

export const TextoResponseSchema = z.object({
  texto: z.string(),
});

export const PdfAuthenticityResponseSchema = z.object({
  valido: z.boolean(),
  tipoDocumento: z.string().optional(),
  tribunal: z.string().optional(),
  idDocumento: z.string().optional(),
  documento: z
    .object({
      tribunal: z.string(),
      numeroProcesso: z.string(),
      dataGeracao: z.string(),
    })
    .optional(),
});

// Types
export type BaseDocumento = z.infer<typeof BaseDocumentoSchema>;
export type Documento = z.infer<typeof DocumentoSchema>;
export type AcaoBotaoForm = z.infer<typeof AcaoBotaoFormSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type CitacaoResponse = z.infer<typeof CitacaoResponseSchema>;
export type TextoResponse = z.infer<typeof TextoResponseSchema>;
export type PdfAuthenticityResponse = z.infer<
  typeof PdfAuthenticityResponseSchema
>;
