# Build context must be the monorepo root.
# In CI: context: . and file: ./apps/api/Dockerfile

FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --workspace=apps/api --omit=dev

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --workspace=apps/api
COPY apps/api/src         ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/prisma      ./apps/api/prisma
RUN npm run build -w apps/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist       ./apps/api/dist
COPY --from=builder /app/apps/api/prisma     ./apps/api/prisma
COPY --from=deps    /app/node_modules        ./node_modules
COPY apps/api/package.json ./apps/api/
# Generate Prisma client in the runner stage
RUN cd apps/api && npx prisma generate
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
