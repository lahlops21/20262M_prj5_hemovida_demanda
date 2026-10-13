import { BadRequestException } from '@nestjs/common';

export function lerGestorId(valor?: string): bigint {
  if (!valor || !/^\d+$/.test(valor)) {
    throw new BadRequestException(
      'Header x-gestor-id e obrigatorio e deve ser numerico',
    );
  }
  return BigInt(valor);
}