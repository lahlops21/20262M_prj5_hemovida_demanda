# ---------- Etapa 1: build ----------
# Use a mesma versão do Node que está no seu arquivo .nvmrc
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Gera o Prisma Client. A URL abaixo é só um valor de mentira para o generate
# não reclamar; ela NÃO vai para a imagem final.
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate --config prisma7.config.ts

# Compila o Nest.js (gera a pasta dist)
RUN npm run build

# Remove dependências de desenvolvimento
RUN npm prune --omit=dev

# ---------- Etapa 2: imagem final ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3000

CMD ["node", "dist/main"]