import type { HttpClient } from "@core/http";
import {
  type ConversationResponse,
  ConversationResponseSchema,
} from "@schemas/ai";
import { BaseService } from "@services/base";

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
