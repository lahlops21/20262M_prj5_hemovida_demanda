// Perfis que existem no token do MS4 (claim "role"). Este servico so usa GESTOR_DEMANDA,
// mas a lista completa evita erro de digitacao e valida o token.
export const Perfil = {
  ADMIN: 'ADMIN',
  RECEPCAO: 'RECEPCAO',
  ENFERMAGEM: 'ENFERMAGEM',
  GESTOR_ESTOQUE: 'GESTOR_ESTOQUE',
  GESTOR_DEMANDA: 'GESTOR_DEMANDA',
  DOADOR: 'DOADOR',
} as const;

export type Perfil = (typeof Perfil)[keyof typeof Perfil];
