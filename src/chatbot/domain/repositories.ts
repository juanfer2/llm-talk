import { Document } from 'langchain/document';

export interface DocumentRepository {
  addDocuments: (documents: Document[]) => Promise<void>;
  getSearch: (query: string, k?: number) => Promise<Document[]>;
  getRetriever: (searchKwargs: number) => any;
}
