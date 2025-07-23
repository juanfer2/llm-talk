import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChromaClient {
  vectorClient: Chroma;
  private embeddings: OpenAIEmbeddings;

  constructor(collectionName: string, url: string) {
    try {
      this.embeddings = new OpenAIEmbeddings();
      this.vectorClient = new Chroma(this.embeddings, {
        collectionName: collectionName ?? 'wompi-docs',
        url: url ?? 'http://localhost:8000', // URL del servidor Chroma
      });

      Logger.log('Chroma inicializado exitosamente');
    } catch (error) {
      Logger.error('Error inicializando Chroma:', error);
      throw error;
    }
  }
}
