import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsString,
  MaxLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { EhLatin1 } from '../../common/validators/eh-latin1.validator';
import { TIPOS_SOLICITACAO } from '../blood-types';
import { CreateRequestItemDto } from './create-request-item.dto';

export class CreateRequestDto {
  @IsIn(TIPOS_SOLICITACAO, {
    message: 'tipo deve ser REPOSICAO ou EMERGENCIAL',
  })
  tipo!: (typeof TIPOS_SOLICITACAO)[number];

  // So e validada (e obrigatoria) quando o pedido e emergencial
  @ValidateIf((dto: CreateRequestDto) => dto.tipo === 'EMERGENCIAL')
  @IsString()
  @IsNotEmpty({ message: 'justificativa e obrigatoria em pedido emergencial' })
  @MaxLength(800)
  @EhLatin1()
  justificativa?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'o pedido precisa ter ao menos um item' })
  @ArrayMaxSize(20, { message: 'o pedido pode ter no maximo 20 itens' })
  @ValidateNested({ each: true })
  @Type(() => CreateRequestItemDto)
  itens!: CreateRequestItemDto[];
}