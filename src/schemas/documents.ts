import { z } from "zod";

// Base document schema
export const BaseDocumentoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  tribunal: z.string(),
  numeroProcesso: z.string(),
  tituloDecisao: z.string(),
  ementa: z.string().optional(),
  textoCompleto: z.string().optional(),
  relator: z.string().optional(),
  dataJulgamento: z.string().optional(),
  orgaoJulgador: z.string().optional(),
  classeProcessual: z.string().optional(),
  siglaClasseProcesso: z.string().optional(),
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

// Types
export type BaseDocumento = z.infer<typeof BaseDocumentoSchema>;
export type Documento = z.infer<typeof DocumentoSchema>;
export type AcaoBotaoForm = z.infer<typeof AcaoBotaoFormSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type CitacaoResponse = z.infer<typeof CitacaoResponseSchema>;
export type TextoResponse = z.infer<typeof TextoResponseSchema>;
