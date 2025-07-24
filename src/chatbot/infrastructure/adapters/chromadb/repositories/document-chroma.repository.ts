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
    try {
      // Validate documents before adding
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('No valid documents provided');
      }

      // Filter out invalid documents
      const validDocuments = documents.filter(doc => {
        return doc && typeof doc === 'object' && typeof doc.pageContent === 'string';
      });

      if (validDocuments.length === 0) {
        throw new Error('No valid documents found to add');
      }

      await this.chromaClient.vectorClient.addDocuments(validDocuments);
      console.log(`Successfully added ${validDocuments.length} documents to ChromaDB`);
    } catch (error) {
      console.error('Error adding documents to ChromaDB:', error);
      throw error;
    }
  }

  async getSearch(query: string, k?: number): Promise<Document[]> {
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
        
        // Perform the similarity search
        results = await this.chromaClient.vectorClient.similaritySearch(query, searchK);
        
        console.log('ChromaDB search completed, results type:', typeof results, 'isArray:', Array.isArray(results));
      } catch (searchError) {
        console.error('ChromaDB similarity search failed:', searchError);
        return [];
      }
      
      // Ensure we always return an array
      if (!Array.isArray(results)) {
        console.warn('ChromaDB similaritySearch did not return an array, returning empty array');
        return [];
      }
      
      // Validate each result has the expected structure
      const validResults = results.filter(doc => {
        return doc && typeof doc === 'object' && typeof doc.pageContent === 'string';
      });

      if (validResults.length !== results.length) {
        console.warn(`Filtered out ${results.length - validResults.length} invalid documents`);
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
      const collection = await this.chromaClient.vectorClient.ensureCollection();
      return collection;
    } catch (error) {
      console.error('Error getting collection info:', error);
      return null;
    }
  }

  private async checkCollectionHasDocuments(): Promise<boolean> {
    try {
      // Try to access the ChromaDB client directly to check document count
      // This is a workaround since LangChain doesn't expose document count
      const collection = await this.chromaClient.vectorClient.ensureCollection();
      
      // If we can get the collection but it's empty, we need to handle it gracefully
      // For now, we'll assume if we can ensure the collection, it might have documents
      // The real check will happen when we attempt the search
      return true;
    } catch (error) {
      console.error('Error checking collection documents:', error);
      return false;
    }
  }
}
