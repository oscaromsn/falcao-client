import type { Pagination } from "@schemas/common";
import {
  type AutocompleteResponse,
  AutocompleteResponseSchema,
  type CountResponse,
  CountResponseSchema,
  type Filtro,
  type SearchResponse,
  SearchResponseSchema,
  type Tribunal,
  TribunalSchema,
} from "@schemas/search";
import { BaseService } from "@services/base";
import { z } from "zod";

export class SearchService extends BaseService {
  private readonly arrayFields = [
    "colecao",
    "tribunais",
    "nomeRelator",
    "orgaoJulgador",
    "classeProcesso",
  ];

  async search(
    filters: Filtro,
    pagination: Pagination
  ): Promise<SearchResponse> {
    const params = {
      ...this.buildArrayParams(filters, this.arrayFields),
      ...pagination,
    };

    return this.get("/no-auth/pesquisa", SearchResponseSchema, params);
  }

  async count(filters: Filtro): Promise<CountResponse> {
    const params = this.buildArrayParams(filters, this.arrayFields);
    return this.get("/no-auth/pesquisa/count", CountResponseSchema, params);
  }

  async autocomplete(texto: string): Promise<AutocompleteResponse> {
    return this.get("/no-auth/autocompletar", AutocompleteResponseSchema, {
      texto,
    });
  }

  async getTribunals(): Promise<Tribunal[]> {
    return this.get("/no-auth/informacao/tribunais", z.array(TribunalSchema));
  }

  async getSystemInfo(): Promise<{
    versao: string;
    dataAtualizacao: string;
    ultimaAtualizacaoDados: string;
  }> {
    return this.get(
      "/no-auth/informacao",
      z.object({
        versao: z.string(),
        dataAtualizacao: z.string(),
        ultimaAtualizacaoDados: z.string(),
      })
    );
  }
}
