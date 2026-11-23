import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { Perfil } from '../auth/perfis';
import { lerId } from '../common/helpers/id';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsDto } from './dto/list-requests.dto';
import { RequestsService } from './requests.service';

// Quem esta logado vem do TOKEN (emitido pelo MS4), nao mais de um header.
// So o gestor de demanda acessa; o hospital dele tambem vem do token.
@Roles(Perfil.GESTOR_DEMANDA)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  criar(@UsuarioAtual() usuario: JwtPayload, @Body() dto: CreateRequestDto) {
    return this.requests.criar(usuario, dto);
  }

  @Get()
  listar(@UsuarioAtual() usuario: JwtPayload, @Query() query: ListRequestsDto) {
    return this.requests.listar(usuario, query);
  }

  @Get(':id')
  buscar(@UsuarioAtual() usuario: JwtPayload, @Param('id') id: string) {
    return this.requests.buscarPorId(usuario, lerId(id));
  }

  @Patch(':id/cancel')
  cancelar(@UsuarioAtual() usuario: JwtPayload, @Param('id') id: string) {
    return this.requests.cancelar(usuario, lerId(id));
  }
}
