import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MetaSignatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature: string | undefined = request.headers['x-hub-signature-256'];

    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    const appSecret = this.configService.get<string>('META_APP_SECRET');
    if (!appSecret) {
      return false;
    }

    const rawBody: Buffer | undefined = request.rawBody;
    console.log('rawBody:', rawBody); // undefined ou Buffer?
    console.log('headers:', request.headers);
    if (!rawBody) {
      return false;
    }


    const expectedHex = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const receivedHex = signature.slice('sha256='.length);

    if (expectedHex.length !== receivedHex.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedHex),
      Buffer.from(receivedHex),
    );
  }
}
