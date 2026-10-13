import {
  Body, Controller, Get, Headers, Param, Patch, Post, Query,
} from '@nestjs/common';
import { lerGestorId } from '../common/helpers/gestor-id';
import { lerId } from '../common/helpers/id';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsDto } from './dto/list-requests.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  criar(
    @Headers('x-gestor-id') gestor: string | undefined,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requests.criar(lerGestorId(gestor), dto);
  }

  @Get()
  listar(
    @Headers('x-gestor-id') gestor: string | undefined,
    @Query() query: ListRequestsDto,
  ) {
    return this.requests.listar(lerGestorId(gestor), query);
  }

  @Get(':id')
  buscar(
    @Headers('x-gestor-id') gestor: string | undefined,
    @Param('id') id: string,
  ) {
    return this.requests.buscarPorId(lerGestorId(gestor), lerId(id));
  }

  @Patch(':id/cancel')
  cancelar(
    @Headers('x-gestor-id') gestor: string | undefined,
    @Param('id') id: string,
  ) {
    return this.requests.cancelar(lerGestorId(gestor), lerId(id));
  }
}