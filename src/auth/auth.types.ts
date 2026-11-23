import type { Request } from 'express';
import type { Perfil } from './perfis';

// Contrato do token emitido pelo MS4 (HS256, mesmo JWT_SECRET nos servicos):
// sub = id do usuario (numero), role = perfil, hospitalId = so para GESTOR_DEMANDA.
export interface JwtPayload {
  sub: number;
  role: Perfil;
  hospitalId?: number;
}

export type RequisicaoAutenticada = Request & { user?: JwtPayload };
