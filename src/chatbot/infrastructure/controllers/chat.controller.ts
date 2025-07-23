import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Response } from 'express';
import { ChatUseCase } from '../../domain/use-cases/chat.use-case';

class ChatDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  k?: number = 3;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatUseCase: ChatUseCase) {}

  @Post()
  async chat(@Body() chatDto: ChatDto, @Res() res: Response) {
    try {
      const response = await this.chatUseCase.chat(chatDto.query, chatDto.k);

      return res.status(HttpStatus.OK).json({
        message: 'Chat response generated successfully',
        status: 'success',
        data: {
          response,
          query: chatDto.query,
        },
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to generate chat response',
        status: 'error',
        error: error?.message,
      });
    }
  }
}
