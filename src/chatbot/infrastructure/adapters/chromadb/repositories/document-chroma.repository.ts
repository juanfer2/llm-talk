import { Injectable } from '@nestjs/common';
import { Document } from 'langchain/document';
import { DocumentRepository } from '../../../../domain/repositories';
import { ChromaClient } from '../client';

@Injectable()
export class DocumentCromaRepository implements DocumentRepository {
  constructor(private readonly chromaClient: ChromaClient) {
    //this.this.chromaClient.vectorClient.addDocuments(documents);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    await this.chromaClient.vectorClient.addDocuments(documents);
  }

  async getSearch(query: string, k?: number): Promise<Document[]> {
    return await this.chromaClient.vectorClient.similaritySearch(query, k);
  }

  getRetriever(searchKwargs = 4): any {
    return this.chromaClient.vectorClient.asRetriever({ k: searchKwargs });
  }
}
