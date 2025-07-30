import {
  type AcaoBotaoForm,
  CitacaoResponseSchema,
  DocumentoTipo,
  type DocumentResponse,
  DocumentResponseSchema,
  type PdfAuthenticityResponse,
  PdfAuthenticityResponseSchema,
  TextoResponseSchema,
} from "@schemas/documents";
import { BaseService } from "@services/base";
import { z } from "zod";

export class DocumentService extends BaseService {
  async getDocument(
    tipo: DocumentoTipo,
    tribunal: string,
    id: string
  ): Promise<DocumentResponse> {
    return this.get(
      `/no-auth/pesquisa/${tipo}/${tribunal}/${id}`,
      DocumentResponseSchema
    );
  }

  async getAcordao(tribunal: string, id: string): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.Acordao, tribunal, id);
  }

  async getPrecedente(tribunal: string, id: string): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.Precedente, tribunal, id);
  }

  async getPrecedenteBNP(
    tribunal: string,
    id: string
  ): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.PrecedenteBNP, tribunal, id);
  }

  async getRecursoRevista(
    tribunal: string,
    id: string
  ): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.RecursoRevista, tribunal, id);
  }

  async getSentenca(tribunal: string, id: string): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.Sentenca, tribunal, id);
  }

  async getDecisaoMonocratica(
    tribunal: string,
    id: string
  ): Promise<DocumentResponse> {
    return this.getDocument(DocumentoTipo.DecisaoMonocratica, tribunal, id);
  }

  async copyFullText(action: AcaoBotaoForm): Promise<string> {
    const response = await this.post(
      "/no-auth/pesquisa/copiarInteiroTeor",
      TextoResponseSchema,
      action
    );
    return response.texto;
  }

  async generateCitation(action: AcaoBotaoForm): Promise<string> {
    const response = await this.post(
      "/no-auth/pesquisa/citarDecisao",
      CitacaoResponseSchema,
      action
    );
    return response.citacao;
  }

  async copyDecision(action: AcaoBotaoForm): Promise<string> {
    const response = await this.post(
      "/no-auth/pesquisa/copiarDecisao",
      TextoResponseSchema,
      action
    );
    return response.texto;
  }

  async logOpenFullText(action: AcaoBotaoForm): Promise<void> {
    await this.post("/no-auth/pesquisa/abrirInteiroTeor", z.void(), action);
  }

  async generatePdf(tribunal: string, id: string, tipo: string): Promise<Blob> {
    const response = await this.http
      .getInstance()
      .get("/no-auth/pdfInteiroTeor", {
        params: { tribunal, id, tipo },
        responseType: "blob",
      });
    return response.data;
  }

  async validatePdfAuthenticity(
    codigoAutenticidade: string
  ): Promise<PdfAuthenticityResponse> {
    return this.put(
      "/no-auth/pdfInteiroTeor/validarAutenticidade",
      PdfAuthenticityResponseSchema,
      {
        codigoAutenticidade,
      }
    );
  }
}
