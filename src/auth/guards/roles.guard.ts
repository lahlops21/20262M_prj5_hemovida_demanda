import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Perfil } from '../perfis';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequisicaoAutenticada } from '../auth.types';

// Guard GLOBAL, roda depois do JwtAuthGuard. Sem @Roles, qualquer perfil logado passa.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Perfil[] | undefined>(
      ROLES_KEY,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (!exigidos || exigidos.length === 0) return true;

    const req = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (!req.user || !exigidos.includes(req.user.role)) {
      throw new ForbiddenException('Voce nao tem permissao para esta acao.');
    }
    return true;
  }
}
