import { Injectable, Inject } from '@nestjs/common';
import { DocumentRepository } from '../repositories';
import { ClaudeClient } from '../../infrastructure/adapters/llm/claude.client';

@Injectable()
export class ChatUseCase {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
    private readonly claudeClient: ClaudeClient,
  ) {}

  async chat(query: string, k: number = 3): Promise<string> {
    // Retrieve relevant documents from ChromaDB
    const relevantDocs = await this.documentRepository.getSearch(query, k);
    
    // Build context from retrieved documents
    const context = relevantDocs
      .map((doc, index) => `Document ${index + 1}:\n${doc.pageContent}`)
      .join('\n\n');

    // Create prompt with context and query
    const prompt = `Based on the following context documents, please answer the user's question.

Context:
${context}

Question: ${query}

Please provide a helpful and accurate answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so.`;

    // Get response from Claude
    return await this.claudeClient.invoke(prompt);
  }
}