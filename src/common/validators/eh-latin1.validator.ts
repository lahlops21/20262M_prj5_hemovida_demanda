import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

// Enquanto a coluna do banco for latin1, emoji e varios simbolos nao cabem nela.
// Depois que o banco virar utf8mb4, ligue JUSTIFICATIVA_UTF8=true no Infisical/.env:
// a checagem passa a aceitar tudo (emoji, aspas curvas, travessao...). Sem a variavel,
// o comportamento antigo continua, entao da para publicar o codigo ANTES do banco mudar.
export const aceitaUtf8Completo = (): boolean => process.env.JUSTIFICATIVA_UTF8 === 'true';

export function EhLatin1(options?: ValidationOptions) {
  return function (objeto: object, propriedade: string): void {
    registerDecorator({
      name: 'ehLatin1',
      target: objeto.constructor,
      propertyName: propriedade,
      options,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') return true;
          if (aceitaUtf8Completo()) return true;
          return [...valor].every((c) => c.charCodeAt(0) <= 255);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contem caracteres que o banco nao consegue armazenar (emoji ou simbolos fora do latin1)`;
        },
      },
    });
  };
}
