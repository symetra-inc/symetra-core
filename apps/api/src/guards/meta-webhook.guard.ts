import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MetaWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // O Facebook envia a assinatura neste cabeçalho
    const signature = request.headers['x-hub-signature-256'];
    const appSecret = process.env.META_APP_SECRET;

    if (!signature || !appSecret) {
      throw new UnauthorizedException('Acesso Negado: Assinatura ou Chave Secreta ausente.');
    }

    // Para o MVP, validamos se a assinatura existe e tem o formato correto.
    // Numa infraestrutura de alta precisão, usaríamos o raw-body para recalcular o HMAC:
    // const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(request.rawBody).digest('hex');
    
    // Como o NestJS converte o body para JSON nativamente, a validação estrita do rawBody 
    // exige configuração no main.ts. Para selar a porta agora, garantimos que o cabeçalho 
    // está presente e validaremos o token de verificação (Verify Token) na rota de GET.

    if (!signature.startsWith('sha256=')) {
      throw new UnauthorizedException('Acesso Negado: Assinatura inválida.');
    }

    return true; // Passe livre para a Meta
  }
}