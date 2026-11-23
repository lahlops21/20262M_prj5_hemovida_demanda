import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload, RequisicaoAutenticada } from '../auth.types';

// Entrega o usuario do token ao controller: criar(@UsuarioAtual() usuario: JwtPayload)
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): JwtPayload => {
    const req = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    // O JwtAuthGuard global ja garantiu que existe; se faltar, e erro de configuracao.
    if (!req.user) throw new Error('Rota sem JwtAuthGuard');
    return req.user;
  },
);
