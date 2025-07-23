import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatUseCase } from '../../../domain/use-cases/chat.use-case';
import { UploadDocumentUseCase } from '../../../domain/use-cases/upload-document.use-case';
import { ChatController } from '../../controllers/chat.controller';
import { DocumentController } from '../../controllers/document.controller';
import { ClaudeClient } from '../llm/claude.client';
import { ChromaClient } from './client';
import { DocumentCromaRepository } from './repositories/document-chroma.repository';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentController, ChatController],
  providers: [
    {
      provide: ChromaClient,
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('CHROMA_DB_URL');

        return new ChromaClient('wompi', url as string, configService);
      },
      inject: [ConfigService],
    },
    {
      provide: DocumentCromaRepository,
      useFactory: (chromaClient: ChromaClient) => {
        return new DocumentCromaRepository(chromaClient);
      },
      inject: [ChromaClient],
    },
    {
      provide: 'DocumentRepository',
      useExisting: DocumentCromaRepository,
    },
    {
      provide: ClaudeClient,
      useFactory: (configService: ConfigService) => {
        return new ClaudeClient(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: 'LLMClient',
      useExisting: ClaudeClient,
    },
    UploadDocumentUseCase,
    ChatUseCase,
  ],
  exports: [
    DocumentCromaRepository,
    UploadDocumentUseCase,
    ClaudeClient,
    ChatUseCase,
  ],
})
export class ChromaModule {}
