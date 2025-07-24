import { Inject, Injectable } from '@nestjs/common';
import { ClaudeClient } from '../../infrastructure/adapters/llm/claude.client';
import { DocumentRepository } from '../repositories';

@Injectable()
export class ChatUseCase {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
    private readonly claudeClient: ClaudeClient,
  ) {}

  async chat(query: string, k: number = 3): Promise<string> {
    try {
      // Retrieve relevant documents from ChromaDB
      const relevantDocs = await this.documentRepository.getSearch(query, k);

      // Ensure relevantDocs is an array
      if (!Array.isArray(relevantDocs)) {
        throw new Error('Document search did not return an array');
      }

      // Handle case when no documents are found
      if (relevantDocs.length === 0) {
        return 'Lo siento, no encontré documentos relevantes para responder tu pregunta. Por favor, asegúrate de que hay documentos cargados en la base de datos o intenta con una pregunta diferente.';
      }

      // Build context from retrieved documents
      const context = relevantDocs
        .map((doc, index) => `Document ${index + 1}:\n${doc.pageContent}`)
        .join('\n\n');

      // Create prompt with context and query
      const prompt = `Based on the following context documents, please answer the user's question.

Context:
${context}

Eres WompiBot, asistente oficial de Wompi.

CAPACIDADES:
- Ayudar con integración de APIs
- Explicar flujos de pago
- Resolver errores comunes
- Guiar en configuración de webhooks

TONO: Profesional pero amigable, técnico cuando es necesario.

LIMITACIONES:
- No puedes acceder a cuentas específicas
- No manejas información financiera sensible
- Siempre refiere a soporte para temas de cuenta

Pregunta: ${query}

Por favor, proporcione una respuesta útil y precisa basada en el contexto proporcionado. Si el contexto no contiene suficiente información para responder la pregunta, indíquelo.
`;

      // Get response from Claude
      return await this.claudeClient.invoke(prompt);
    } catch (error) {
      // Handle any errors that occur during the chat process
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to process chat request: ${errorMessage}`);
    }
  }
}
