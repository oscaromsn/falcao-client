import { z } from "zod";

// AI conversation schemas
export const ConversationRequestSchema = z.object({
  model: z.string().default("mistralai/Mixtral-8x7B-Instruct-v0.1"),
  title: z.string(),
  preset_context: z.string(),
});

export const ConversationResponseSchema = z.object({
  conversationId: z.string(),
});

// Export types
export type ConversationRequest = z.infer<typeof ConversationRequestSchema>;
export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;
