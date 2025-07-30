import { z } from "zod";

/**
 * Highlight field schemas for search responses
 * These handle highlighted text that can be either strings or arrays of strings
 * Based on real API response structure
 */

// Base highlight field - can be string or array of strings
export const BaseHighlightFieldSchema = z
  .union([z.string(), z.array(z.string())])
  .nullable()
  .optional();

// All highlight fields use the same schema - no need for individual aliases

// Combined schema for all highlight fields (used in complete document schemas)
export const AllHighlightFieldsSchema = z
  .object({
    highlightEmenta: BaseHighlightFieldSchema,
    highlightTextoAcordao: BaseHighlightFieldSchema,
    highlightTextoAcordaoAnonimizado: BaseHighlightFieldSchema,
    highlightQuestao: BaseHighlightFieldSchema,
    highlightTese: BaseHighlightFieldSchema,
    highlightTextoAcordaoDecisao: BaseHighlightFieldSchema,
    highlightTextoAcordaoMerito: BaseHighlightFieldSchema,
    highlightTextoDecisaoAdmissao: BaseHighlightFieldSchema,
    highlightTextoDecisaoSuspensao: BaseHighlightFieldSchema,
    highlightTextoEmentaAdmissao: BaseHighlightFieldSchema,
    highlightTextoEmentaMerito: BaseHighlightFieldSchema,
  })
  .partial();

// Types - all highlight fields have the same type
export type BaseHighlightField = z.infer<typeof BaseHighlightFieldSchema>;
export type AllHighlightFields = z.infer<typeof AllHighlightFieldsSchema>;

// Specific field type aliases for backward compatibility and semantic clarity
export type HighlightEmenta = BaseHighlightField;
export type HighlightTextoAcordao = BaseHighlightField;
export type HighlightTextoAcordaoAnonimizado = BaseHighlightField;
export type HighlightQuestao = BaseHighlightField;
export type HighlightTese = BaseHighlightField;
export type HighlightTextoAcordaoDecisao = BaseHighlightField;
export type HighlightTextoAcordaoMerito = BaseHighlightField;
export type HighlightTextoDecisaoAdmissao = BaseHighlightField;
export type HighlightTextoDecisaoSuspensao = BaseHighlightField;
export type HighlightTextoEmentaAdmissao = BaseHighlightField;
export type HighlightTextoEmentaMerito = BaseHighlightField;
