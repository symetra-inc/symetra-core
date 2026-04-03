import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface JwtUser {
  id: string;
  role: string;
  clinicId: string | null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(token, {
        algorithms: ['HS256'],
      });

      // NextAuth v5 stores user id as `id` (we inject it in the jwt callback)
      (request as Request & { user: JwtUser }).user = {
        id: payload['id'] as string,
        role: payload['role'] as string,
        clinicId: (payload['clinicId'] as string | null) ?? null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractBearer(request: Request): string | null {
    const auth = request.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
