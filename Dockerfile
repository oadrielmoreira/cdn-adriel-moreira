# ─────────────────────────────────────────────
#  Dockerfile — CDN Fitz (Next.js standalone)
#  Pronto para deploy no EasyPanel
# ─────────────────────────────────────────────

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 1) Dependências
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

# 2) Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 3) Runner (imagem final enxuta)
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# diretório persistente de uploads (monte um volume aqui no EasyPanel)
RUN mkdir -p /app/uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# node_modules COMPLETO (necessário para o CLI do Prisma rodar o db push no startup).
# Vem depois do standalone para sobrescrever a versão reduzida que o Next gera.
COPY --from=builder /app/node_modules ./node_modules

ENV PATH="/app/node_modules/.bin:${PATH}"

EXPOSE 3000

# sincroniza o schema com o banco e sobe o servidor
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]