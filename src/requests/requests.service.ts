import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TIPOS_SANGUINEOS } from './blood-types';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsDto } from './dto/list-requests.dto';
import { STATUS_CANCELAMENTO, STATUS_NUMERO } from './request-status';

const NOME_DO_GESTOR = {
  select: { gestor_hospital_nome_completo: true },
} as const;

function gerarCodigoPedido(): string {
  const data = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const sufixo = randomBytes(3).toString('hex').toUpperCase();
  return `PED-${data}-${sufixo}`;
}

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // Unico ponto de acesso ao gestor (depois vira o microsservico de usuarios)
  private async buscarGestor(gestorId: bigint) {
    const gestor = await this.prisma.hospitalManager.findUnique({
      where: { gestor_hospital_id: gestorId },
      select: { gestor_hospital_id: true, hospital_id: true },
    });
    if (!gestor) {
      throw new NotFoundException(`Gestor ${gestorId} nao encontrado`);
    }
    return gestor;
  }

  async criar(gestorId: bigint, dto: CreateRequestDto) {
    const gestor = await this.buscarGestor(gestorId);

    try {
      return await this.prisma.request.create({
        data: {
          hospital_id: gestor.hospital_id,
          gestor_hospital_id: gestor.gestor_hospital_id,
          solicitacao_codigo_pedido: gerarCodigoPedido(),
          solicitacao_tipo_solicitacao: dto.tipo,
          solicitacao_status: 1,
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
              item_solicitacao_status: 1,
            })),
          },
          historicos: {
            create: {
              gestor_hospital_id: gestor.gestor_hospital_id,
              historico_status_status_anterior_id: 0n,
              historico_status_status_novo_id: BigInt(STATUS_NUMERO.PENDENTE),
              historico_status_status: 1,
            },
          },
        },
        include: { itens: true, historicos: true },
      });
    } catch (erro) {
      throw this.traduzirErro(erro);
    }
  }

  async listar(gestorId: bigint, query: ListRequestsDto) {
    const gestor = await this.buscarGestor(gestorId);
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
          gestor: NOME_DO_GESTOR,
          _count: { select: { itens: true } },
        },
      }),
    ]);

    return {
      dados,
      paginacao: { page, limit, total, totalPaginas: Math.ceil(total / limit) },
    };
  }

  async buscarPorId(gestorId: bigint, id: bigint) {
    const gestor = await this.buscarGestor(gestorId);

    const pedido = await this.prisma.request.findFirst({
      where: { solicitacao_id: id, hospital_id: gestor.hospital_id },
      include: {
        gestor: NOME_DO_GESTOR,
        itens: true,
        historicos: {
          orderBy: { historico_status_id: 'asc' }, // linha do tempo
          include: { gestor: NOME_DO_GESTOR },
        },
      },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} nao encontrado`);
    return pedido;
  }

  async cancelar(gestorId: bigint, id: bigint) {
    const gestor = await this.buscarGestor(gestorId);

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
          historico_status_status_anterior_id: BigInt(STATUS_NUMERO.PENDENTE),
          historico_status_status_novo_id: BigInt(
            STATUS_NUMERO[STATUS_CANCELAMENTO],
          ),
          historico_status_status: 1,
        },
      });
    });

    return this.buscarPorId(gestorId, id);
  }

  private traduzirErro(erro: unknown): Error {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        return new ConflictException('Codigo de pedido repetido, tente de novo');
      }
    }
    return erro instanceof Error ? erro : new Error(String(erro));
  }
}