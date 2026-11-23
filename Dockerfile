# ==============================================================================
# Dockerfile Multietapa de Producción — KOYOSIAT S.R.L. (Dokploy / Traefik)
# ==============================================================================

# 1. Compilación del Frontend (React + Vite + Tailwind CSS)
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# 2. Preparación y Generación de Prisma para Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ ./

# 3. Imagen Final Ligera de Producción
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_DIST=/app/client-dist

# Dependencias del sistema necesarias para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

# Copiar paquetes e instalar dependencias del backend
COPY backend/package*.json ./
RUN npm install

# Copiar esquema de Prisma y generar cliente
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copiar código fuente del backend
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Copiar el frontend compilado (dist) para que Fastify lo sirva directamente
COPY --from=frontend-builder /app/frontend/dist /app/client-dist

# Copiar script de arranque con migraciones automáticas
COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3001 80

CMD ["/app/entrypoint.sh"]
