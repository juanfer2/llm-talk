import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClaudeClient {
  private readonly logger = new Logger(ClaudeClient.name);
  private readonly client: ChatAnthropic;

  constructor(private readonly configService: ConfigService) {
    try {
      this.client = new ChatAnthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 4096,
      });
      this.logger.log('Claude client inicializado exitosamente');
    } catch (error) {
      this.logger.error(
        `Error inicializando Claude en ${ClaudeClient.name}:`,
        error,
      );
      throw error;
    }
  }

  getClient(): ChatAnthropic {
    return this.client;
  }

  async invoke(prompt: string): Promise<string> {
    try {
      const response = await this.client.invoke(prompt);
      return response.content as string;
    } catch (error) {
      this.logger.error(
        `Error invocando Claude en ${ClaudeClient.name}:`,
        error,
      );
      throw error;
    }
  }
}
