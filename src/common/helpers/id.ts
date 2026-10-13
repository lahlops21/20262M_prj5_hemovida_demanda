import { BadRequestException } from '@nestjs/common';

export function lerId(valor: string): bigint {
  if (!/^\d{1,18}$/.test(valor)) {
    throw new BadRequestException('id deve ser um numero inteiro positivo');
  }
  return BigInt(valor);
}