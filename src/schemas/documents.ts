import { z } from "zod";
import {
  OptionalDateSchema,
  OptionalNumberIdSchema,
  OptionalStringIdSchema,
  ReferenciaLegislativaSchema,
} from "./common";
import { AllHighlightFieldsSchema } from "./highlight";

/**
 * Modular document schemas based on real API structure
 * Separates concerns and allows for type-specific extensions
 */

// Core document fields present in most document types
export const CoreDocumentFieldsSchema = z.object({
  tribunal: z.string(),
  numeroProcesso: z.string().optional(),
  ementa: z.string().optional(),
  textoAcordao: z.string().optional(),
  relator: z.string().optional(),
  dataJulgamento: OptionalDateSchema,
  classeProcesso: z.string().optional(),
  siglaClasseProcesso: z.string().optional(),
  possuiEmenta: z.union([z.boolean(), z.string()]).optional(),
  referenciaLegislativa: ReferenciaLegislativaSchema,
  dataJuntada: OptionalDateSchema,
});

// Acordão-specific fields (from extracted schema)
export const AcordaoFieldsSchema = z.object({
  idDocumentoAcordao: OptionalStringIdSchema,
  turma: z.string().optional(),
  idTurma: OptionalNumberIdSchema,
  gabinete: z.string().nullable().optional(),
  idGabinete: z.number().nullable().optional(),
});

// Extended document fields for complex documents
export const ExtendedDocumentFieldsSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  tituloDecisao: z.string().optional(),
  textoCompleto: z.string().optional(),
  orgaoJulgador: z.string().nullable().optional(),
  classeProcessual: z.string().nullable().optional(),
});

// Base document schema combining core fields
export const BaseDocumentoSchema = CoreDocumentFieldsSchema.merge(
  ExtendedDocumentFieldsSchema
).merge(AllHighlightFieldsSchema);

// Acordão document schema
export const AcordaoDocumentoSchema =
  BaseDocumentoSchema.merge(AcordaoFieldsSchema);

// Flexible document schema for mixed responses
export const DocumentoSchema = BaseDocumentoSchema.partial();

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
export type CoreDocumentFields = z.infer<typeof CoreDocumentFieldsSchema>;
export type AcordaoFields = z.infer<typeof AcordaoFieldsSchema>;
export type ExtendedDocumentFields = z.infer<
  typeof ExtendedDocumentFieldsSchema
>;
export type BaseDocumento = z.infer<typeof BaseDocumentoSchema>;
export type AcordaoDocumento = z.infer<typeof AcordaoDocumentoSchema>;
export type Documento = z.infer<typeof DocumentoSchema>;
export type AcaoBotaoForm = z.infer<typeof AcaoBotaoFormSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type CitacaoResponse = z.infer<typeof CitacaoResponseSchema>;
export type TextoResponse = z.infer<typeof TextoResponseSchema>;
export type PdfAuthenticityResponse = z.infer<
  typeof PdfAuthenticityResponseSchema
>;
