import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  UploadDocumentRequest,
  UploadDocumentUseCase,
} from '../../domain/use-cases/upload-document.use-case';

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

@Controller('documents')
@UsePipes(new ValidationPipe({ transform: true }))
export class DocumentController {
  constructor(private readonly uploadDocumentUseCase: UploadDocumentUseCase) {}

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
}
