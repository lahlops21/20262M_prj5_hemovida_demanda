import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { TIPOS_SANGUINEOS } from './blood-types';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsDto } from './dto/list-requests.dto';
import { STATUS_CANCELAMENTO } from './request-status';

function gerarCodigoPedido(): string {
  const data = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const sufixo = randomBytes(3).toString('hex').toUpperCase();
  return `PED-${data}-${sufixo}`;
}

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // O gestor e o hospital vem do TOKEN do MS4 (sub e hospitalId). Nao ha mais tabela
  // de gestor neste servico: gestor_hospital_id guarda o id do usuario no MS4.
  private lerGestor(usuario: JwtPayload) {
    if (usuario.hospitalId === undefined) {
      throw new ForbiddenException('Usuario sem hospital vinculado.');
    }
    return {
      gestor_hospital_id: BigInt(usuario.sub),
      hospital_id: BigInt(usuario.hospitalId),
    };
  }

  async criar(usuario: JwtPayload, dto: CreateRequestDto) {
    const gestor = this.lerGestor(usuario);

    // O hospital do token precisa existir aqui e estar ativo.
    const hospital = await this.prisma.hospital.findUnique({
      where: { hospital_id: gestor.hospital_id },
      select: { hospital_status: true },
    });
    if (!hospital?.hospital_status) {
      throw new ForbiddenException('Hospital inexistente ou inativo.');
    }

    try {
      return await this.prisma.request.create({
        data: {
          hospital_id: gestor.hospital_id,
          gestor_hospital_id: gestor.gestor_hospital_id,
          solicitacao_codigo_pedido: gerarCodigoPedido(),
          solicitacao_tipo_solicitacao: dto.tipo,
          solicitacao_status_atual: 'PENDENTE',
          solicitacao_justificativa_emergencia:
            dto.tipo === 'EMERGENCIAL' ? dto.justificativa : null,
          itens: {
            create: dto.itens.map((item) => ({
              item_solicitacao_tipo_sanguineo:
                TIPOS_SANGUINEOS[item.tipoSanguineo].tipo,
              item_solicitacao_fator_rh:
                TIPOS_SANGUINEOS[item.tipoSanguineo].fator,
              item_solicitacao_hemocomponente: item.hemocomponente,
              item_solicitacao_quantidade_bolsas: item.quantidadeBolsas,
            })),
          },
          historicos: {
            create: {
              gestor_hospital_id: gestor.gestor_hospital_id,
              historico_status_status_anterior: null, // primeiro registro
              historico_status_status_novo: 'PENDENTE',
            },
          },
        },
        include: { itens: true, historicos: true },
      });
    } catch (erro) {
      throw this.traduzirErro(erro);
    }
  }

  async listar(usuario: JwtPayload, query: ListRequestsDto) {
    const gestor = this.lerGestor(usuario);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = { hospital_id: gestor.hospital_id };

    const [total, dados] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        where,
        orderBy: { solicitacao_id: 'desc' }, // mais recentes primeiro
        skip: (page - 1) * limit,
        take: limit,
        select: {
          solicitacao_id: true,
          solicitacao_codigo_pedido: true,
          solicitacao_tipo_solicitacao: true,
          solicitacao_status_atual: true,
          solicitacao_data_hora_criacao: true,
          solicitacao_data_hora_prevista_entrega: true,
          gestor_hospital_id: true,
          _count: { select: { itens: true } },
        },
      }),
    ]);

    return {
      dados,
      paginacao: { page, limit, total, totalPaginas: Math.ceil(total / limit) },
    };
  }

  async buscarPorId(usuario: JwtPayload, id: bigint) {
    const gestor = this.lerGestor(usuario);

    const pedido = await this.prisma.request.findFirst({
      where: { solicitacao_id: id, hospital_id: gestor.hospital_id },
      include: {
        itens: true,
        historicos: {
          orderBy: { historico_status_id: 'asc' }, // linha do tempo
        },
      },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} nao encontrado`);
    return pedido;
  }

  async cancelar(usuario: JwtPayload, id: bigint) {
    const gestor = this.lerGestor(usuario);

    const pedido = await this.prisma.request.findFirst({
      where: { solicitacao_id: id, hospital_id: gestor.hospital_id },
      select: { solicitacao_status_atual: true },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} nao encontrado`);
    if (pedido.solicitacao_status_atual !== 'PENDENTE') {
      throw new ConflictException(
        'So e possivel cancelar pedidos com status PENDENTE',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // O "where" repete a condicao PENDENTE: se outro processo mudou o status
      // entre a checagem acima e agora, nenhuma linha e atualizada (count 0).
      const resultado = await tx.request.updateMany({
        where: { solicitacao_id: id, solicitacao_status_atual: 'PENDENTE' },
        data: { solicitacao_status_atual: STATUS_CANCELAMENTO },
      });
      if (resultado.count === 0) {
        throw new ConflictException('O status do pedido mudou, tente de novo');
      }

      await tx.statusHistory.create({
        data: {
          solicitacao_id: id,
          gestor_hospital_id: gestor.gestor_hospital_id,
          historico_status_status_anterior: 'PENDENTE',
          historico_status_status_novo: STATUS_CANCELAMENTO,
        },
      });
    });

    return this.buscarPorId(usuario, id);
  }

  private traduzirErro(erro: unknown): Error {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        return new ConflictException(
          'Codigo de pedido repetido, tente de novo',
        );
      }
    }
    return erro instanceof Error ? erro : new Error(String(erro));
  }
}
