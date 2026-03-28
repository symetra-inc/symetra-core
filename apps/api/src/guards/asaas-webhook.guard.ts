import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AsaasWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // O Asaas envia o token de segurança neste cabeçalho
    const asaasToken = request.headers['asaas-access-token'];
    const validToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!asaasToken || asaasToken !== validToken) {
      console.error('🚨 Tentativa de invasão no Webhook Financeiro bloqueada.');
      throw new UnauthorizedException('Acesso Negado: Token de interceção inválido.');
    }

    return true; // Passe livre para o Asaas
  }
}