import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, RequisicaoAutenticada } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Perfil } from '../perfis';

// Guard GLOBAL: este servico NAO emite token, so confere o que o MS4 emitiu.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;

    const req = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token ausente ou invalido.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      if (
        !Number.isInteger(payload.sub) ||
        !Object.values(Perfil).includes(payload.role) ||
        (payload.hospitalId !== undefined &&
          !Number.isInteger(payload.hospitalId))
      ) {
        throw new Error('payload invalido');
      }
      req.user = {
        sub: payload.sub,
        role: payload.role,
        ...(payload.hospitalId !== undefined && {
          hospitalId: payload.hospitalId,
        }),
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token ausente ou invalido.');
    }
  }
}
