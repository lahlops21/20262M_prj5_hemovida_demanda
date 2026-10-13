export const TIPOS_SANGUINEOS = {
  'A+': { tipo: 'A_POS', fator: 'POSITIVO' },
  'A-': { tipo: 'A_NEG', fator: 'NEGATIVO' },
  'B+': { tipo: 'B_POS', fator: 'POSITIVO' },
  'B-': { tipo: 'B_NEG', fator: 'NEGATIVO' },
  'AB+': { tipo: 'AB_POS', fator: 'POSITIVO' },
  'AB-': { tipo: 'AB_NEG', fator: 'NEGATIVO' },
  'O+': { tipo: 'O_POS', fator: 'POSITIVO' },
  'O-': { tipo: 'O_NEG', fator: 'NEGATIVO' },
} as const;

export const HEMOCOMPONENTES = [
  'CONCENTRADO_HEMACIAS',
  'PLAQUETAS',
  'PLASMA',
  'CRIOPRECIPITADO',
] as const;

export const TIPOS_SOLICITACAO = ['REPOSICAO', 'EMERGENCIAL'] as const;