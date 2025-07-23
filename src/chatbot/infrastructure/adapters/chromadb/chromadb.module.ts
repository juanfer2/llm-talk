import { Document } from '@langchain/core/documents';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadDocumentUseCase } from '../../../domain/use-cases/upload-document.use-case';
import { DocumentController } from '../../controllers/document.controller';
import { ChromaClient } from './client';
import { DocumentCromaRepository } from './repositories/document-chroma.repository';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentController],
  providers: [
    {
      provide: ChromaClient,
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('CHROMADB_URL');

        return new ChromaClient('wompi', url as string);
      },
      inject: [ConfigService],
    },
    {
      provide: DocumentCromaRepository,
      useFactory: (chromaClient: ChromaClient) => {
        const c = new DocumentCromaRepository(chromaClient);
        const d = new Document({
          pageContent: 'Wompi cobra 3.4% + $900 por tarjetas de crédito',
          metadata: { topic: 'comisiones' },
        });

        void c.addDocuments([d]);
        return c;
        //return new DocumentCromaRepository(chromaClient);
      },
      inject: [ChromaClient],
    },
    {
      provide: 'DocumentRepository',
      useExisting: DocumentCromaRepository,
    },
    UploadDocumentUseCase,
  ],
  exports: [DocumentCromaRepository, UploadDocumentUseCase],
})
export class ChromaModule {}
