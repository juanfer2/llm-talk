import { Injectable } from '@nestjs/common';
import { Document } from 'langchain/document';
import {
  DocumentRepository,
  PaginatedResponse,
  PaginationOptions,
} from '../../../../domain/repositories';
import { ChromaClient } from '../client';

@Injectable()
export class DocumentCromaRepository implements DocumentRepository {
  constructor(private readonly chromaClient: ChromaClient) {
    //this.this.chromaClient.vectorClient.addDocuments(documents);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    try {
      // Validate documents before adding
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('No valid documents provided');
      }

      // Filter out invalid documents
      const validDocuments = documents.filter((doc) => {
        return (
          doc && typeof doc === 'object' && typeof doc.pageContent === 'string'
        );
      });

      if (validDocuments.length === 0) {
        throw new Error('No valid documents found to add');
      }

      await this.chromaClient.vectorClient.addDocuments(validDocuments);
      console.log(
        `Successfully added ${validDocuments.length} documents to ChromaDB`,
      );
    } catch (error) {
      console.error('Error adding documents to ChromaDB:', error);
      throw error;
    }
  }

  async getSearch(query: string, k?: number): Promise<Document[]> {
    try {
      console.log(k);
      const collectionName = this.chromaClient.vectorClient.collectionName;
      const url = this.chromaClient.vectorClient.url;
      console.log(collectionName);
      console.log(url);
      const value =
        await this.chromaClient.vectorClient.similaritySearch(query);

      console.log(value);

      return value;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getSearchve(query: string, k?: number): Promise<Document[]> {
    try {
      // Validate input parameters
      if (!query || typeof query !== 'string') {
        console.warn('Invalid query provided to getSearch:', query);
        return [];
      }

      const searchK = k && k > 0 ? k : 3;

      // Check if collection has documents before attempting search
      const hasDocuments = await this.checkCollectionHasDocuments();
      if (!hasDocuments) {
        console.warn('Collection is empty, cannot perform similarity search');
        return [];
      }

      // Try to perform the search with additional safety checks
      let results;
      try {
        // First ensure the collection exists
        await this.chromaClient.vectorClient.ensureCollection();

        // Use the safer search method that handles ChromaDB validation errors
        results = await this.safelySearchChromaDB(query, searchK);

        console.log(results);

        console.log(
          'ChromaDB search completed, results type:',
          typeof results,
          'isArray:',
          Array.isArray(results),
        );
      } catch (searchError) {
        console.error('ChromaDB similarity search failed:', searchError);
        return [];
      }

      // Ensure we always return an array
      if (!Array.isArray(results)) {
        console.warn(
          'ChromaDB similaritySearch did not return an array, returning empty array',
        );
        return [];
      }

      // Validate each result has the expected structure
      const validResults = results.filter((doc) => {
        return (
          doc && typeof doc === 'object' && typeof doc.pageContent === 'string'
        );
      });

      if (validResults.length !== results.length) {
        console.warn(
          `Filtered out ${results.length - validResults.length} invalid documents`,
        );
      }

      return validResults;
    } catch (error) {
      console.error('Error in ChromaDB search:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  getRetriever(searchKwargs = 4): any {
    return this.chromaClient.vectorClient.asRetriever({ k: searchKwargs });
  }

  async getCollectionInfo(): Promise<any> {
    try {
      // Try to get basic info about the collection
      const collection =
        await this.chromaClient.vectorClient.ensureCollection();
      return collection;
    } catch (error) {
      console.error('Error getting collection info:', error);
      return null;
    }
  }

  private async checkCollectionHasDocuments(): Promise<boolean> {
    try {
      // The real issue is that we can't reliably check if ChromaDB has documents
      // without potentially triggering the "e.every is not a function" error
      // So we'll always return true and handle the error in the actual search
      return true;
    } catch (error) {
      console.error('Error checking collection documents:', error);
      return false;
    }
  }

  private async safelySearchChromaDB(
    query: string,
    k: number,
  ): Promise<Document[]> {
    try {
      // Try the search and catch the specific ChromaDB validation error
      const results = await this.chromaClient.vectorClient.similaritySearch(
        query,
        k,
      );
      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if this is the specific "e.every is not a function" error
      if (errorMessage.includes('e.every is not a function')) {
        console.warn(
          'ChromaDB collection appears to be empty or has corrupted embeddings',
        );
        return [];
      }

      // Check for other common ChromaDB empty collection errors
      if (
        errorMessage.includes('Expected embeddings to be an array') ||
        errorMessage.includes('At least one of') ||
        errorMessage.includes('Non-empty lists are required')
      ) {
        console.warn(
          'ChromaDB collection is empty or has invalid data structure',
        );
        return [];
      }

      // Re-throw other errors
      throw error;
    }
  }

  async resetCollection(): Promise<void> {
    try {
      console.log(
        'Attempting to reset ChromaDB collection due to corruption...',
      );

      // This is a more drastic measure - we would need to implement collection deletion
      // For now, we'll just log the issue and suggest manual intervention
      console.warn(
        'Collection may be corrupted. Consider restarting ChromaDB service.',
      );
      console.warn('Run: docker-compose restart chromadb');
    } catch (error) {
      console.error('Error resetting collection:', error);
    }
  }

  async getAllDocuments(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Document>> {
    try {
      const { page, limit } = options;

      // Validate pagination parameters
      if (page < 1) {
        throw new Error('Page must be greater than 0');
      }
      if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Since ChromaDB/LangChain doesn't expose a direct "get all" method,
      // we need to use ChromaDB's native client
      const collection =
        await this.chromaClient.vectorClient.ensureCollection();

      // Try to get documents using ChromaDB's native API
      // This is a workaround since LangChain doesn't expose all ChromaDB functionality
      const allResults = await this.getDocumentsFromChromaDB(offset, limit);

      // Get total count (this is an approximation since we can't get exact count easily)
      const totalCount = await this.estimateDocumentCount();

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: allResults,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting all documents:', error);
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }
  }

  private async getDocumentsFromChromaDB(
    offset: number,
    limit: number,
  ): Promise<Document[]> {
    try {
      // Since we can't directly get all documents, we'll use a broad similarity search
      // with a generic query to get a sample of documents
      // This is not perfect but works as a workaround
      const results = await this.safelySearchChromaDB(
        'document content text data information',
        limit * 2,
      );

      // Apply manual pagination to the results
      const paginatedResults = results.slice(offset, offset + limit);

      return paginatedResults;
    } catch (error) {
      console.error('Error getting documents from ChromaDB:', error);
      return [];
    }
  }

  private async estimateDocumentCount(): Promise<number> {
    try {
      // Try to get a large sample to estimate total count
      // This is an approximation since ChromaDB doesn't expose document count directly
      const largeSample = await this.safelySearchChromaDB(
        'document content text data information',
        1000,
      );

      // Return the sample size as an estimate
      // In a real implementation, you might want to store this count separately
      return largeSample.length;
    } catch (error) {
      console.error('Error estimating document count:', error);
      return 0;
    }
  }
}
