import { Inject, Injectable } from '@nestjs/common';
import { Document } from 'langchain/document';
import { DocumentRepository } from '../repositories';

export interface UploadDocumentRequest {
  content: string;
  metadata: {
    source: string;
    type?: string;
    [key: string]: any;
  };
}

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(request: UploadDocumentRequest): Promise<void> {
    const document = new Document({
      pageContent: request.content,
      metadata: request.metadata,
    });

    await this.documentRepository.addDocuments([document]);
  }

  async executeMultiple(requests: UploadDocumentRequest[]): Promise<void> {
    const documents = requests.map(
      (request) =>
        new Document({
          pageContent: request.content,
          metadata: request.metadata,
        }),
    );

    await this.documentRepository.addDocuments(documents);
  }
}
