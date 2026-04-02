import { Controller, Get, Post, Body, Query, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { MetaWebhookService } from '../services/meta.service';
import { MetaSignatureGuard } from '../../../webhooks/guards/meta-signature.guard';

@Controller('webhooks/meta')
export class MetaWebhookController {
  constructor(private readonly metaService: MetaWebhookService,
  private readonly configService: ConfigService
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = this.configService.get<string>('META_VERIFY_TOKEN');
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(HttpStatus.OK).send(challenge);
    }

    return res.status(HttpStatus.FORBIDDEN).send('Acesso Negado');
  }

  @UseGuards(MetaSignatureGuard)
  @Post()
  async handleEvent(@Body() body: any, @Res() res: Response) {
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    this.metaService.processIncomingMessage(body);
  }
}
