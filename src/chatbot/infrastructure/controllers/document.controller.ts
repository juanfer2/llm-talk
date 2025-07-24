import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as pdfParse from 'pdf-parse';
import {
  UploadDocumentRequest,
  UploadDocumentUseCase,
} from '../../domain/use-cases/upload-document.use-case';
import { DocumentRepository, PaginatedResponse } from '../../domain/repositories';
import { Document } from 'langchain/document';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class DocumentMetadataDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsOptional()
  @IsString()
  type?: string;

  [key: string]: any;
}

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DocumentMetadataDto)
  metadata: DocumentMetadataDto;
}

export class UploadMultipleDocumentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadDocumentDto)
  documents: UploadDocumentDto[];
}

export class UploadPdfDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class GetDocumentsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

@Controller('documents')
@UsePipes(new ValidationPipe({ transform: true }))
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(@Body() uploadDocumentDto: UploadDocumentDto) {
    const request: UploadDocumentRequest = {
      content: uploadDocumentDto.content,
      metadata: uploadDocumentDto.metadata,
    };

    await this.uploadDocumentUseCase.execute(request);

    return {
      message: 'Document uploaded successfully',
      status: 'success',
    };
  }

  @Post('upload/batch')
  @HttpCode(HttpStatus.CREATED)
  async uploadMultipleDocuments(
    @Body() uploadMultipleDocumentsDto: UploadMultipleDocumentsDto,
  ) {
    const requests: UploadDocumentRequest[] =
      uploadMultipleDocumentsDto.documents.map((doc) => ({
        content: doc.content,
        metadata: doc.metadata,
      }));

    await this.uploadDocumentUseCase.executeMultiple(requests);

    return {
      message: `${requests.length} documents uploaded successfully`,
      status: 'success',
    };
  }

  @Post('upload/pdf')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: UploadedFile | undefined,
    @Body() uploadPdfDto: UploadPdfDto,
  ) {
    if (!file) {
      throw new Error('No PDF file provided');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    try {
      // Parse PDF content
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const pdfData = await (pdfParse as any)(file.buffer);
      const content = (pdfData as { text: string }).text;

      if (!content || content.trim().length === 0) {
        throw new Error('PDF appears to be empty or could not be parsed');
      }

      // Create upload request
      const request: UploadDocumentRequest = {
        content: content,
        metadata: {
          source: uploadPdfDto.source || file.originalname,
          type: 'pdf',
          title: uploadPdfDto.title || file.originalname,
          filename: file.originalname,
          size: file.size,
          uploadDate: new Date().toISOString(),
        },
      };

      await this.uploadDocumentUseCase.execute(request);

      return {
        message: 'PDF uploaded and processed successfully',
        status: 'success',
        filename: file.originalname,
        contentLength: content.length,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process PDF: ${errorMessage}`);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllDocuments(@Query() getDocumentsDto: GetDocumentsDto) {
    try {
      const { page = 1, limit = 10 } = getDocumentsDto;

      const result: PaginatedResponse<Document> = await this.documentRepository.getAllDocuments({
        page,
        limit,
      });

      return {
        message: 'Documents retrieved successfully',
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve documents: ${errorMessage}`);
    }
  }
}
