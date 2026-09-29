# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer toutes les dépendances (dev incluses, nécessaires pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Build TypeScript (NestJS)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Installer uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le build compilé depuis le stage précédent
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check (NestJS Terminus expose /health via le préfixe API configuré)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) process.exit(1)})" || exit 1

# Start
CMD ["node", "dist/main"]
