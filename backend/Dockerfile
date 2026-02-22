# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Copy non-TS files (like .lua) to dist folder
RUN mkdir -p dist/redis && cp src/redis/*.lua dist/redis/

# ─────────────────────────────────────────────────────────────────────────────
# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output
COPY --from=builder /app/dist ./dist
# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY src/prisma/schema.prisma ./schema.prisma

ENV NODE_ENV=production

EXPOSE 4000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=schema.prisma && node dist/index.js"]
