import { z } from "zod";

// Geolocation schema
export const GeolocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
});

// Request form with geolocation
export const RequisicaoFormSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(0),
  size: z.number().int().min(1).max(100),
});

// Common response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    timestamp: z.string().datetime().optional(),
    status: z.number().optional(),
  });

// Error response schema
export const ErrorResponseSchema = z.object({
  timestamp: z.string().datetime(),
  status: z.number(),
  error: z.string(),
  message: z.string(),
  userMessage: z.string().optional(),
  path: z.string(),
});

// Types
export type Geolocation = z.infer<typeof GeolocationSchema>;
export type RequisicaoForm = z.infer<typeof RequisicaoFormSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
