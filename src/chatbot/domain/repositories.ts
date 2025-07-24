import { Document } from 'langchain/document';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface DocumentRepository {
  addDocuments: (documents: Document[]) => Promise<void>;
  getSearch: (query: string, k?: number) => Promise<Document[]>;
  getRetriever: (searchKwargs: number) => any;
  getAllDocuments: (options: PaginationOptions) => Promise<PaginatedResponse<Document>>;
}
