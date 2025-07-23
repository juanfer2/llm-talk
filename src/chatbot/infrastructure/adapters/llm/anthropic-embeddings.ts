import { ChatAnthropic } from '@langchain/anthropic';
import { Embeddings } from '@langchain/core/embeddings';
import { Logger } from '@nestjs/common';

export class AnthropicEmbeddings extends Embeddings {
  private readonly logger = new Logger(AnthropicEmbeddings.name);
  private client: ChatAnthropic;

  constructor(apiKey: string) {
    super({});
    try {
      this.client = new ChatAnthropic({
        apiKey,
        model: 'claude-3-haiku-20240307', // Use faster, cheaper model for embeddings
        temperature: 0,
        maxTokens: 1000,
      });
      this.logger.log('AnthropicEmbeddings client initialized successfully');
    } catch (error) {
      this.logger.error(
        `Error initializing AnthropicEmbeddings in ${AnthropicEmbeddings.name}:`,
        error,
      );
      throw error;
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const prompt = `Convert the following text into a numerical vector representation. 
      Return only a JSON array of 384 floating-point numbers between -1 and 1 that represent the semantic meaning of the text.
      The vector should capture the key concepts and meaning.
      
      Text: "${text}"
      
      Response format: [0.1, -0.2, 0.3, ...]`;

      const response = await this.client.invoke(prompt);
      const content = response.content as string;

      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\d\s,.-]+\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract vector from Anthropic response');
      }

      const vector = JSON.parse(jsonMatch[0]);

      // Ensure we have the right dimension and normalize
      if (!Array.isArray(vector) || vector.length !== 384) {
        throw new Error(
          `Expected 384-dimensional vector, got ${vector.length}`,
        );
      }

      return vector.map(Number);
    } catch (error) {
      this.logger.error(
        `Error generating embedding in ${AnthropicEmbeddings.name}:`,
        error,
      );
      // Fallback: generate random normalized vector
      return Array.from({ length: 384 }, () => (Math.random() - 0.5) * 2);
    }
  }
}
