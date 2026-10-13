export const STATUS_NUMERO = {
  PENDENTE: 1,
  APROVADO_RESERVADO: 2,
  EM_TRANSITO: 3,
  ENTREGUE: 4,
  RECUSADO_ESTOQUE_INSUFICIENTE: 5,
  FALHA_ENVIO: 6,
  // CANCELADO: 7
} as const;

// Este comando é provisório. Trocar por 'CANCELADO' quando o banco ganhar esse valor
export const STATUS_CANCELAMENTO = 'FALHA_ENVIO' as const;