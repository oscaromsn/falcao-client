import type { Pagination } from "@schemas/common";
import {
  type AutocompleteResponse,
  AutocompleteResponseSchema,
  type CountResponse,
  CountResponseSchema,
  type DataPublication,
  DataPublicationSchema,
  type DataUpdate,
  DataUpdateSchema,
  type Filtro,
  type SearchResponse,
  SearchResponseSchema,
  type SystemVersions,
  SystemVersionsSchema,
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
    // Default to "acordaos" collection if none specified
    const filtersWithDefaults = {
      ...filters,
      colecao: filters.colecao || "acordaos",
    };

    const params = {
      ...this.buildArrayParams(filtersWithDefaults, this.arrayFields),
      ...pagination,
    };

    return this.get("/no-auth/pesquisa", SearchResponseSchema, params);
  }

  async count(filters: Filtro): Promise<CountResponse> {
    // Default to "acordaos" collection if none specified
    const filtersWithDefaults = {
      ...filters,
      colecao: filters.colecao || "acordaos",
    };

    const params = this.buildArrayParams(filtersWithDefaults, this.arrayFields);
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

  async getSystemVersions(): Promise<SystemVersions> {
    return this.get("/no-auth/informacao/versao", SystemVersionsSchema);
  }

  async getDataUpdateDate(): Promise<DataUpdate> {
    return this.get("/no-auth/informacao/dataIndexacaoDados", DataUpdateSchema);
  }

  async getDataPublicationDate(): Promise<DataPublication> {
    return this.get(
      "/no-auth/informacao/dataPublicacaoDados",
      DataPublicationSchema
    );
  }
}
