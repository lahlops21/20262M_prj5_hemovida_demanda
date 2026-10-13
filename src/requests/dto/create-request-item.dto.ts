import { IsIn, IsInt, Max, Min } from 'class-validator';
import { HEMOCOMPONENTES, TIPOS_SANGUINEOS } from '../blood-types';

export class CreateRequestItemDto {
  @IsIn(Object.keys(TIPOS_SANGUINEOS), {
    message: 'tipoSanguineo deve ser A+, A-, B+, B-, AB+, AB-, O+ ou O-',
  })
  tipoSanguineo!: keyof typeof TIPOS_SANGUINEOS;

  @IsIn(HEMOCOMPONENTES, {
    message: `hemocomponente deve ser: ${HEMOCOMPONENTES.join(', ')}`,
  })
  hemocomponente!: (typeof HEMOCOMPONENTES)[number];

  @IsInt({ message: 'quantidadeBolsas deve ser um numero inteiro' })
  @Min(1, { message: 'quantidadeBolsas deve ser no minimo 1' })
  @Max(100, { message: 'quantidadeBolsas deve ser no maximo 100' })
  quantidadeBolsas!: number;
}