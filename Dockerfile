# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer dépendances
RUN npm ci

# Copier source
COPY . .

# Générer Prisma client
RUN npm run prisma:generate

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Installer dépendances de production seulement
COPY package*.json ./
RUN npm ci --only=production

# Copier build depuis builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["node", "dist/main"]
