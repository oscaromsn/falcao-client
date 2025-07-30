import type { HttpClient } from "@core/http";
import { BaseService } from "@services/base";
import { z } from "zod";

const ConversationRequestSchema = z.object({
  model: z.string().default("mistralai/Mixtral-8x7B-Instruct-v0.1"),
  title: z.string(),
  preset_context: z.string(),
});

const ConversationResponseSchema = z.object({
  conversationId: z.string(),
});

export type ConversationRequest = z.infer<typeof ConversationRequestSchema>;
export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;

export class AIService extends BaseService {
  constructor(
    http: HttpClient,
    private aiBaseUrl: string
  ) {
    super(http);
  }

  async createConversation(
    title: string,
    presetContext: string,
    model?: string
  ): Promise<ConversationResponse> {
    // Use a different base URL for AI service
    const response = await this.http
      .getInstance()
      .post(`${this.aiBaseUrl}/api/v1/conversation`, {
        model: model || "mistralai/Mixtral-8x7B-Instruct-v0.1",
        title,
        preset_context: presetContext,
      });

    return this.validate(response.data, ConversationResponseSchema);
  }

  getConversationUrl(conversationId: string): string {
    return `${this.aiBaseUrl}/conversation/${conversationId}/incontext`;
  }
}
