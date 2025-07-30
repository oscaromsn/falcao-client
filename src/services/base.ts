import { FalcaoValidationError } from "@core/errors";
import type { HttpClient } from "@core/http";
import type { z } from "zod";

export abstract class BaseService {
  constructor(protected http: HttpClient) {}

  protected async get<T>(
    url: string,
    schema: z.ZodType<T>,
    params?: Record<string, any>
  ): Promise<T> {
    const response = await this.http.request({
      method: "GET",
      url,
      params,
    });
    return this.validate(response, schema);
  }

  protected async post<T>(
    url: string,
    schema: z.ZodType<T>,
    data?: any,
    config?: { params?: Record<string, any> }
  ): Promise<T> {
    const response = await this.http.request({
      method: "POST",
      url,
      data,
      params: config?.params,
    });
    return this.validate(response, schema);
  }

  protected async put<T>(
    url: string,
    schema: z.ZodType<T>,
    data?: any,
    config?: { params?: Record<string, any> }
  ): Promise<T> {
    const response = await this.http.request({
      method: "PUT",
      url,
      data,
      params: config?.params,
    });
    return this.validate(response, schema);
  }

  protected async delete<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const response = await this.http.request({
      method: "DELETE",
      url,
    });
    return this.validate(response, schema);
  }

  protected validate<T>(data: unknown, schema: z.ZodType<T>): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new FalcaoValidationError(
        "Response validation failed",
        result.error
      );
    }
    return result.data;
  }

  protected buildArrayParams(
    params: Record<string, any>,
    arrayFields: string[]
  ): Record<string, any> {
    const result = { ...params };

    for (const field of arrayFields) {
      if (result[field] && Array.isArray(result[field])) {
        // Handle special separators
        if (
          ["nomeRelator", "orgaoJulgador", "classeProcesso"].includes(field)
        ) {
          result[field] = result[field].join("#");
        } else {
          result[field] = result[field].join(",");
        }
      }
    }

    return result;
  }
}
