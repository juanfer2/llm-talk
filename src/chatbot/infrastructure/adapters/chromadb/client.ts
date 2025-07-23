import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChromaClient {
  private readonly logger = new Logger(ChromaClient.name);
  vectorClient: Chroma;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    collectionName: string,
    url: string,
    private readonly configService: ConfigService,
  ) {
    try {
      // Use OpenAI embeddings
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required for embeddings');
      }

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: apiKey,
      });

      this.vectorClient = new Chroma(this.embeddings, {
        collectionName: collectionName ?? 'wompi-docs',
        url: url ?? 'http://localhost:8000',
      });

      this.logger.log('Chroma inicializado exitosamente con OpenAI embeddings');
    } catch (error) {
      this.logger.error(
        `Error inicializando Chroma en ${ChromaClient.name}:`,
        error,
      );
      throw error;
    }
  }
}
