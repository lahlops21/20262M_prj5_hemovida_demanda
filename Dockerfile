# ---------- Etapa 1: build ----------
# Mesma base do Ralph (Debian slim), mas com a versão do Node do seu .nvmrc
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Dependências necessárias ao Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Gera o Prisma Client com URL temporária (não vai para a imagem final)
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate --config prisma7.config.ts

# Compila o Nest.js (gera a pasta dist)
RUN npm run build && find dist -name "main.js"

# Remove dependências de desenvolvimento
RUN npm prune --omit=dev

# ---------- Etapa 2: imagem final ----------
FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 7504

CMD ["node", "dist/main"]