import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AsaasWebhookGuard implements CanActivate {
  private readonly logger = new Logger(AsaasWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const webhookSecret = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!webhookSecret) {
      this.logger.warn('[WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado — validação de token ignorada (modo teste).');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.headers['asaas-access-token'];

    if (token !== webhookSecret) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
